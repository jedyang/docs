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

### 入口方法

org.apache.rocketmq.store.DefaultMessageStore#putMessage

开始做了一些校验，校验了broker状态和msg的状态等

然后调用

```
this.commitLog.putMessage(msg);
```

### putMessage方法

1，对消息体计算CRC32

2，mappedFile

```
MappedFile mappedFile = this.mappedFileQueue.getLastMappedFile();
```

