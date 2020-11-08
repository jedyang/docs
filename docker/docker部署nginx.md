## Docker部署Nginx

### 部署Docker

略



### 下载nginx1.15.12的docker镜像：

```
docker pull nginx:1.15.12
```

### 从容器中拷贝nginx配置

1，先运行一次容器（为了拷贝配置文件）：

```
mkdir -p nginx/html nginx/logs 
```

2，手动创建下目录，不会有权限问题

```
docker run -p 9090:80 --name nginx -v /home/haieradmin/nginx/html:/usr/share/nginx/html -v /home/haieradmin/nginx/logs:/var/log/nginx -d nginx:1.15.12
```

现在访问9090，会403。这是因为我们挂在的html目录下没有index.html，不要害怕，这是正常的。



3，将容器内的配置文件拷贝到指定目录：

```
docker cp nginx:/etc/nginx /home/haieradmin/nginx/
```

4，修改文件夹名称：

```
mv /home/haieradmin/nginx/nginx /home/haieradmin/nginx/conf
```

6，终止并删除容器：

```
docker stop nginx
docker rm nginx
```

### 根据自己的需要修改配置文件

### 使用docker命令启动：

挂载目录和配置文件

```
docker run -p 9090:80 --name nginx -v /home/haieradmin/nginx/html:/usr/share/nginx/html -v /home/haieradmin/nginx/logs:/var/log/nginx -v /home/haieradmin/nginx/conf:/etc/nginx -d nginx:1.15.12
```



#### 刷新ng

$ docker exec -it nginx bash
\> service nginx reload

或者

 docker exec -i [nginx容器名/id] nginx -s reload