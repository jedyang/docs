## 一键部署springboot项目到docker

### docker端

docker端需要打开远程访问端口，这样才能允许我们本地打好的镜像直接传到docker容器里

#### 修改docker配置文件

```
vim /usr/lib/systemd/system/docker.service
```

修改ExecStart行为，加入以下内容

```
-H tcp://0.0.0.0:6009  -H unix:///var/run/docker.sock
```

注意，默认是2375端口，我这里用6009是因为我这台服务器的这个端口恰好被别人用了。





