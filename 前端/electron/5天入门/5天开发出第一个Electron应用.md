## 5天开发出第一个Electron应用

### 第一天，通读官方文档

https://www.electronjs.org/docs

安装环境

注意的一点事  npm install --registry=https://registry.npm.taobao.org

启动demo

electron应用本质上是一个Node.js应用程序，应用的入口是`package.json`文件，将Chromium和Node.js合并到同一个运行环境。

应用架构

两种进程。

Electron 运行 `package.json` 的 `main` 脚本的进程被称为**主进程**。 在主进程中运行的脚本通过创建web页面来展示用户界面。 一个 Electron 应用总是有且只有一个主进程。

每个 Electron 中的 web 页面运行在它自己的**渲染进程**中。

在普通的浏览器中，web页面通常在沙盒环境中运行，并且无法访问操作系统的原生资源。 然而 Electron 的用户在 Node.js 的 API 支持下可以在页面中和操作系统进行一些底层交互。



因为集成了 `nodejs`，渲染进程也有了操作系统底层 API 的能力，所以渲染进程里可以直接操作文件





问题：

renderer.js中使用require报错：require is not defined

解决方法在new BrowserWindow时添加配置

![image-20200423102230340](D:\文章\前端\electron\5天入门\image-20200423102230340.png)

原因: electron 5.0 后 nodeIntegration 默认为 false





热更新

https://blog.csdn.net/GISuuser/article/details/86685510

