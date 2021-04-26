# CSS动画知识总结

## transform和它的4个属性值

### 1、translate（位移）

```html
transform: translate(12px, 50%);
transform: translateX(12px);
transform: translateY(50%);
transform: translateX(-12px);
transform: translateY(-50%); 
复制代码
```

可以在x轴y轴甚至是z轴进行位移，一般在z轴位移如果是2D的效果肉眼是难以分辨的（规律是近大远小），数值也可以是正数、负数和百分数（自身大小的百分值）。

正数是往轴的正方向移动，也就是轴的箭头指向方向，负数则相反。

这里有一个**元素居中**的小技巧（如下代码）

```html
left：50%;
top：50%;
transform:translate(-50%,-50%);
复制代码
```

### 2、scale (缩放)

```html
transform: scale(1.2);全方位
transform: scale(2, 0.5);
transform: scaleX(2);仅x轴方向
transform: scaleY(0.5);仅y轴方向
复制代码
```

### 3、rotate（旋转）默认以Z轴为基准旋转

```html
transform: rotate3d(1, 2.0, 3.0, 10deg);3D效果
transform: rotateX(10deg);
transform: rotateY(10deg);
transform: rotateZ(10deg);
复制代码
```

### 4、skew（倾斜）

```html
transform: skew(30deg, 1deg);
transform: skewX(30deg);
transform: skewY(1deg);
复制代码
```

我们需要注意的是倾斜和旋转的区别，旋转图片不会变样子，而倾斜在会让图片失去原来的样子，变得扁平化，就像口香糖一样用力拉扯它会变得很细。

## transition（过渡）

顾名思义让transform在变化是有一个过度效果，不然transform就像穿越一样移动。

`transition`主要包含四个属性值：

变换的属性：`transition-property`,

延续的时间：`transition-duration`,

在延续时间段，变换的速率变化：`transition-timing-function`,

延迟时间：`transition-delay`。

一般可以写成

```
transition：属性名、时长、过度方式、延迟
```

1、`transition-property`（属性名）可以同时写多个属性名直接用“，”隔开。

属性名可以是：`all（所有属性改变，这个常用）、opacity（透明度）、color（background-color,border-color,color等）`等等

2、`transition-duration`（时长）

3、`transition-timing-function`(过度方式)

```
a、`ease`：（逐渐变慢）默认值

b、`linear`：（匀速）

c、`ease-in`：(加速)

d、`ease-out`：（减速）

e、`ease-in-out`：（加速然后减速）
复制代码
```

常用的就这几个。

4、`transition-delay` (延迟时间)

注意：永远不要在过渡的时候用`display：none`→`display：block`，

应转换成`visibility：hidden`→`visibility：visible`。

## animation

首先声明一个关键帧(`@keyframes`) - 主要作用是定义动画在不同阶段的状态。

```css
@keyframes xxx {  

  from { transform: scaleX(0); }  
  
  to   { transform: scaleX(1); }  
  
}
复制代码
xxx（自己随意声明）最后写在animation的属性值中（匹配） 
 @keyframes xxxx {  
    0% {}  
    30% {}  
    50% {}  
    70% {}  
    80% {}  
    100% {}  
  }  
复制代码
```

一般有上面两种不同的写法，看个人需求来选择。

```
animation的属性值：时长、过度方式、延迟、次数、方向、填充模式、是否暂停、动画名(xxxx).
```

1、时长（s、ms等）

2、过度方式（同transition的过度方式）

3、延迟（s、ms等）

4、次数（执行几次，单程重复，加入方向才能实现往返）infinite （永不停止）

5、方向 a、`normal` 正常方向

b、`alternate`（交替）

c、`reverse` 返回过来（有来有回）

d、`alternate-reverse`先从终点开始，再从起点开始

6、填充模式

a、`none` 动画执行前后不改变任何样式

b、`forwards` 保持目标动画最后一帧的样式

c、`backwards` 保持目标动画第一帧的样式

7、是否暂停
 `paused`代表暂停，`running`代表恢复

8、动画名 `@keyframes` 的名称 , 自己命名


作者：WE5T3
链接：https://juejin.cn/post/6952481618736971806
来源：掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。