要先部署jdk

http://10.138.66.1/BCN8x/jdk-8u151-linux-x64.tar.gz

下载不讲

 tar -zxvf jdk-8u151-linux-x64.tar.gz 

修改环境变量，、

通过修改.bash_profile的方式。这种方式更安全，只对当前用户生效。

vim .bash_profile

在最后加上你自己的路径

export JAVA_HOME=/home/haieradmin/jdk1.8.0_151

export PATH=$JAVA_HOME/bin:$PATH

执行source .bash_profile使环境变量生效

看一下java -version

java version "1.8.0_151"

Java(TM) SE Runtime Environment (build 1.8.0_151-b12)

Java HotSpot(TM) 64-Bit Server VM (build 25.151-b12, mixed mode)

OK了

下载zookeeper安装包

http://10.138.66.1/BvEtB/zookeeper-3.4.5.tar.gz

这个自己去官网下载，不讲了

tar -zxvf zookeeper-3.4.12.tar.gz

建目录   

cd zookeeper-3.4.12

mkdir log data

配置myid

注意，只有这一步是不一样的，在三台机器上分别执行：

echo '1' > data/myid

echo '2' > data/myid

echo '3' > data/myid

修改配置文件

cd conf

cp zoo_sample.cfg zoo.cfg

vim zoo.cfg

把以前的dataDir注释掉

然后增加以下配置内容

dataDir=/home/haieradmin/zookeeper-3.4.12/data

dataLogDir=/home/haieradmin/zookeeper-3.4.12/log

server.1=10.133.42.153:2888:3888 server.2=10.133.42.154:2888:3888 server.3=10.133.42.155:2888:3888

server.x的x与上一步配置的myid是要对应起来的

2888端口号是表示这台服务器与集群中的Leader服务器交换信息的端口。

3888端口表示的是万一集群中的Leader服务器挂了，需要一个端口来重新进行选举，选出一个新的Leader，这个端口就是用来执行选举时服务器相互通信的端口。

autopurge.snapRetainCount=20

autopurge.purgeInterval=48

maxClientCnxns=0

防火墙打开相关端口

2181，2888，3888

启动

cd bin

./zkServer.sh start

./zkServer.sh stop ./zkServer.sh restart

./zkServer.sh status

问题排查：

可能因为某些问题，导致Zookeeper没起来。

./zkServer.sh start[haieradmin@ppaasmmongo1 bin]$ ./zkServer.sh status

ZooKeeper JMX enabled by default

Using config: /home/haieradmin/zookeeper-3.4.12/bin/../conf/zoo.cfg

Error contacting service. It is probably not running.

这个时候去bin/zookeeper.out查看日志

一般常见的是java.net.NoRouteToHostException: No route to host (Host unreachable)

这个就是你防火墙没打开的问题

firewall-cmd --list-ports

如果是zk初始启动都没起来，这个时候日志也是也是没有输出的。

解决办法是：

可以使用前台启动，就可以看到日志了

zkServer.sh start-foreground

配置参数解释：

​    autopurge.snapRetainCount=20

​    autopurge.purgeInterval=48

此处我们的配置就是：保留48小时内的日志，并且保留20个文件

autopurge.purgeInterval  这个参数指定了清理频率，单位是小时，需要填写一个1或更大的整数，默认是0，表示不开启自己清理功能。

autopurge.snapRetainCount 这个参数和上面的参数搭配使用，这个参数指定了需要保留的文件数目。默认是保留3个。

maxClientCnxns 单个ip的最大连接数，默认是60个，可以改大点。设置成0，取消这个限制