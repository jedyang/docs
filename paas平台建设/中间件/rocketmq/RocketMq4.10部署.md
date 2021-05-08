1. 编译  
按照官方说明：http://rocketmq.apache.org/docs/quick-start/
  > git clone -b develop https://github.com/apache/rocketmq.git

  > cd rocketmq

  > mvn -Prelease-all -DskipTests clean install -U

  > cd distribution/target/apache-rocketmq

 其中，mvn打包时超时，我用了下面的镜像。

 ```
    <mirror>
        <id>central</id>
        <name>Maven Repository Switchboard</name>
        <url>http://repo1.maven.org/maven2/</url>
        <mirrorOf>central</mirrorOf>
    </mirror>
    
 ```

 2. 环境  
    centOS 6.5  
- 创建用户  
    最好不要用root用户来搭建应用。
    > useradd -d /home/rocketmq410 -m rocketmq410  
    > passwd rocketmq410

- 切换用户
  
- 下载jdk 1.8。并配置   
    scp haieradmin@10.135.7.56:~/jdk-8u144-linux-x64.tar.gz ~
    解压tar -zxvf 
    修改.bash_profile。这种方式更安全，只对当前用户生效。  
    `[rocketmq410@wuliutest001 ~]$ vim .bash_profile `  
    在最后加上
    > export JAVA_HOME=/home/rocketmq410/jdk1.8.0_144

    > export PATH=$JAVA_HOME/bin:$PATH
    
   source .bash_profile
   
    - 上传rocketmq  
    用到命令   
    rz  
    scp haieradmin@10.135.7.56:~/apache-rocketmq.tar.gz ~  
    tar -zxvf  
   
- 部署规划  
    本次搭的是4主无备的集群。
    2个nameServer 10.135.26.200 和 10.135.26.201 
    端口开在9876  
    
- 系统配置  

    使用root权限    
    ```
    echo 'vm.overcommit_memory=1' >> /etc/sysctl.conf
    echo 'vm.min_free_kbytes=5000000' >> /etc/sysctl.conf
    echo 'vm.drop_caches=1' >> /etc/sysctl.conf
    echo 'vm.zone_reclaim_mode=0' >> /etc/sysctl.conf
    echo 'vm.max_map_count=655360' >> /etc/sysctl.conf
    echo 'vm.dirty_background_ratio=50' >> /etc/sysctl.conf
    echo 'vm.dirty_ratio=50' >> /etc/sysctl.conf
    echo 'vm.page-cluster=3' >> /etc/sysctl.conf
    echo 'vm.dirty_writeback_centisecs=360000' >> /etc/sysctl.conf
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    sysctl -p

    echo 'ulimit -n 655350' >> /etc/profile
    echo '* hard nofile 655350' >> /etc/security/limits.conf
    echo '* hard memlock      unlimited' >> /etc/security/limits.conf
    echo '* soft memlock      unlimited' >> /etc/security/limits.conf
    ```
    
    发现4.1.0版本的os.sh不好使。还是3.2.6版本里的echo好用。  
    查看内核参数用cat /etc/sysctl.conf  
    查看文件句柄 用 ulimit -a 或 -n 
    还有一个参数
    ```
    DISK=`df -k | sort -n -r -k 2 | awk -F/ 'NR==1 {gsub(/[0-9].*/,"",$3); print $3}'`
    [ "$DISK" = 'cciss' ] && DISK='cciss!c0d0'
    echo 'deadline' > /sys/block/${DISK}/queue/scheduler
    ```
    这个是设置io调度算法，细节google。注意两点：
    1. 之前用centos6.5。这个值默认是cfq。换了7.2后发现这个参数默认就是deadline。省了配置了。
    2. 我的系统第一句得到的DISK值是mapper。但是在echo时，发现/sys/block下根本没有mapper目录。其实应该是sda。所以mq提供的脚本可能有问题。供大家参考。
    
    ~~使用root权限，执行一次os.sh~~
    ~~仅执行一次就好，以前执行过，就不要再次执行了。  ~~
    ~~然而，并不会成功。报错：~~
   ~~ > -bash: ./os.sh: /bin/sh^M: bad interpreter: No such file or directory~~
   
    ~~原因是，我之前的编译打包是在windows环境下。~~
    ~~此时的文件编码是dos的。要改成unix的。详见了我的另一篇文章。  ~~  
   
    ~~vim 打开文件。~~
    ~~`:set ff=unix`  ~~
    ~~同样处理其他用到的脚本。~~
   
    ~~查询一下 `cat /etc/sysctl.conf` 或者 `sysctl -a`~~
   
- 配置启动nameServer  
  
    新建一个配置文件namesrv-a.properties，放在conf下  
    
    ```
    listenPort=9876
    serverWorkerThreads=8
    serverCallbackExecutorThreads=0
    serverSelectorThreads=3
    serverOnewaySemaphoreValue=256
    serverAsyncSemaphoreValue=64
    serverChannelMaxIdleTimeSeconds=120
    serverSocketSndBufSize=2048
    serverSocketRcvBufSize=1024
    serverPooledByteBufAllocatorEnable=false
    ```
    
    在bin下，新建一个启动脚本startnamesrv.sh  
    ```
    nohup ./mqnamesrv -c ../conf/namesrv-a.properties > ~/logs/ns.log &
    tail -100f ~/logs/ns.log
    ```
    
    执行startnamesrv.sh  
    
    同样操作，配置好10.135.26.201
    
- 配置启动broker  
新建一个启动脚本，startbroker.sh

    ```
    nohup ./mqbroker -c ../conf/2m-noslave/broker-a.properties > ~/logs/broker-a.log &
    tail -100f ~/logs/broker-a.log
    ```
> chmod +x startbroker.sh  

配置broker-a.properties

   ```
    brokerClusterName=HopRocketMqClusterProduction
    brokerName=broker-a-pro
    # 相同的brokerName，brokerId是0为master，>0为slave
    brokerId=0
    # 清理commitlog的时间，默认就是04
    deleteWhen=04
    # commitlog保存时间，默认就是72
    fileReservedTime=72
    # 角色ASYNC_MASTER,SYNC_MASTER,SLAVE;
    # ASYNC_MASTER：master接受消息成功即返回成功
    # SYNC_MASTER：至少一个slave接受消息成功，才返回成功
    brokerRole=ASYNC_MASTER
    # 刷盘方式SYNC_FLUSH和ASYNC_FLUSH
    flushDiskType=ASYNC_FLUSH
    
    # netty的监听端口
    listenPort=10922
    # namesrv地址
    namesrvAddr=10.135.26.200:9876;10.135.26.201:9876
    # 获取本地地址
    brokerIP1=10.135.26.200
    # 默认队列数量
    defaultTopicQueueNums=8
    # 自动创建Topic功能是否开启（线上建议关闭）
    autoCreateTopicEnable=false
    # 自动创建订阅组功能是否开启（线上建议关闭）
    autoCreateSubscriptionGroup=false
    
    # 磁盘空间最大使用率，超了拒收消息
    diskMaxUsedSpaceRatio=80
    # 存储commitlog路径
    storePathRootDir=/home/rocketmq410/mqstore/rocketmqstore-a
    storePathCommitLog=/home/rocketmq410/mqstore/rocketmqstore-a/commitlog
    
    # 自动创建以服务器名字命名的Topic功能是否开启
    brokerTopicEnable=false
    # 自动创建以集群名字命名的Topic功能是否开启
    clusterTopicEnable=false
    # 是否拒绝接收事务消息
    rejectTransactionMessage=false
    # 是否从地址服务器寻找Name Server地址，正式发布后，默认值为false
    fetchNamesrvAddrByAddressServer=false
    
    # 以下全是默认值，删掉即可
    
    # CommitLog刷盘间隔时间（单位毫秒）
    flushIntervalCommitLog=1000
    # 是否定时方式刷盘，默认是实时刷盘
    flushCommitLogTimed=false
    # 最大被拉取的消息字节数，消息在内存
    maxTransferBytesOnMessageInMemory=262144
    # 最大被拉取的消息个数，消息在内存
    maxTransferCountOnMessageInMemory=32
    # 最大被拉取的消息字节数，消息在磁盘
    maxTransferBytesOnMessageInDisk=65536
    # 最大被拉取的消息个数，消息在磁盘
    maxTransferCountOnMessageInDisk=8
    # 命中消息在内存的最大比例
    accessMessageInMemoryMaxRatio=40
    # 是否开启消息索引功能
    messageIndexEnable=true
    # 是否使用安全的消息索引功能，即可靠模式。
    # 可靠模式下，异常宕机恢复慢
    # 非可靠模式下，异常宕机恢复快
    messageIndexSafe=false
    # ha是主从同步相关配置
    haMasterAddress=
   ```

新建存储commitlog的目录
mkdir -p /home/rocketmq410/mqstore/rocketmqstore-a/commitlog

执行startbroker.sh

- 安装rocketmq-console  
 `git clone git@github.com:apache/rocketmq-externals.git`  
`cd rocketmq-console  `  
`mvn clean package -Dmaven.test.skip=true  `  
上传  
写一个启动脚本，指定namesrv。  
`nohup java -jar ./rocketmq-console-ng-1.0.0.jar --server.port=12580 --rocketmq.config.namesrvAddr=10.138.22.90:9877\;10.138.22.91:9877 > nohup.out &`


- admin cli命令  
查询消费进度
 ./mqadmin consumerProgress -g TestConsumer1 -n 10.135.26.200:9876


- 问题：
1. client使用3.6.2版本，需要设置setVipChannelEnabled为false，否则发送失败。

2. client使用3.6.2版本，代码日志可以看到消息已经消费成功，但是broker上的offset没变。  
client版本降为3.2.6问题解决。  
该问题在broker端是3.2.6版本上是一样的。  

3. 关于sendMessageWithVIPChannel，3.2.6以上的client默认是true  
broker的netty server会起两个通信服务。两个服务除了服务的端口号不一样，其他都一样。其中一个的端口（配置端口-2）作为vip通道，客户端可以启用本设置项把发送消息此vip通道。  
这个可以减少消息的丢失率。加快刷到硬盘的速度。这个通道很少生产者走的。所以，保证了消息稳定地到达了 broker 端，特别是 当 洪水般的消息涌过来的话，对于 金钱方面的消息，这个通道非常快速。 


注意：
安装前一定要看好哪个路径下存储空间最大

修改文件夹owner：
chown -R rocketmq:rocketmq /data/rocketmq/

服务器的防火墙对应的端口没开，
你发邮件让他们开下，我现在是将防火墙关掉了，测试可以用了。
申请开通服务器端口
9870-9880，10920 - 10925，12580

centos7.2开通防火墙端口
> firewall-cmd --zone=public --add-port=9870-9880/tcp --permanent

> firewall-cmd --reload