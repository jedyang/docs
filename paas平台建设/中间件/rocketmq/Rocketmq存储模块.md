## Rocketmq存储模块

源码就在store模块下，入口类DefaultMessageStore

该类定义了很多重要的属性，如commitlog文件，index文件，consumequeue文件

```
// 存储相关的配置，如存储位置，commitlog文件大小等
private final MessageStoreConfig messageStoreConfig;
// CommitLog
private final CommitLog commitLog;

// 队列，按消息主题分组了
private final ConcurrentMap<String/* topic */, ConcurrentMap<Integer/* queueId */, ConsumeQueue>> consumeQueueTable;

// 消息队列的刷盘线程服务
private final FlushConsumeQueueService flushConsumeQueueService;

// 删除commitlog的线程服务
private final CleanCommitLogService cleanCommitLogService;

// 清楚consumeQueue文件的线程
private final CleanConsumeQueueService cleanConsumeQueueService;

// 索引文件相关服务
private final IndexService indexService;

// 文件内存映射服务
private final AllocateMappedFileService allocateMappedFileService;

//CommitLog消息分发服务,根据CommitLog文件构建ConsumerQueue、IndexFile文件
private final ReputMessageService reputMessageService;
```

### commitlog文件

我们先必须清楚commitlog文件在服务器上是怎么存储的。

代码中的commitlog        对应磁盘上的    commitlog文件夹

代码commitlog中有一个MappedFileQueue   对应磁盘上     commitlog下的文件列表

MappedFileQueue  里的MappedFile   映射  磁盘上具体的一个commitlog文件

### 入口方法

org.apache.rocketmq.store.DefaultMessageStore#putMessage

开始做了一些校验，校验了broker状态和msg的状态等

然后调用

```
this.commitLog.putMessage(msg);
```

### putMessage方法

#### 1，对消息体计算CRC32

#### 2，获取当前正在写入的mappedFile

mappedFile非常重要。

我们知道RocketMq的消息是存储在commitlog中的，这是从大的方面理解。

继续往下追，commitlog又是基于mappedFileQueue

```
protected final MappedFileQueue mappedFileQueue;
```

从名字上就能看出，mappedFileQueue是一个队列，它的底层又是

```
private final CopyOnWriteArrayList<MappedFile> mappedFiles = new CopyOnWriteArrayList<MappedFile>();
```

MappedFile队列。

MappedFile对应着最终磁盘上的存储文件，

```
private MappedByteBuffer mappedByteBuffer;
```

是MappedByteBuffer的封装，消息存储跟磁盘、内存的交互都是通过它完成。

获取当前正在写入的mappedFile

```
MappedFile mappedFile = this.mappedFileQueue.getLastMappedFile();
```

如果是null，或者满了。新创建一个文件

```
if (null == mappedFile || mappedFile.isFull()) {
    mappedFile = this.mappedFileQueue.getLastMappedFile(0); // Mark: NewFile may be cause noise
}
```

#### 3，追加消息

```
result = mappedFile.appendMessage(msg, this.appendMessageCallback);
```

这里传一个回调接口appendMessageCallback。appendMessageCallback是一个内部类，这个commitlog类接近2000行了，个人认为这里不该用内部类，拆分出去更好。

MappedFile的几个指针

wrotePosition  ： 文件的写入指针。标记当前写到文件的位置。

committedPosition： 提交位置指针

flushedPosition ： 刷盘位置指针

#### 4，回调append  

回调commitlog的内部类方法。代码  org.apache.rocketmq.store.CommitLog.DefaultAppendMessageCallback#doAppend(long, java.nio.ByteBuffer, int, org.apache.rocketmq.store.MessageExtBrokerInner)

##### 4.1 计算msgid

##### 4.2获取consume queue的偏移量

```
keyBuilder.setLength(0);
keyBuilder.append(msgInner.getTopic());
keyBuilder.append('-');
keyBuilder.append(msgInner.getQueueId());
String key = keyBuilder.toString();
Long queueOffset = CommitLog.this.topicQueueTable.get(key);
```

##### 4.3 消息的size校验

##### 4.4 消息写入bytebuffer

##### 4.5更新队列的offset

```
// The next update ConsumeQueue information
CommitLog.this.topicQueueTable.put(key, ++queueOffset);
```

#### 5，成功后，刷盘线程和同步线程

```
//释放锁
putMessageLock.unlock();
//刷盘
handleDiskFlush(result, putMessageResult, msg);
//执行HA主从同步
handleHA(result, putMessageResult, msg);
```



### 刷盘

消息都是先存到内存中，MappedByteBuffer中。然后根据是同步刷盘还是异步刷盘进行不同的刷盘策略。





### 文件内存映射

RocketMQ通过使用内存映射文件来提高IO访问性能，无论是CommitLog、ConsumerQueue还是IndexFile，单个文件都被设计为固定长度，如果一个文件写满以后再创建一个新文件，文件名就为该文件第一条消息对应的全局物理偏移量。

MappedFile类对应commitlog文件夹下的消息文件

```
public static final int OS_PAGE_SIZE = 1024 * 4;//操作系统的页大小，默认是4K
private static final AtomicLong TOTAL_MAPPED_VIRTUAL_MEMORY = new AtomicLong(0);// 当前JVM实例中MappedFile虚拟内存
private static final AtomicInteger TOTAL_MAPPED_FILES = new AtomicInteger(0);//当前JVM实例中MappedFile对象个数
protected final AtomicInteger wrotePosition = new AtomicInteger(0);//当前文件的写指针
protected final AtomicInteger committedPosition = new AtomicInteger(0);//当前文件的提交指针
private final AtomicInteger flushedPosition = new AtomicInteger(0);//刷写到磁盘指针
protected int fileSize;//文件大小
protected FileChannel fileChannel;//文件通道	
/**
 * 消息都是先放到这，然后再放进文件通道
 */
protected ByteBuffer writeBuffer = null;//堆外内存ByteBuffer
protected TransientStorePool transientStorePool = null;//堆外内存池
private String fileName;//文件名称
private long fileFromOffset;//该文件的初始偏移量
private File file;//物理文件
private MappedByteBuffer mappedByteBuffer;//物理文件对应的内存映射Buffer
private volatile long storeTimestamp = 0;//文件最后一次内容写入时间
private boolean firstCreateInQueue = false;//是否是MappedFileQueue队列中第一个文件
```



### consumequeue文件

commitlog文件时顺序写，这样可以极大的提高写性能，但是如果随机读取就会效率很低。所以就有了consumequeue呵index文件

在messageStore初始化的时候，会开启一个线程reputMessageService，进行消息的分发。根据commitlog准实时的更新consumequeue中的偏移量

```
this.reputMessageService.setReputFromOffset(maxPhysicalPosInLogicQueue);
this.reputMessageService.start();
```

```
@Override
public void run() {
    DefaultMessageStore.log.info(this.getServiceName() + " service started");

    while (!this.isStopped()) {
        try {
            Thread.sleep(1);
            this.doReput();
        } catch (Exception e) {
            DefaultMessageStore.log.warn(this.getServiceName() + " service has exception. ", e);
        }
    }

    DefaultMessageStore.log.info(this.getServiceName() + " service end");
}
```

可以看到其run方法，不断执行doReput。

看看doReput都在干嘛



