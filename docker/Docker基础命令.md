## Docker基础命令

docker pull 镜像名字 拉取远端的img,可以加版本，默认是latest

docker build 构建img

docker images：显示本地有哪些镜像

### docker run

 -d 运行一个容器，-d是后台运行

--link可以用来链接2个容器，使得源容器（被链接的容器）和接收容器（主动去链接的容器）之间可以互相通信，并且接收容器可以获取源容器的一些数据，如源容器的环境变量。

**--link的格式：**

--link <name or id>:alias

其中，name和id是源容器的name和id，alias是源容器在link下的别名。

docker run -p 8080:80 -d nginx 比如运行一个nginx -p的意识是将host主机的8080端口映射到容器的80端口  -d是守护进程的意思



### docker start

 启动一个已经创建过的容器

docker ps  查看当前正在运行的docker容器

docker ps -a 查看所有容器信息，包括之前运行过，已经停止的

docker cp 可以往docker容器里copy文件

docker stop dockerId  停止一个容器

docker commit -m '更新说明'  dockerid  新镜像的名字：可以保存对容器内镜像的修改，保存后会生成个新的image

docker rmi 镜像id  删除img

docker rm 容器id  删除一个容器

docker exec -it 容器id bash或sh ：进入容器内命令行

### 查看日志

docker logs -f  容器id

查看日志，也可以直接去/var/lib/docker/containers/ 具体容器挂载的目录下，直接看日志json格式