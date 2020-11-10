## 代码同时提交到Github和码云

因为网络问题，有时Github会非常慢。可以在Github和码云同步同一个仓库，做一个备份。

以后push代码要提交到两个仓库里。

我的代码最初是在码云里。

不管是github还是码云都可以直接复制其他的仓库。创建仓库的时候选择import即可。



查看当前仓库信息：

```
$ git remote -v
origin  https://gitee.com/helloyunsheng/docs.git (fetch)
origin  https://gitee.com/helloyunsheng/docs.git (push)

```

现在时只有码云的地址

添加新的远程仓库地址

```
$ git remote add github https://github.com/jedyang/docs.git
```

再次查看

```
$ git remote -v
github  https://github.com/jedyang/docs.git (fetch)
github  https://github.com/jedyang/docs.git (push)
origin  https://gitee.com/helloyunsheng/docs.git (fetch)
origin  https://gitee.com/helloyunsheng/docs.git (push)

```

提交代码时

```
 git push github master
```

可以指定提交哪个分支到哪个仓库

