1，下载安装包

2，不使用hugepages

 cat /proc/sys/vm/nr_hugepages

确保其值为零，如果不是请修改执行下面操作。

 echo 0>/proc/sys/vm/nr_hugepages

echo never >> /sys/kernel/mm/transparent_hugepage/enabled

echo never >> /sys/kernel/mm/transparent_hugepage/defrag

软连接限制

65535已经是mongo推荐的设置的，不需要太大

echo 'ulimit -n 655350' **>>** /etc/profile

这里要到etc/security/limits.conf看看是否已经配置过了，如果配置过直接修改，不要echo了，无效 echo '* hard nofile 655350' **>>** /etc/security/limits.conf

echo '* soft nofile 655350' **>>** /etc/security/limits.conf

echo '* soft nproc 655350' **>>** /etc/security/limits.conf

echo '* hard nproc 655350' **>>** /etc/security/limits.conf

3， 建用户

useradd -d /home/mongo364 -m mongo364

passwd mongo364

chage -M 99999 mongo364

建数据目录

mkdir -p /data01/mongodata/key

mkdir -p /data01/mongodata/shard1

mkdir /data01/mongodata/config-replica-set

修改文件夹owner： chown -R mongo364:mongo364  /data01/mongodata

在key目录下，建security文件，内容：lbipshardkey

chmod 400 security   设置只读

4，拷贝包，解压

 

注意：下面的配置文件中的security在第一轮都不要加，创建出超级帐号后，再加重启

注意：

 path: "../log/shard1.log"  

日志文件启动前要先建好

**5，配置shard节点**

vim startshard1.sh

numactl --interleave=all /home/mongo364/mongodb-linux-x86_64-rhel70-3.6.4/bin/mongod -f ./conf/shard1.conf

对应建配置文件.//shard1.conf

systemLog:

   destination: file

   path: "../log/shard1.log"  

   logAppend: true

storage:

   journal:

​       enabled: true

   dbPath: "/data06/mongodata/shard1"

   directoryPerDB: true

   engine: wiredTiger

   wiredTiger:

​       engineConfig:

​           cacheSizeGB: 1

​           directoryForIndexes: true

​           journalCompressor: zlib

​       collectionConfig:

​           blockCompressor: zlib

​       indexConfig:

​           prefixCompression: true

security:

​    authorization: enabled

​    keyFile: "/data01/mongodata/key/security"

net:

​    port: 10000

​    bindIp: 10.138.23.223

processManagement:

​    fork: true

sharding:

​    clusterRole: shardsvr

replication:

​    oplogSizeMB: 200000

​    replSetName: shard1

同样把另外两个配好

启动

将三个节点，组合成一个shard

./mongo 10.138.23.223:10000

config = {_id: 'shard3', members: [

​                          {_id: 0, host: '10.138.22.177:14000'},

​                          {_id: 1, host: '10.138.23.244:14000', arbiterOnly: true},

​                          {_id: 2, host: '10.138.23.245:14000'}]

​           }

rs.initiate(config)

创建用户

进到primary节点

一定要use admin，否则是在test下

db.createUser({user: "root", pwd: "Haier,123", roles:[{role:"root", db:"admin"}]}) db.createUser({user: "admin", pwd: "Haier,123", roles: [{role:"userAdminAnyDatabase", db:"admin"}]})

db.system.users.find().pretty()

**8.配置节点**

vim startconfig-replica-set.sh

/home/mongo364/mongodb-linux-x86_64-rhel70-3.6.4/bin/mongod -f ./security/config-replica-set.conf

vim config-replica-set.conf

systemLog:

​    destination: file

​    path: "../log/configServer-replica-set.log"

​    logAppend: true

storage:

​    journal:                                                                

​        enabled: true

​    dbPath: "/data06/mongodata/config-replica-set"                                              

​    directoryPerDB: true                                                    

​    engine: wiredTiger                                                      

​    wiredTiger:                                                             

​        engineConfig:

​            cacheSizeGB: 2                      

​            directoryForIndexes: true                                         

​            journalCompressor: zlib

​        collectionConfig:                                                    

​            blockCompressor: zlib

​        indexConfig:                                                         

​            prefixCompression: true

net:                                                                       

​    port: 40000

​    bindIp: 10.138.23.223

processManagement:                                                         

​    fork: true

sharding:                                                                  

​    clusterRole: configsvr

replication:

​    replSetName: csReplSet

security:

​    authorization: enabled

​    keyFile: "/data06/mongodata/key/security"

登录：./mongo 10.138.23.223:40000

config = {_id: 'csReplSet',configsvr:true, members: [

​                          {_id: 0, host: '10.138.23.223:40000'},

​                          {_id: 1, host: '10.138.23.224:40000'},

​                          {_id: 2, host: '10.138.23.226:40000'}] }

rs.initiate(config)

对secondary执行

SECONDARY> rs.slaveOk();

去到primary节点创建用户

db.createUser({user: "root", pwd: "Haier,123", roles:[{role:"root", db:"admin"}]}) db.createUser({user: "admin", pwd: "Haier,123", roles: [{role:"userAdminAnyDatabase", db:"admin"}]})

**路由节点：**

vim startmongos.sh

/home/mongo364/mongodb-linux-x86_64-rhel70-3.6.4/bin/mongos -f ./security/mongos.conf

mongos.conf

systemLog:

​    destination: file

​    path: "../log/mongos.log"

​    logAppend: true

net:

​    port: 49000

sharding:

​    configDB: csReplSet/10.138.23.223:40000,10.138.23.224:40000,10.138.23.226:40000

processManagement:

​    fork: true

security:

​    keyFile: "/data06/mongodata/key/security"

分别启动路由节点

**开始加鉴权**

各个配置文件加上security

关闭  重启

加分片

登入mongos 如 ./mongo localhost:49000

use admin

sh.addShard("shard1/10.138.23.223:10000,10.138.23.224:10000,10.138.23.226:10000")

sh.addShard("shard2/10.138.23.244:20000,10.138.23.245:20000,10.138.23.226:20000")

db.runCommand( { listshards : 1 } ) 可查看已加入的分片db.adminCommand({ listShards: 1 })

问题：

1， [main] permissions on /data06/mongodata/key/security are too open

权限太大，需要降低权限

chmod 400 security

2，yml解析错误

https://docs.mongodb.com/manual/reference/configuration-options/#replication-options

去看关键字对不对

注意：：后面必须有个空格

组建复制集

 rs.initiate(config)

{

​        "ok" : 0,

​        "errmsg" : "replSetInitiate quorum check failed because not all proposed set members responded affirmatively: 10.138.23.226:40000 failed with Connection refused, 10.138.23.224:40000 failed with Connection refused",

​        "code" : 74,

​        "codeName" : "NodeNotFound",

​        "$gleStats" : {

​                "lastOpTime" : Timestamp(0, 0),

​                "electionId" : ObjectId("000000000000000000000000")

​        }

}

配置文件中加  bindIp参数