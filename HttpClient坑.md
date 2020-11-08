今天要和第三方公司对接一个服务。通过rest服务传文件和一些参数过去。难度不大，先用postman调用了一下，顺利返回结果。于是开写，因为比较熟悉apache.httpcomponents的httpclient，写的也比较顺手。所以直接写了代码，测试总是失败。因为服务提供者没有人员支持，我只能得到一个失败错误，没有任何有效信息。

一次次检查自己的代码，确实没有什么问题。眼看着交工的dead line要到了，没办法。赶紧把以前的一份用java原生的HttpUrlConnection发送POST请求的代码拿来改了改，测试成功。

但是心里觉得太奇怪，没道理httpclient不好使啊。

我倒要看看他们发出的包到底有什么不一样。

### 使用Fiddler抓包

抓包工具我这边使用的是fiddler。关于fiddler的基本操作这里就不讲了。

**使用postman的请求包：**

![](D:\文章\image-20200313173218949.png)

![](D:\文章\image-20200313210053002.png)

对代码进行抓包。这里有点操作需要讲讲了。

首先看下你的抓包工具监听的端口是啥，默认是8888.

![image-20200313222148038](D:\文章\image-20200313222148038.png)

然后需要对代码进行一些改造。fiddler可以方便的抓取浏览器，操作系统的http请求，但是我们在代码里发出的http，fiddler是抓不到的。需要在代码里设置代理。

**java HttpUrlConnection的请求包：**

设置代理的代码：

```java
Proxy proxy = new Proxy(java.net.Proxy.Type.HTTP,
      new InetSocketAddress("127.0.0.1", 8888));
URL realUrl = new URL(url);
HttpURLConnection urlConnection = (HttpURLConnection) realUrl.openConnection(proxy);
```

![image-20200313202539770](D:\文章\image-20200313202539770.png)

![image-20200313202710364](D:\文章\image-20200313202710364.png)

**使用apache commons 的HttpClient**

设置代理的代码：

```
//设置代理IP、端口、协议（请分别替换）
HttpHost proxy = new HttpHost("127.0.0.1", 8888, "http");

//把代理设置到请求配置
RequestConfig defaultRequestConfig = RequestConfig.custom()
        .setProxy(proxy)
        .build();
CloseableHttpClient client = HttpClients.custom().setDefaultRequestConfig(defaultRequestConfig).build();
```

![image-20200313205829683](D:\文章\image-20200313205829683.png)

![image-20200313205919387](D:\文章\image-20200313205919387.png)



通过抓包，发现了问题的根源原来是中文乱码。又是编码问题。

### 问题解决：

通过自定义一个contentType

```java
ContentType contentType = ContentType.create("text/plain", Charset.forName("UTF-8"));
```

然后在addTextBody时，指明使用自定义的这个contentType

```
builder.addTextBody(entry.getKey(), entry.getValue(), ContentType.TEXT_PLAIN);
```

测试，好了

![image-20200313210525502](D:\文章\image-20200313210525502.png)

text/plain和一个ContentType.TEXT_PLAIN很像啊，

改成ContentType.TEXT_PLAIN试试，发现也不行。我们来对比下：

```
ContentType.create("text/plain", Charset.forName("UTF-8"));
```

```
ContentType TEXT_PLAIN = create("text/plain", Consts.ISO_8859_1);
```

最后发现是编码格式的问题。

一句话，记住：通过httpClient发送form表单中有中文的，要设置编码格式为`ContentType.create("text/plain", Charset.forName("UTF-8"));`



