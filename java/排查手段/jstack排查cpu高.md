## jstack检测cpu高

#### 步骤一：查看cpu占用高进程

执行top命令后，按shift+p 按cpu使用量排序

```cpp
top

Mem:  16333644k total,  9472968k used,  6860676k free,   165616k buffers
Swap:        0k total,        0k used,        0k free,  6665292k cached

  PID USER      PR  NI  VIRT  RES  SHR S %CPU %MEM    TIME+  COMMAND     
17850 root      20   0 7588m 112m  11m S 100.7  0.7  47:53.80 java       
 1552 root      20   0  121m  13m 8524 S  0.7  0.1  14:37.75 AliYunDun   
 3581 root      20   0 9750m 2.0g  13m S  0.7 12.9 298:30.20 java        
    1 root      20   0 19360 1612 1308 S  0.0  0.0   0:00.81 init        
    2 root      20   0     0    0    0 S  0.0  0.0   0:00.00 kthreadd    
    3 root      RT   0     0    0    0 S  0.0  0.0   0:00.14 migration/0 
```



#### 步骤二：查看cpu占用高线程

通过第一步得到了进程号

通过top -Hp 进程号，查看具体的线程情况

```css
top -H -p 17850

top - 17:43:15 up 5 days,  7:31,  1 user,  load average: 0.99, 0.97, 0.91
Tasks:  32 total,   1 running,  31 sleeping,   0 stopped,   0 zombie
Cpu(s):  3.7%us,  8.9%sy,  0.0%ni, 87.4%id,  0.0%wa,  0.0%hi,  0.0%si,  0.0%st
Mem:  16333644k total,  9592504k used,  6741140k free,   165700k buffers
Swap:        0k total,        0k used,        0k free,  6781620k cached

  PID USER      PR  NI  VIRT  RES  SHR S %CPU %MEM    TIME+  COMMAND
17880 root      20   0 7588m 112m  11m R 99.9  0.7  50:47.43 java
17856 root      20   0 7588m 112m  11m S  0.3  0.7   0:02.08 java
17850 root      20   0 7588m 112m  11m S  0.0  0.7   0:00.00 java
17851 root      20   0 7588m 112m  11m S  0.0  0.7   0:00.23 java
17852 root      20   0 7588m 112m  11m S  0.0  0.7   0:02.09 java
17853 root      20   0 7588m 112m  11m S  0.0  0.7   0:02.12 java
17854 root      20   0 7588m 112m  11m S  0.0  0.7   0:02.07 java
```



#### 步骤三：转换线程ID

通过第二步得到了线程17880有问题，转换成16进制，以便后续使用。

```bash
printf "%x\n" 17880          
45d8
```



### 步骤四：定位cpu占用线程

在jstack打印的堆栈信息中查询线程相关信息

```bash
jstack 17850|grep 45d8 -A 30
"pool-1-thread-11" #20 prio=5 os_prio=0 tid=0x00007fc860352800 nid=0x45d8 runnable [0x00007fc8417d2000]
   java.lang.Thread.State: RUNNABLE
        at java.io.FileOutputStream.writeBytes(Native Method)
        at java.io.FileOutputStream.write(FileOutputStream.java:326)
        at java.io.BufferedOutputStream.flushBuffer(BufferedOutputStream.java:82)
        at java.io.BufferedOutputStream.flush(BufferedOutputStream.java:140)
        - locked <0x00000006c6c2e708> (a java.io.BufferedOutputStream)
        at java.io.PrintStream.write(PrintStream.java:482)
        - locked <0x00000006c6c10178> (a java.io.PrintStream)
        at sun.nio.cs.StreamEncoder.writeBytes(StreamEncoder.java:221)
        at sun.nio.cs.StreamEncoder.implFlushBuffer(StreamEncoder.java:291)
        at sun.nio.cs.StreamEncoder.flushBuffer(StreamEncoder.java:104)
        - locked <0x00000006c6c26620> (a java.io.OutputStreamWriter)
        at java.io.OutputStreamWriter.flushBuffer(OutputStreamWriter.java:185)
        at java.io.PrintStream.write(PrintStream.java:527)
        - eliminated <0x00000006c6c10178> (a java.io.PrintStream)
        at java.io.PrintStream.print(PrintStream.java:597)
        at java.io.PrintStream.println(PrintStream.java:736)
        - locked <0x00000006c6c10178> (a java.io.PrintStream)
        at com.demo.guava.HardTask.call(HardTask.java:18)
        at com.demo.guava.HardTask.call(HardTask.java:9)
        at java.util.concurrent.FutureTask.run(FutureTask.java:266)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1142)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)
        at java.lang.Thread.run(Thread.java:745)

"pool-1-thread-10" #19 prio=5 os_prio=0 tid=0x00007fc860345000 nid=0x45d7 waiting on condition [0x00007fc8418d3000]
   java.lang.Thread.State: WAITING (parking)
        at sun.misc.Unsafe.park(Native Method)
        - parking to wait for  <0x00000006c6c14178> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.park(LockSupport.java:175)
```



