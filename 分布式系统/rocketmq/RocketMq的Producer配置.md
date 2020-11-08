## RocketMq的Producer配置

DefaultMQProducer

![image-20201021161520883](C:\Users\hello\AppData\Roaming\Typora\typora-user-images\image-20201021161520883.png)

所有的消息发送都通过DefaultMQProducer作为入口。DefaultMQProducer继承ClientConfig。ClientConfig中是Producer和Consumer都会用到的配置。

所以先看ClientConfig中的配置

### ClientConfig

#### namesrvAddr

namesrv的地址，一般我们都会设置。多个的话用；隔开。

不设置的话，会从环境变量中取。

#### clientIP

客户端ip。默认值是获取本机ip。

这个值还是很有用的。会保存到消息的bornHost字段中，标记消息是哪台机器发出的。

这里有获取本机ip的代码，getLocalAddress可以参考使用。

#### instanceName

客户端实例名

默认值是从环境变量`rocketmq.client.name`取，或者使用`DEFAULT`

虽然这里设置了默认值`DEFAULT`

但是在客户端启动时，会判断如果是DEFAULT，会用进程号PID来作为实例名

```
public void changeInstanceNameToPID() {
    if (this.instanceName.equals("DEFAULT")) {
        this.instanceName = String.valueOf(UtilAll.getPid());
    }
}
```