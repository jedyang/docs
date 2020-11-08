## SpringBoot轻量级分布式任务调度实现

Springboot自带的@EnableScheduling，让我们创建任务调度已经非常容易。但是这个任务调度只适合单机环境，如果是分布式分布式部署多个服务，需要自己实现任务调度。否则会有任务执行多次的问题。

分布式任务调度可以选择的方案挺多，比如Quartz，LTS，XXL-JOB，elastic-job等。

但是这些框架相对较重，需要额外的部署和运维。或者建大量的表。

所以，想自己实现一个简单的，轻量级的任务调度。

方案就是，实现一个分布式锁获取机制，获取到锁的执行任务，没获得锁的放弃。

所以，核心问题是要实现一个分布式锁。

实现分布式锁的方案，

1. redis的setNx命令
2. 数据库锁机制
3. zookeep的临时顺序节点

### 基于mysql的实现

我的方案如下：

1. 创建一张task_lock表。每一行对应一个分布式任务

2. 乐观锁策略。每个任务有一个status状态，标记任务执行中，还是空闲。

   记录中有一个version字段。每次任务执行时，各个节点来取任务。

   然后，对version+1，再放回去。放的时候判断version要判断是否匹配。
   
   能成功更新的为获取锁成功，更新状态为执行中
   
3. 获取锁的任务再执行完后，要将status改为空闲状态



#### 1, 建表

```
create table task_lock
(
	id int auto_increment
		primary key,
	status int default '0' null comment '任务状态 0：空闲 1：执行中',
	version int default '0' null,
	create_time datetime default CURRENT_TIMESTAMP null,
	update_time datetime null,
	name varchar(10) null comment '任务名',
	description varchar(100) null comment '任务描述'
)
comment '任务锁'
;
```



#### 2, 代码

基础代码使用mybatis generator生成，不放了。

再service层创建一对方法

```
/**
 * 获取锁
 * @param taskId
 * @return
 */
boolean getLock(int taskId);

/**
 * 释放锁
 * @param taskId
 * @return
 */
boolean releaseLock(int taskId);
```

实现

```
@Override
public boolean getLock(int id) {
    TaskLockExample example = new TaskLockExample();
    example.createCriteria()
            .andIdEqualTo(id)
            .andStatusEqualTo(0);
    List<TaskLock> taskLocks = taskLockMapper.selectByExample(example);
    if (CollUtil.isEmpty(taskLocks)) {
        return false;
    }
    TaskLock taskLock = taskLocks.get(0);
    Integer oldVersion = taskLock.getVersion();

    TaskLockExample updateExample = new TaskLockExample();
    updateExample.createCriteria().andIdEqualTo(id)
            .andVersionEqualTo(oldVersion)
            .andStatusEqualTo(0);

    TaskLock newLock = new TaskLock();
    newLock.setStatus(1);
    newLock.setVersion(oldVersion + 1);
    newLock.setUpdateTime(LocalDateTime.now());
	// 通过更新的行数，得到是否获得锁
    int i = taskLockMapper.updateByExampleSelective(newLock, updateExample);
    return i == 1;
}

@Override
public boolean releaseLock(int id) {
    TaskLock newLock = new TaskLock();
    newLock.setId(id);
    newLock.setStatus(0);
    newLock.setUpdateTime(LocalDateTime.now());
    int i = taskLockMapper.updateByPrimaryKeySelective(newLock);
    return i == 1;
}
```



**注意事项：更新时主键id作为第一个查询条件，这样保证更新时使用行锁而不是表锁。因为MySQL的innoDB引擎是支持行锁的，但是行锁建立在索引之上。**

使用：

```
/**
 * 每天2点执行一次
 */
@Scheduled(cron = "0 0 2 * * ?")
public void configureTasks() {
    boolean lock = taskLockService.getLock(2);
    if (lock) {
        try {
            int i = cleanService.doCompanyMonthClean();
            log.info(">>>>>>>>>>>>>>>>>>>>>>CompanyMonthCleanSummaryTask Start {}<<<<<<<<<<<<<<<<<<", LocalDateTime.now());
            log.info("更细记录：" + i);
            log.info(">>>>>>>>>>>>>>>>>>>>>>CompanyMonthCleanSummaryTask end {} <<<<<<<<<<<<<<<<<<", LocalDateTime.now());
        } finally {
            boolean b = taskLockService.releaseLock(2);
            if (!b) {
                log.error("释放锁失败：" + 2);
            }
        }
    }
}
```

注意：一定要在finally中释放锁



### 局限

1，各个执行节点的时钟要同步。要同时过来取锁。

2，缺失执行记录等

但是对我目前的业务场景够用了。