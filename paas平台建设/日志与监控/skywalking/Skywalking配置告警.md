## Skywalking配置告警

在skywalking目录的config目录下的alarm-setings.yml文件中进行配置。

我前面使用docker部署的skywalking

### docker下修改

docker ps 查看下skywalking-oap容器的id

```
docker exec -it 容器id bash
```

进入oap容器

```
bash-5.0# ls
LICENSE               README.txt            cli                   docker-entrypoint.sh  ext-libs              oap-libs
NOTICE                bin                   config                ext-config            licenses              tools
bash-5.0# cd config/
bash-5.0# ls
alarm-settings-sample.yml    application.yml              endpoint-name-grouping.yml   gateways.yml                 meter-analyzer-config        otel-oc-rules                ui-initialized-templates
alarm-settings.yml           component-libraries.yml      fetcher-prom-rules           log4j2.xml                   oal                          service-apdex-threshold.yml

```

修改alarm-settings.yml文件

重启容器



### 配置规则

触发条件：在一定的时间段内满足告警条件，通过webhook接口对外发送告警信息。

```
rules:
  # Rule unique name, must be ended with `_rule`.
  endpoint_percent_rule:
    # Metrics value need to be long, double or int
    metrics-name: endpoint_percent
    threshold: 75
    op: <
    # The length of time to evaluate the metrics
    period: 10
    # How many times after the metrics match the condition, will trigger alarm
    count: 3
    # How many times of checks, the alarm keeps silence after alarm triggered, default as same as period.
    silence-period: 10
    message: Successful rate of endpoint {name} is lower than 75%
```

- 规则名：必须唯一，必须以_rule结尾。message中的{name}会替换成该名字
- metrics-name：指标名。oal脚本中的指标名。
- threshold：阈值。单个指标的很好理解。对于多个值指标，例如百分比**percentile**，阈值是一个数组。像`value1` `value2` `value3` `value4` `value5`这样描述. 每个值可以作为度量中每个值的阈值。如果不想通过此值或某些值触发警报，则将值设置为 `-`.
  例如在**百分比**中，`value1`是P50的阈值,且 `-，-，value3, value4, value5`的意思是，没有阈值的P50和P75百分位告警规则
- op：操作符，目前支持>`，`>=`，`<`，`<=`，`=
- period：周期窗口。
- count：计数次数或时间。在周期窗口内，如果超过阈值的次数达到设定的这个count，触发告警
- silence-period：静默时间。触发告警后，多少时间保持静默，不要告警。
- message：告警信息
- 



### 默认规则

alarm-setings.yml文件中已经配置了7个默认规则

1.最近 3 分钟内服务平均响应时间超过 1 秒。

 2.服务成功率在最近 2 分钟内低于80%。

 3.服务响应时间在最近 3 分钟内低于 1000 毫秒. 

4.服务实例在最近 2 分钟内的平均响应时间超过 1 秒。

 5.端点平均响应时间在最近 2 分钟内超过1秒。

 6.数据库访问平均响应时间在过去 2 分钟内超过 1 秒。 

7.端点之间平均响应时间在最近 2 分钟内超过 1 秒。



### webhooks

```
webhooks:
  - http://127.0.0.1/notify/
```

webhooks里配置接收告警的服务。这个就需要我们自己开发了。

告警的消息会通过 HTTP 请求进行发送, 请求方法为 `POST`, `Content-Type` 为 `application/json`, JSON 格式基于 `List<org.apache.skywalking.oap.server.core.alarm.AlarmMessage`, 包含以下信息.

- **scopeId**. 所有可用的 Scope 请查阅 `org.apache.skywalking.oap.server.core.source.DefaultScopeDefine`.
- **name**. 目标 Scope 的实体名称.
- **id0**. Scope 实体的 ID.
- **id1**. 未使用.
- **ruleName**. 您在 `alarm-settings.yml` 中配置的规则名.
- **alarmMessage**. 报警消息内容.
- **startTime**. 告警时间, 位于当前时间与 UTC 1970/1/1 之间.

源码中的类

```
@Setter
@Getter
public class AlarmMessage {
    private int scopeId;
    private String scope;
    private String name;
    private String id0;
    private String id1;
    private String ruleName;
    private String alarmMessage;
    private long startTime;
    private transient boolean onlyAsCondition;
}
```





### 动态配置

在config/application.yml文件中，有以下配置

```
configuration:
  selector: ${SW_CONFIGURATION:none}
  none:
  grpc:
    host: ${SW_DCS_SERVER_HOST:""}
    port: ${SW_DCS_SERVER_PORT:80}
    clusterName: ${SW_DCS_CLUSTER_NAME:SkyWalking}
    period: ${SW_DCS_PERIOD:20}
  apollo:
    apolloMeta: ${SW_CONFIG_APOLLO:http://localhost:8080}
    apolloCluster: ${SW_CONFIG_APOLLO_CLUSTER:default}
    apolloEnv: ${SW_CONFIG_APOLLO_ENV:""}
    appId: ${SW_CONFIG_APOLLO_APP_ID:skywalking}
    period: ${SW_CONFIG_APOLLO_PERIOD:5}
  zookeeper:
    period: ${SW_CONFIG_ZK_PERIOD:60} # Unit seconds, sync period. Default fetch every 60 seconds.
    nameSpace: ${SW_CONFIG_ZK_NAMESPACE:/default}
    hostPort: ${SW_CONFIG_ZK_HOST_PORT:localhost:2181}
    # Retry Policy
    baseSleepTimeMs: ${SW_CONFIG_ZK_BASE_SLEEP_TIME_MS:1000} # initial amount of time to wait between retries
    maxRetries: ${SW_CONFIG_ZK_MAX_RETRIES:3} # max number of times to retry
  etcd:
    period: ${SW_CONFIG_ETCD_PERIOD:60} # Unit seconds, sync period. Default fetch every 60 seconds.
    group: ${SW_CONFIG_ETCD_GROUP:skywalking}
    serverAddr: ${SW_CONFIG_ETCD_SERVER_ADDR:localhost:2379}
    clusterName: ${SW_CONFIG_ETCD_CLUSTER_NAME:default}
  consul:
    # Consul host and ports, separated by comma, e.g. 1.2.3.4:8500,2.3.4.5:8500
    hostAndPorts: ${SW_CONFIG_CONSUL_HOST_AND_PORTS:1.2.3.4:8500}
    # Sync period in seconds. Defaults to 60 seconds.
    period: ${SW_CONFIG_CONSUL_PERIOD:60}
    # Consul aclToken
    aclToken: ${SW_CONFIG_CONSUL_ACL_TOKEN:""}
  k8s-configmap:
    period: ${SW_CONFIG_CONFIGMAP_PERIOD:60}
    namespace: ${SW_CLUSTER_K8S_NAMESPACE:default}
    labelSelector: ${SW_CLUSTER_K8S_LABEL:app=collector,release=skywalking}
  nacos:
    # Nacos Server Host
    serverAddr: ${SW_CONFIG_NACOS_SERVER_ADDR:127.0.0.1}
    # Nacos Server Port
    port: ${SW_CONFIG_NACOS_SERVER_PORT:8848}
    # Nacos Configuration Group
    group: ${SW_CONFIG_NACOS_SERVER_GROUP:skywalking}
    # Nacos Configuration namespace
    namespace: ${SW_CONFIG_NACOS_SERVER_NAMESPACE:}
    # Unit seconds, sync period. Default fetch every 60 seconds.
    period: ${SW_CONFIG_NACOS_PERIOD:60}
    # Nacos auth username
    username: ${SW_CONFIG_NACOS_USERNAME:""}
    password: ${SW_CONFIG_NACOS_PASSWORD:""}
    # Nacos auth accessKey
    accessKey: ${SW_CONFIG_NACOS_ACCESSKEY:""}
    secretKey: ${SW_CONFIG_NACOS_SECRETKEY:""}
```

可以看到，skywalking支持非常多的外部配置中心。默认是不开启的，设置为none。

要使用哪个，就将selector配置为哪个。

配置的key为`alarm.default.alarm-settings`

配置的值格式必须和alarm-settings.yml 文件一致



