## Docker部署Mysql



### 1，拉取Mysql5.7的镜像

```
docker pull mysql:5.7
```

### 2,配置启动命令

创建mysql数据相关的挂载目录

```
mkdir -p  /mydata/mysql/data /mydata/mysql/log /mydata/mysql/conf
```

启动命令

```
docker run -p 3266:3306 --name mysql \
-v /mydata/mysql/log:/var/log/mysql \
-v /mydata/mysql/data:/var/lib/mysql \
-v /mydata/mysql/conf:/etc/mysql \
-e MYSQL_ROOT_PASSWORD=root  \
-e LANG=C.UTF-8 \
-d mysql:5.7 \
--character-set-server=utf8mb4 \
--collation-server=utf8mb4_unicode_ci
```

#### 参数说明

- -p 3266:3306：将容器的3306端口映射到主机的3266端口
- -v /mydata/mysql/conf:/etc/mysql：将配置文件夹挂在到主机
- -v /mydata/mysql/log:/var/log/mysql：将日志文件夹挂载到主机
- -v /mydata/mysql/data:/var/lib/mysql/：将数据文件夹挂载到主机
- -e MYSQL_ROOT_PASSWORD=root：初始化root用户的密码

### 3，创建数据库

- 进入MySQL容器

```
docker exec -it mysql /bin/bash
```



- 创建数据库及用户

  进入mysql控制台

  ```
  mysql -uroot -proot --default-character-set=utf8
  ```

  创建数据库myworld

  ```
  create database myworld character set utf8
  ```

  

  创建一个用户`myworld:xxxxxxx`帐号并修改权限，使得任何ip都能访问：

  ```
  grant all privileges on *.* to 'myworld' @'%' identified by 'xxxxxxx';
  ```

  

