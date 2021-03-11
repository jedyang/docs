## Netty中的高性能任务调度--时间轮算法

Netty中很多地方都要用到定时任务，比如最常见的心跳检测。对于Netty这种高性能组件，在定时任务调度方面有什么独到之处？

为了实现高性能的定时任务调度，Netty 引入了时间轮算法来驱动定时任务的执行。

### 定时任务的本质

定时任务一般有三种表现形式：周期性执行，延时执行，指定时间执行。

定时器的本质是要设计一种数据结构，能够存储和调度任务集合，并且离执行时间越近的任务拥有越高的优先级。

那么定时器怎么知道一个任务快到期了呢？

定时器需要通过轮询的方式，每隔一个时间片去检查是否有任务到期。

所以定时器内部至少有一个存储任务的队列，和一个执行轮询的异步线程。

java原生提供了三种定时器的实现：Timer、DelayedQueue 和 ScheduledThreadPoolExecutor。

#### Timer

```
        Timer timer = new Timer();
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                System.out.println(LocalDateTime.now());
            }
        }, 1000, 1000);
```

看一下Timer的结构

```
public class Timer {
    private final TaskQueue queue = new TaskQueue();

    private final TimerThread thread = new TimerThread(queue);
    }
```

使用TaskQueue存储任务队列。使用一个TimerThread作为轮询线程。

看看TaskQueue的数据结构

```
class TaskQueue {
    private TimerTask[] queue = new TimerTask[128];
    }
```

实际上，TaskQueue是一个由数组实现的小根堆。所以最近的任务始终在堆顶，取到这个任务的时间复杂度永远是O(1)。采用小根堆这种数据结构存储非常合理。根据小根堆的特点，添加和删除一个节点的时间复杂度是O(logn)

然后启动TimerThread线程不断轮询TaskQueue中的任务，看看堆顶任务该不该执行。

##### Timer的缺陷

Timer结构清晰，简单。但是他有很大的缺陷，基本不会被使用。

- Timer是单线程
- 调度是基于系统的绝对时间，如果系统时间不正确，可能会出问题
- 一个TimerTask出现异常并且没有捕获处理，Timer会异常退出，其他任务也不会得到执行了。

#### DelayedQueue

DelayedQueue 是可以用于延迟执行的阻塞队列。内部使用PriorityQueue优先级队列来存储对象。

DelayQueue 中的每个对象都必须实现 Delayed 接口，并重写 compareTo 和 getDelay 方法。

compareTo 方法用于优先级队列排序，getDelay 方法用于计算消息延时。

延时队列一般用于失败重试的场景。

新增和删除对象的时间复杂度是O(logn)

#### ScheduledThreadPoolExecutor

因为Timer的上述缺陷，java提供了ScheduledThreadPoolExecutor进行替代。

```
 ScheduledExecutorService executor = Executors.newScheduledThreadPool(5);

 executor.scheduleAtFixedRate(() -> System.out.println("Hello World"), 1000, 2000, TimeUnit.MILLISECONDS); // 1s 延迟后开始执行任务，每 2s 重复执行一次

```

ScheduledThreadPoolExecutor内部使用重新设计的延时阻塞队列DelayedWorkQueue。DelayedWorkQueue内部也是个优先级队列。

使用线程池不断轮询执行任务。

新增和删除任务的时间复杂度是O(logn)

总结：从这三个定时器来看，他们都是由任务队列，任务管理，任务调度三种角色，新增和删除的时间复杂度都是O(logn)。

所以有没有时间复杂度更小的定时器呢？

### 时间轮算法

对于性能要求较高的场景，我们一般使用时间轮算法。

#### 原理

时间轮这个名字听起来高大上，其实解释完了也很简单。

技术来源于生活。时间轮我们完全可以类别我们生活中的钟表。比如，我们将钟表分为60个槽slot。分别代表60s。假设当前指针指在其实位置0，那么需要延时3秒执行的任务，可以挂在3这个槽上。延时100秒的只能挂在40这个槽上。这样我们还需要记录一下这个任务本轮不执行，下一轮执行，可以在任务上加一个标记为round=1。轮第一圈的时候坚持round，不是0的，减一。是0的，立即执行。

这样会有多个任务挂在同一个slot下，这个hashmap很像。不多说了。

这其实就是个有限个数的环形队列。新增和删除任务的时间复杂度都是O(1)。

这就是时间轮的基本原理。

#### HashedWheelTimer

Netty中时间轮的实现是HashedWheelTimer 。

```
    public HashedWheelTimer(
            ThreadFactory threadFactory,
            long tickDuration, TimeUnit unit, int ticksPerWheel, boolean leakDetection,
            long maxPendingTimeouts) 
```

HashedWheelTimer的构造函数揭示了HashedWheelTimer的结构核心属性

- threadFactory，执行线程池。但是里面只创建一个线程
- tickDuration，时钟每跳一次的时间间隔。就是一个slot代表多少时间
- unit，一跳的时间单位
- ticksPerWheel，时间轮上一共有多少个 槽，默认 512 个。分配的 slot 越多，占用的内存空间就越大
- maxPendingTimeouts：最大运行等待的任务数
- leakDetection，是否开启内存泄漏检测



整个时间轮是一个HashedWheelBucket 数组，每个槽是一个HashedWheelBucket。 HashedWheelBucket内部是一个双向链表。链表的每一个对象是一个HashedWheelTimeout 对象。一个HashedWheelTimeout 代表一个定时任务。

工作线程执行轮询，是直接sleep一跳的时间。为了避免线程频繁sleep唤醒，一跳的时间至少是1ms。

HashedWheelTimer 并不是十全十美的，他也有一些潜在的问题：

- 如果长时间没有到期任务，那么会存在时间轮空推进的现象。
- 因为 Worker 是单线程的，只适用于处理耗时较短的任务，如果一个任务执行的时间过长，会造成 Worker 线程阻塞。
- 相比传统定时器的实现方式，内存占用较大。

空推进问题可以参考kafka的多级时间轮