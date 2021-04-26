### 一，基础知识

redis集群可以提供水平扩展能力，cluster模式会在各个节点间自动切分数据；会将一定的容灾能力，少部分节点故障，整个集群依旧能够运行。这里我需要在细讲一下。比如一个集群有ABC三个节点，B节点挂了，整个集群是无法工作的，因为B节点上对应的散列槽找不到了。再比如AB A‘B'这样的集群，如果B节点挂了，整个集群也是挂掉的，你可能会说不是还有B’这个备节点吗？很抱歉，因为B挂了，只剩下A一个主节点，是无法完成选举的，也就是B‘并不能自动变为B。所以集群至少要搭3主3备。

搭建cluster模式，需要redis3.0以上版本。

TCP端口要求：一个是用于客户端连接的端口（默认6379），另一个是用于集群间通信的端口（默认10000+6379）

这两个端口的偏移量10000是固定的，所以部署前先检查防火墙端口是否都已经打开。

Redis集群中有16384个散列槽，然后将这些槽分给你的集群节点（不一定非要均分，看你自己的实际情况）

集群扩容和缩容就是对应的增加和减少节点。而增加和减少节点就涉及到槽的迁移。当一个节点上的槽数量为0时，这个节点就可以下掉了。要注意的是在槽的迁移过程中，是不需要停机的。服务是正常的，但还是建议在业务不繁忙的情况下进行。

另外提一点，redis是根据key就行散列，然后确定落到哪个槽里，但要点是如果在关键字{}括号内有一个子字符串，那么只有该花括号“{}”内部的内容被散列，例如 this{foo}key 和 another{foo}key 保证在同一散列槽中

redis的一致性保证

redis并不保证很强的一致性，因为redis默认采取异步复制，在某些情况下回发生写入丢失。

比如主节点A在接受写入后便会想客户端返回确认，但是在未完成同备节点的同步时便挂了，那么这个写入就丢失了。如果你要求redis完成了刷盘或者主从同步再返回确认，那么这会导致redis性能极低。  

官网还举了一个网络分区的例子，我不重复了，感兴趣看官网，https://redis.io/topics/cluster-tutorial

### redis集群配置参数

配置参数在这个文件redis.conf

​    　　　　　　**1、cluster-enabled <yes/no>**：如果想在特定的Redis实例中启用Redis群集支持就设置为yes。 否则，实例通常作为独立实例启动。

   　　　　　　 **2、cluster-config-file <filename>**：请注意，尽管有此选项的名称，但这不是用户可编辑的配置文件，而是Redis群集节点每次发生更改时自动保留群集配置（基本上为状态）的文件，以便能够 在启动时重新读取它。 该文件列出了群集中其他节点，它们的状态，持久变量等等。 由于某些消息的接收，通常会将此文件重写并刷新到磁盘上。

​    　　　　　　**3、cluster-node-timeout <milliseconds>**：Redis群集节点可以不可用的最长时间，而不会将其视为失败。 如果主节点超过指定的时间不可达，它将由其从属设备进行故障切换。 此参数控制Redis群集中的其他重要事项。 值得注意的是，每个无法在指定时间内到达大多数主节点的节点将停止接受查询。

​    　　　　　　**4、cluster-slave-validity-factor <factor>**：如果设置为0，无论主设备和从设备之间的链路保持断开连接的时间长短，从设备都将尝试故障切换主设备。 如果该值为正值，则计算最大断开时间作为节点超时值乘以此选项提供的系数，如果该节点是从节点，则在主链路断开连接的时间未超过最大断开时间，它不会尝试启动故障切换。 例如，如果节点超时设置为5秒，并且有效因子设置为10，则与主设备断开连接超过50秒的从设备将不会尝试对其主设备进行故障切换。 请注意，如果没有从服务器节点能够对其进行故障转移，则任何非零值都可能导致Redis群集在主服务器出现故障后不可用。 在这种情况下，只有原始主节点重新加入集群时，集群才会返回可用。

​    　　　　　　**5、cluster-migration-barrier <count>**：主设备将保持连接的最小从设备数量，以便另一个从设备迁移到不受任何从设备覆盖的主设备。

   　　　　　　 **6、cluster-require-full-coverage <yes / no>**：默认为yes，就是说如果这个key的部分数据没有任何一个节点存储，则集群停止接受写入。 如果该选项设置为no，则即使只有部分子数据，群集仍将提供查询。

### 搭建步骤

#### 1，下载

https://redis.io/

当前最新的稳定版本是4.0.11。压缩包只有1.7M。

#### 2，规划

只有一台机器模拟搭建

规划7001 - 7006 部署6个端口

先建好7001-7006 6个目录，用来放redis配置文件。在每个目录下建好data目录用来存放数据

将安装包解压好

tar -zxvf redis-4.0.11.tar.gz

下载的包只有源码，需要make一下

（注意gcc -v 看下版本 需要4.2以上）

将其中的redis.conf copy一份到7001下

#### 3，修改配置文件

修改点：

bind 10.138.46.25    ：配一下ip

port 7001

daemonize yes    ： 后台启动

pidfile /home/rocketmq410/7001/redis_7001.pid     ：pidfele的路径，改成你自己的

logfile /home/rocketmq410/7001/redis.log   ： 可以打一下日志，默认是达到dev/null

dir /home/rocketmq410/7001/data/             : 存放数据的路径，必须是个目录

cluster-enabled yes

cluster-config-file nodes-7001.conf   : redis节点的配置文件，起个名就好，这个文件是自动生成的

appendonly yes  ：开启追加保存

\# appendfsync always   ：这两个是追加的模式，生成上根据你的需要来选择。有改变就保存还是每秒保存一次

appendfsync everysec    ：这里就用默认的了

改好一个后，每个对应的目录下复制一份

然后修改redis.conf   这里直接全局替换端口就好了，很快

如：  :%s/7001/7003/g

#### 4，安装ruby

redis管理cluster的脚本是用ruby写的，所以需要使用ruby。这个脚本就是src下的redis-trib.rb

单纯使用redis命令管理集群也可以，但是会非常麻烦和危险。

yum install ruby

现在的版本下，只要安装Ruby，Rubygems就会自动安装

所以这个只需要install ruby

#### 5，安装redis的ruby接口

gem install redis

但是我遇到了报错：

ERROR:  Error installing redis:     redis requires Ruby version >= 2.2.2.

解决办法：

[rocketmq410@rocketmq4 ~]$ gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 7D2BAF1CF37B13E2069D6956105BD0E739499BDB 

[rocketmq410@rocketmq4 ~]$ curl -sSL https://get.rvm.io | bash -s stable

[rocketmq410@rocketmq4 ~]$ find / -name rvm -print

/home/rocketmq410/.rvm/src/rvm

/home/rocketmq410/.rvm/src/rvm/bin/rvm

/home/rocketmq410/.rvm/src/rvm/lib/rvm

/home/rocketmq410/.rvm/src/rvm/scripts/rvm

/home/rocketmq410/.rvm/bin/rvm

/home/rocketmq410/.rvm/lib/rvm

/home/rocketmq410/.rvm/scripts/rvm

source /home/rocketmq410/.rvm/scripts/rvm

查看可用版本

[rocketmq410@rocketmq4 ~]$ rvm list known

\# MRI Rubies

[ruby-]1.8.6[-p420]

[ruby-]1.8.7[-head] # security released on head

[ruby-]1.9.1[-p431]

[ruby-]1.9.2[-p330]

[ruby-]1.9.3[-p551]

[ruby-]2.0.0[-p648]

[ruby-]2.1[.10]

[ruby-]2.2[.10]

[ruby-]2.3[.7]

[ruby-]2.4[.4]

[ruby-]2.5[.1]

[ruby-]2.6[.0-preview2]

安装一个新版本

[rocketmq410@rocketmq4 ~]$ rvm install 2.4.1

中间会要输一次密码

[rocketmq410@rocketmq4 ~]$ rvm use 2.4.1

[rocketmq410@rocketmq4 ~]$ rvm use 2.4.1 --default

[rocketmq410@rocketmq4 ~]$ ruby -version

ruby 2.4.1p111 (2017-03-22 revision 58053) [x86_64-linux]

OK了

继续

gem install redis

#### 6，准备就绪，启动实例

[rocketmq410@rocketmq4 src]$ ./redis-server ~/7001/redis.conf

[rocketmq410@rocketmq4 src]$ ./redis-server ~/7002/redis.conf

[rocketmq410@rocketmq4 src]$ ./redis-server ~/7003/redis.conf

[rocketmq410@rocketmq4 src]$ ./redis-server ~/7004/redis.conf

[rocketmq410@rocketmq4 src]$ ./redis-server ~/7005/redis.conf

[rocketmq410@rocketmq4 src]$ ./redis-server ~/7006/redis.conf

[rocketmq410@rocketmq4 src]$ ps -ef | grep redis

rocketm+ 26002     1  0 11:26 ?        00:00:01 ./redis-server 10.138.46.25:7001 [cluster]

rocketm+ 26445     1  0 11:30 ?        00:00:00 ./redis-server 10.138.46.25:7002 [cluster]

rocketm+ 26450     1  0 11:30 ?        00:00:00 ./redis-server 10.138.46.25:7003 [cluster]

rocketm+ 26464     1  0 11:30 ?        00:00:00 ./redis-server 10.138.46.25:7004 [cluster]

rocketm+ 26469     1  0 11:30 ?        00:00:00 ./redis-server 10.138.46.25:7005 [cluster]

rocketm+ 26482     1  0 11:30 ?        00:00:00 ./redis-server 10.138.46.25:7006 [cluster]

rocketm+ 26487  5176  0 11:30 pts/1    00:00:00 grep --color=auto redis

#### 7，配置集群

./redis-trib.rb create --replicas 1 10.138.46.25:7001 10.138.46.25:7002 10.138.46.25:7003 10.138.46.25:7004 10.138.46.25:7005 10.138.46.25:7006

--replicas 1 表示 为每个主节点配置1个备节点

执行，[WARNING] Some slaves are in the same host as their master  有个警告，因为主备在一台机器上是有问题的，生产上要分开部署。  

[OK] All 16384 slots covered

这就搭建完成了

redis集群创建集群分配规则，前3个及节点为主节点，后面的为从节点

#### 8，查看信息

-c 是以集群模式登录

[rocketmq410@rocketmq4 src]$  ./redis-cli -c -h 10.138.46.25 -p 7001

10.138.46.25:7001> CLUSTER INFO

cluster_state:ok

cluster_slots_assigned:16384

cluster_slots_ok:16384

cluster_slots_pfail:0

cluster_slots_fail:0

cluster_known_nodes:6

cluster_size:3

cluster_current_epoch:7

cluster_my_epoch:7

cluster_stats_messages_ping_sent:542

cluster_stats_messages_pong_sent:50

cluster_stats_messages_sent:592

cluster_stats_messages_ping_received:50

cluster_stats_messages_pong_received:50

cluster_stats_messages_update_received:1

cluster_stats_messages_received:101

10.138.46.25:7001> CLUSTER NODES

a0189fb279204ab2bee767587567dbd1445cc3d8 10.138.46.25:7003@17003 master - 0 1535687220000 3 connected 10923-16383

1c8af9390e14a3aa486a12df02bd2fdb9a0107c1 10.138.46.25:7004@17004 slave a0189fb279204ab2bee767587567dbd1445cc3d8 0 1535687220249 4 connected

67ea8a2a279e293416b7e14355cabf73238c3000 10.138.46.25:7005@17005 master - 0 1535687220000 7 connected 0-5460

5bd1384233a584d99fb9fdbab9a2a30c9a62ac21 10.138.46.25:7001@17001 myself,slave 67ea8a2a279e293416b7e14355cabf73238c3000 0 1535687221000 1 connected

66b16c3c134ff7f828e4b2fdd88536c04d884c83 10.138.46.25:7006@17006 slave 1b2a62758e7bd46e4be95fc8dcda12a1bd99723e 0 1535687222256 6 connected

1b2a62758e7bd46e4be95fc8dcda12a1bd99723e 10.138.46.25:7002@17002 master - 0 1535687222000 2 connected 5461-10922