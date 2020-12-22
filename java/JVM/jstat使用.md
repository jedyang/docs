## jstat

jstat命令工具是排除JVMGC问题不可或缺的工具

 既可以查看堆内存各部分的使用量，也可以查看加载类的数量。

启动jvm时，没有指定任何JVM参数

### class

输出类加载相关信息

```
$ jstat -class 19295
Loaded  Bytes  Unloaded  Bytes     Time
 16603 31015.9      147   221.0      18.84

```

一共加载了16603个类,大小31K。卸载了147个类。装载和卸载总耗时18秒

### gc命令

打印堆相关信息

```
$ jstat -gc 19295
 S0C      S1C    S0U    S1U      EC       EU        OC         OU       MC     MU    CCSC   CCSU   YGC     YGCT    FGC    FGCT     GCT
5632.0 5632.0 4445.3  0.0   1688064.0 1456406.7  388608.0   154223.4  105876.0 100496.0 11964.0 11033.2   4114   27.677   9      5.965   33.642
```

- **S0C：**S0区的大小   5632Kb，约5M
- **S1C：**S1区的大小
- **S0U：**S0区使用的大小
- **S1U：**S1区使用的大小，s0和s1同一时间只会有一个在用
- **EC：**伊甸园区的大小    1.6G，还挺大
- **EU：**伊甸园区的使用大小
- **OC：**老年代大小     约400M
- **OU：**老年代使用大小
- **MC：**方法区大小    约100M
- **MU：**方法区使用大小
- **CCSC:**压缩类空间大小
- **CCSU:**压缩类空间使用大小
- **YGC：**年轻代垃圾回收次数
- **YGCT：**年轻代垃圾回收消耗时间
- **FGC：**老年代垃圾回收次数
- **FGCT：**老年代垃圾回收消耗时间
- **GCT：**垃圾回收消耗总时间



### jstat -gccapacity

显示各个代的对象大小

```
$ jstat -gccapacity 19295
 NGCMN    NGCMX     NGC     S0C   S1C       EC      OGCMN      OGCMX       OGC         OC       MCMN     MCMX      MC     CCSMN    CCSMX     CCSC    YGC    FGC
106496.0 1699840.0 1699840.0 6144.0 6144.0 1687552.0   212992.0  3399680.0   388608.0   388608.0      0.0 1142784.0 105876.0      0.0 1048576.0  11964.0   4120     9

```



- NGCMN：新生代中初始化大小  新生代=s0+s1+eden
- NGCMX：新生代最大大小
- NGC：当前新生代容量
- OGCMN：老年代初始化大小
- OGCMX：老年代最大大小。因为这个jvm启动时采用默认配置。老年代动态涨上来的。
- MCMN： 元空间相关
- CCSMN: 压缩类相关



### jstat -gcmetacapacity

看元空间中的内存信息

```
$ jstat -gcmetacapacity 19295
   MCMN       MCMX        MC       CCSMN      CCSMX       CCSC     YGC   FGC    FGCT     GCT
       0.0  1142784.0   105876.0        0.0  1048576.0    11964.0  4120     9    5.965   33.707
```



### jstat -gcnew

新生代相关信息

```
$ jstat -gcnew 19295
 S0C    S1C    S0U    S1U   TT MTT  DSS      EC       EU     YGC     YGCT
6144.0 6144.0 3996.1    0.0 15  15 6144.0 1687552.0 1278569.1   4120   27.742
```

TT: Tenuring threshold。新生代的持有代数。默认是15。15代后的对象进入老年代。

DSS：Desired survivor size (kB)。期望的S区大小。



### jstat -gcnewcapacity

```
$ jstat -gcnewcapacity 19295
  NGCMN      NGCMX       NGC      S0CMX     S0C     S1CMX     S1C       ECMX        EC      YGC   FGC
  106496.0  1699840.0  1699840.0 566272.0   6144.0 566272.0   6144.0  1698816.0  1687552.0  4121     9
```



### jstat -gcold

```
$ jstat -gcold 19295
   MC       MU      CCSC     CCSU       OC          OU       YGC    FGC    FGCT     GCT
105876.0 100496.0  11964.0  11033.2    388608.0    154615.5   4121     9    5.965   33.718

```



### jstat -gcoldcapacity

```
$ jstat -gcoldcapacity 19295
   OGCMN       OGCMX        OGC         OC       YGC   FGC    FGCT     GCT
   212992.0   3399680.0    388608.0    388608.0  4121     9    5.965   33.718
```





### gcutil命令

```
$ jstat -gcutil 19295
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
 93.02   0.00  65.43  39.71  94.92  92.22   4116   27.698     9    5.965   33.663
```



### -gccause

```
$ jstat -gccause 19295
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT    LGCC                 GCC
  0.00  67.96  73.01  39.79  94.92  92.22   4121   27.753     9    5.965   33.718 Allocation Failure   No GC
```



### jstat -compiler

Just-in-Time（即时）编译器的信息

```
$ jstat -compiler 19295
Compiled Failed Invalid   Time   FailedType FailedMethod
   25969      5       0   197.59          1 com/mysql/jdbc/AbandonedConnectionCleanupThread run
```



### -printcompilation

```
$ jstat -printcompilation 19295
Compiled  Size  Type Method
   25969     84    1 java/util/LinkedList toArray
```

Method： 最近进行了JIT编译的方法

### 周期性输出

上面的命令都可以在后面加上周期操作： 周期（单位是毫秒） 次数。

如

```
jstat -gc 19295 5000 10
```

就是每5秒循环一次，一共输出10次