## CSS的position属性

### relative

是相对自己原来正常的位置。

不脱离文档流。其他的页面元素当它还占据自己原来的位置。

比如，top 表示相对原来的位置往下移动。



### absolute

相对于最近的一个被指定了position属性的父容器定位。一般是`position: relative`。这就是`子绝父相`的说法。如果都没设置最终会找到`<body>`标签

脱离文档流。



### fixed

相对于浏览器窗口的定位。

脱离文档流。

因为是相对于浏览器窗口，所以fixed定位的元素在滚屏时不会移动。