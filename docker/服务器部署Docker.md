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