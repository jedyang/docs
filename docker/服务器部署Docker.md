## 服务器部署Docker



根据自己的linux系统选择对应的官方文档。

我的是centos，下面将centos的步骤

#### 1，可能会有老版本的docker干扰，先移除干净

$ sudo yum remove docker \                  docker-client \                  docker-client-latest \                  docker-common \                  docker-latest \                  docker-latest-logrotate \                  docker-logrotate \                  docker-engine

#### 安装依赖

$ sudo yum install -y yum-utils device-mapper-persistent-data lvm2

#### 指定阿里云镜像源

sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

#### 安装最新版本docker

sudo yum install docker-ce docker-ce-cli containerd.io

##### 安装指定版本的docker

##### 查看所有版本

yum list docker-ce --showduplicates | sort -r

##### 安装指定版本

sudo yum install docker-ce-18.09.1 docker-ce-cli-18.09.1 containerd.io

#### 启动docker

sudo systemctl start docker

#### 测试

sudo docker run hello-world

会从docker的镜像仓库拉取镜像并运行。

**建立 docker 用户组**

默认情况下，docker 命令会使用 [Unix socket](https://en.wikipedia.org/wiki/Unix_domain_socket) 与 Docker 引擎通讯。而只有 root 用户和 docker 组的用户才可以访问 Docker 引擎的 Unix socket。出于安全考虑，一般 Linux 系统上不会直接使用 root 用户。因此，更好地做法是将需要使用 docker 的用户加入 docker 用户组。

建立 docker 组：

$ sudo groupadd docker

将当前用户加入 docker 组：

$ sudo usermod -aG docker $USER

退出重新登录，即可使用

docker run hello-world

测试一下



### 报错解决

#### 报错

>docker: Error response from daemon: Get https://registry-1.docker.io/v2/library/hello-world/manifests/latest: Get https://auth.docker.io/token?scope=repository%3Alibrary%2Fhello-world%3Apull&service=registry.docker.io: net/http: TLS handshake timeout.

解决：配置阿里云的镜像源

CentOS 7系统的配置步骤：

1、打开daemon.json文件：

```java
vi /etc/docker/daemon.json
1
```

2、在里面输入阿里云镜像配置：

```java
{
 "registry-mirrors":["https://6kx4zyno.mirror.aliyuncs.com"]
}
123
```

3、重启docker服务：

```java
sudo systemctl restart docker
```



2021.2.22日更新

今天在腾讯云的一台云主机上安装了最新版docker  3:20.10.3-3.el7版本

又报上面的错误，当时上面的方法没有解决问题。

在网上找到一下解决方法，测试可用：

#### 报错：

[root@VM-0-3-centos ~]# docker run hello-world
Unable to find image 'hello-world:latest' locally
docker: Error response from daemon: Head https://registry-1.docker.io/v2/library/hello-world/manifests/latest: Get https://auth.docker.io/token?scope=repository%3Alibrary%2Fhello-world%3Apull&service=registry.docker.io: net/http: TLS handshake timeout.

#### 解决：

```
[root@docker-registry ~]# yum install bind-utils                          // 安装dig工具
[root@docker-registry ~]# dig @114.114.114.114 registry-1.docker.io
```

114.114.114.114是

**选择上面命令执行结果中的一组解析放到本机的/etc/hosts文件里做映射**

```
[root@docker-registry ~]# vim /etc/hosts
54.175.43.85    registry-1.docker.io
```