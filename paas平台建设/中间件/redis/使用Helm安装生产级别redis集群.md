## 使用Helm安装生产级别redis集群

1，添加bitnami的仓库

```
 helm repo add bitnami https://charts.bitnami.com/bitnami
```

2，查询redis资源

```
 helm search repo redis
 NAME                    CHART VERSION   APP VERSION     DESCRIPTION
bitnami/redis           14.1.1          6.2.3           Open source, advanced key-value store. It is of...
bitnami/redis-cluster   6.0.5           6.2.3           Open source, advanced key-value store. It is of...
```

就选这个redis-cluster

