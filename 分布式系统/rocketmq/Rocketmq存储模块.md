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

1，对消息体计算CRC32

2，获取当前正在写入的mappedFile

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

3，追加消息

```
result = mappedFile.appendMessage(msg, this.appendMessageCallback);
```

这里传一个回调接口appendMessageCallback。appendMessageCallback是一个内部类，这个commitlog类接近2000行了，个人认为这里不该用内部类，拆分出去更好。

MappedFile的几个指针

wrotePosition  ： 文件的写入指针。标记当前写到文件的位置。

committedPosition： 提交位置指针

flushedPosition ： 刷盘位置指针

4，回调append

回调commitlog的内部类方法。

4.1   计算msgid



判断消息长度+