### Redis5集群配置参数问题

今天有人让我帮忙看，他的redis集群切换要15秒多。

之前我用的是redis4，切换基本是秒级的，业务都是无感的。这个15秒似乎有点慢。

看了下redis5的配置参数

#### Redis集群的参数配置

在redis.conf中的一些参数说明：

##### cluster-enabled <yes/no>:

如果配置”yes”则开启集群功能，此redis实例作为集群的一个节点，否则，它是一个普通的单一的redis实例。

##### cluster-config-file :

注意：虽然此配置的名字叫“集群配置文件”，但是此配置文件不能人工编辑，它是集群节点自动维护的文件，主要用于记录集群中有哪些节点、他们的状态以及一些持久化参数等，方便在重启时恢复这些状态。通常是在收到请求之后这个文件就会被更新。

##### cluster-node-timeout :

这是集群中的节点能够失联的最大时间，超过这个时间，该节点就会被认为故障。如果主节点超过这个时间还是不可达，则用它的从节点将启动故障迁移，升级成主节点。注意，任何一个节点在这个时间之内如果还是没有连上大部分的主节点，则此节点将停止接收任何请求。

##### cluster-slave-validity-factor :

如果设置成０，则无论从节点与主节点失联多久，从节点都会尝试升级成主节点。如果设置成正数，则cluster-node-timeout乘以cluster-slave-validity-factor得到的时间，是从节点与主节点失联后，此从节点数据有效的最长时间，超过这个时间，从节点不会启动故障迁移。假设cluster-node-timeout=5，cluster-slave-validity-factor=10，则如果从节点跟主节点失联超过50秒，此从节点不能成为主节点。注意，如果此参数配置为非0，将可能出现由于某主节点失联却没有从节点能顶上的情况，从而导致集群不能正常工作，在这种情况下，只有等到原来的主节点重新回归到集群，集群才恢复运作。

##### cluster-migration-barrier

主节点需要的最小从节点数，只有达到这个数，主节点失败时，它从节点才会进行迁移。更详细介绍可以看本教程后面关于副本迁移到部分。

##### cluster-require-full-coverage

<yes/no>:在部分key所在的节点不可用时，如果此参数设置为”yes”(默认值),
则整个集群停止接受操作；如果此参数设置为”no”，则集群依然为可达节点上的key提供读操作。



看redis.conf文件中说

> For maximum availability, it is possible to set the replica-validity-factor
>to a value of 0, which means, that replicas will always try to failover the
>master regardless of the last time they interacted with the master.
> (However they'll always try to apply a delay proportional to their
> offset rank).
>
> Zero is the only value able to guarantee that when all the partitions heal
> the cluster will always be able to continue.

为了保持最高的高可用性，可以将replica-validity-factor设置为0.这样备节点总会尝试进行failover 

所以，建议配置为

```
cluster-node-timeout 5000
cluster-slave-validity-factor 0
```

