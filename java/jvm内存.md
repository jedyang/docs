从小我就对Java有着深厚的感情，算下来有几十年的Java经验了。当年的Java还是Sun公司的，我有着多年的Servlet经验，CURD经验，在现在已经被自我革新，转而研究人生的哲学。罢了，不吹了。本文是关于Java故障排查的，属上篇。

为了保证文章的流畅性，我决定一口气把它写完。因为相关方面的培训做的多了，就不需要在写的时候参考资料、翻源代码。掐指一算，本文一个小时没花掉，但篇幅已经较长了。

长了，那就割断。本篇就定为内存排查的上篇，主要讲一些原理。为什么要讲原理？开车还需要了解汽车结构么？

这还真不能相比。

汽车很少坏，出了问题你会花钱给拖车公司、4S店。你还会每年给它买上保险。

反观Java，三天两头出问题，找人解决还找不到人，给钱都不一定能解决问题。能比么？盘点来盘点去，最后只能靠自己。

- 1.内存里都有啥
- 2.操作系统内存
- 3.JVM内存划分
- 4.一图解千愁，jvm内存从来没有这么简单过！
- 5.为什么会有内存问题
- 6.垃圾回收器
- 7.重要概念GC Roots
- 8.对象的提升

## 1.内存里都有啥

要想排查内存问题，我们就需要看一下内存里都有啥。我们先来看一下操作系统内存的划分，然后再来看一下JVM内存的划分。由于JVM本身是作为一个正常的应用运行在操作系统上的，所以它的行为同时会受到操作系统的限制。

## 2.操作系统内存

![img](https://mmbiz.qpic.cn/mmbiz_png/cvQbJDZsKLoel1sWD0Fhj2E7PXdrgRwszbmq1FE3uqIgK9aqhKQLcHOwnRpApBxm8M1POex67UxQqx0J3LJwIw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

我们首先从操作系统的实现来说起。通常情况下，我们写了一个C语言程序，编译后，会发现里面的内存地址是固定的。其实我们的应用程序在编译之后，这些地址都是虚拟地址。他需要经过一层翻译之后，才能映射到真正的物理内存，MMU就是负责地址转换的硬件。

![img](https://mmbiz.qpic.cn/mmbiz_png/cvQbJDZsKLoel1sWD0Fhj2E7PXdrgRwsmcOXiaQDwlO8g1qSnBtrZ1HEztR9MIJhJTTeV3J2gXxkNtal9j3KmxA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

那我们操作系统的可用内存到底是多少呢？它其实是分为两部分的。一部分是物理内存，指的是我们插的那根内存条；另一部分就是使用磁盘模拟的虚拟内存，在Linux通常称做swap分区。所以，可用内存 = 物理内存 + 虚拟内存。如果你的系统开了swap，可用内存就比物理内存大。

![img](https://mmbiz.qpic.cn/mmbiz_png/cvQbJDZsKLoel1sWD0Fhj2E7PXdrgRwsKFuSXhU0HnugAVbdyISqQ3ovZKgSIWwUjQYCWpHoib1wMqDzQFjadmg/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

通过top命令和free命令都可以看到内存的使用情况。

top命令可以看到每一个进程的内存使用情况，我们平常关注的是`RES`这一列，它代表的是进程实际的内存占用，我们平常在搭建监控系统的时候，监控的也是这个数值。

我们再来看一下free命令的展示。它的展示其实是有一些混乱的，具体的关系可以看上面的图。通常情况下，free显示的数值都是比较小的，但这并不等于系统的可用内存就那么一点点。Linux操作系统启动后，随着机器的运行，剩余内存会迅速被buffer和cache这些缓冲区和缓存迅速占满，而这些内存再应用的内存空间不足时，是可以释放的。**可用内存 =  free + buffers + cached**。

具体每一个区域的内存使用情况，可以通过`/proc/meminfo`进行查看的。

```
# cat /proc/meminfo
MemTotal:        3881692 kB
MemFree:          249248 kB
MemAvailable:    1510048 kB
Buffers:           92384 kB
Cached:          1340716 kB
40+ more ...
```

## 3.JVM内存划分

接下来，我们才来看一下JVM的内存区域划分。

![img](https://mmbiz.qpic.cn/mmbiz_png/cvQbJDZsKLoel1sWD0Fhj2E7PXdrgRwsXHkKaGLJSzhtTJeLwiaR4zfxuYQmZuxt5tLZE9EUK9fWUE0l15ZxGQQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

在JVM中，最大的内存区域就是堆，我们平常创建的大部分对象，都会存放在这里。所谓的垃圾回收，也主要针对的是这一部分。

多本JVM书籍描述：**JVM中，除了程序计数器，其他区域都是可能溢出的**。我们这里依然同意这个结论。下面仅对这些内存区域做简要的介绍，因为有些知识对我们的内存排查无益。

- **堆**：JVM堆中的数据，是共享的，是占用内存最大的一块区域
- **虚拟机栈**：Java虚拟机栈，是基于线程的，用来服务字节码指令的运行
- **程序计数器**：当前线程所执行的字节码的行号指示器
- **元空间**：方法区就在这里，非堆 本地内存：其他的内存占用空间

![img](https://mmbiz.qpic.cn/mmbiz_png/cvQbJDZsKLoel1sWD0Fhj2E7PXdrgRwsnicecffU5kq4ru5VVIORHMDpwNT9LdZiakNlJopNAEODvrfMKaOTvrRw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

类比上面这张图，我们可以归位一些常用对象的分配位置。不要纠结什么栈上分配逃逸分析，也不用关注栈帧和操作数栈这种双层的结构，这些小细节对于对象的汪洋大海来说，影响实在是太小。我们关注的内存区域，其实就只有**堆内内存**和**堆外内存**两个概念。

## 4.一图解千愁，jvm内存从来没有这么简单过！

> 下面这篇文章，详细的讲解了每个区域。本来想要揉在一块，但怕突出不了它的重要性。所以开始直接读原文吧。

明星文章：[《一图解千愁，jvm内存从来没有这么简单过！》](https://mp.weixin.qq.com/s?__biz=MzA4MTc4NTUxNQ==&mid=2650521298&idx=1&sn=09de3ec5ef6dd42a97ab7dd31e5bb6f1&scene=21#wechat_redirect)

![img](https://mmbiz.qpic.cn/mmbiz_png/cvQbJDZsKLoel1sWD0Fhj2E7PXdrgRwsUYN8k7bJ8eOsEKMkKe766cPzQbRWEXxvzTvVGGtTAqf4ooI6xjdyhA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

## 5.为什么会有内存问题

统计显示，我们平常的工作中，`OOM/ML`问题占比`5%`左右，平均处理时间却达到`40天`左右。这就可以看出这种问题的排查，是非常的困难的。

但让人无语的是，遇到内存问题，工程师们的现场保护意识往往不足，特别的不足。只知道一个内存溢出的结果，但什么都没留下。监控没有，日志没有，甚至连发生的时间点都不清楚。这样的问题，鬼才知道原因。

## 6.垃圾回收器

内存问题有两种模式，一种是内存溢出，一种是内存泄漏。

- **内存溢出** OutOfMemoryError，简称OOM，堆是最常见的情况，堆外内存排查困难。
- **内存泄漏** Memory Leak，简称ML，主要指的是分配的内存没有得到释放。内存一直在增长，有OOM风险；GC时该回收的回收不掉；或者能够回收掉但很快又占满，产生压力。

内存问题影响也是非常大的，比如下面这三种场景。

- 发生OOM Error，应用停止（最严重）
- 频繁GC，GC时间长，GC线程时间片占用高
- 服务卡顿，请求响应时间变长

说到这卡顿问题，就不得不提一嘴垃圾回收器。

![img](https://mmbiz.qpic.cn/mmbiz_png/cvQbJDZsKLoel1sWD0Fhj2E7PXdrgRwsH9G3tau2f2ZurCl0uj4NMYqrHWpmOXpD7yPMBCfC3pF2EZibgNl49Yw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

很多同学一看上面的图，就知道我们要说G1垃圾回收器了，这也是我的推荐。CMS等垃圾回收器，回收时间不可控，如果你有条件，当然要避免使用，CMS也将要在Java14中被移除，我也真心不希望你掌握一些即将过时的经验。ZGC虽然厉害，但还太新，几乎没有人敢吃螃蟹，那剩下的就是G1了。

G1通过三个简单的配置参数，大部分情况下即可获取优异的性能，工程师幸福了很多。三个参数如下：

- **MaxGCPauseMillis** 预定目标，自动调整。
- **G1HeapRegionSize** 小堆区大小。
- **InitiatingHeapOccupancyPercent** 堆内存比例阈值，启动并发标记。

如果你还是不放心，想要了解一下G1的原理，那我们也可以捎带提上两嘴。G1其实还是有年轻代老年代的概念的，只不过它的内存是不连续的。

如图所示，G1将内存切分成大小相等的区域，这些区域叫做**小堆区**，是垃圾回收的最小单位。以前的垃圾回收器都是整代回收，而G1是部分回收，那就可以根据配置的最小延迟时间合理的选取小堆区的数量，回收过程就显得**智能**了很多。

## 7.重要概念GC Roots

如图所示，要确定哪些是垃圾，就需要有一种找到垃圾的方法。其实，我们上一句的表述是不正确的。在JVM中，找垃圾的方法和我们理解的正好相反：**它是首先找到存活的对象，对存活的对象做标记，然后把其他对象一股脑的回收掉。**

JVM在垃圾回收时，关心的是不要把不是垃圾的对象给回收了，而不是把垃圾对象给清理的干干净净。

![img](https://mmbiz.qpic.cn/mmbiz_png/cvQbJDZsKLoel1sWD0Fhj2E7PXdrgRwsWLic7Dw1iahuTiaAfPjlVicvcibDnaLhibV7VibOc3vSoC5SLunALTvzSicY1w/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

要找到哪些是存活对象，就需要从源头上追溯。在JVM中，常见的GC Roots就有静态的成员变量等，比如一个静态的HashMap。

另外一部分，就是线程所关联的虚拟机栈和本地方法栈里面的内容。

我们说了这老半天，其实这种追溯方式有一个专有的名词：**可达性分析法**。与之类似的还有引用计数法，但由于有环形依赖的问题，所以几乎没有回收器使用这种形式。

并不是说只要是和GC Roots有一条联系（Reference Chain），对象就是存活的，它还与对象的引用级别有关。

- **强引用**：属于最普通最强硬的一种存在，只有在和GC Roots断绝关系时，才会被消灭掉
- **软引用**：只有在内存不足时，系统则会回收软引用对象
- **弱引用**：当JVM进行垃圾回收时，无论内存是否充足，都会回收被弱引用关联的对象
- **虚引用**：虚引用主要用来跟踪对象被垃圾回收的活动

平常情况下，我们使用的对象就是强引用。软引用和弱引用在一些缓存框架中用的比较广泛，对象的重要程度也比较弱。

## 8.对象的提升

大多数垃圾回收器都是分代垃圾回收，我们从上面对G1的描述就能够看出来。

![img](https://mmbiz.qpic.cn/mmbiz_png/cvQbJDZsKLoel1sWD0Fhj2E7PXdrgRws8DiaDbE7ia3dib7LL5vPDycHwxqMxo81s5zCNWusbIylulkV5w2jAKTeg/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

如图所示，是典型的分代回收内存模型。对象从年轻代提升到老年代，有四种方式。

1. **常规提升**，对象够老。比如从from到to转了15圈还没有被回收掉。控制参数就是`-XX:MaxTenuringThreshold`。这个值在CMS下默认为6，G1下默认为15
2. **分配担保** Survivor 空间不够，老年代担保。
3. **大对象**直接在老年代分配
4. **动态对象年龄判定**。比如在G1里的TenuringThreshold会随着堆内对象的分布而变化

对于垃圾回收器的优化，就是要确保尽量多的对象在年轻代里分配，减少对象提升到老年代的可能。虽然这种思想在G1里弱化了许多。

## End

了解了操作系统的内存里都有啥，又了解了JVM的内存里都有啥，我们就可以淡定纵容的针对于每一种出现问题的情况，进行针对性排查和优化。

文章到这里嘎然而止。下一篇，我们以几个实际的案例，来看一下Java的内存问题排查的具体过程。