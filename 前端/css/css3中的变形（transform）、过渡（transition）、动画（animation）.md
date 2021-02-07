# css3中的变形（transform）、过渡（transition）、动画（animation）

## 一、 CSS3变形（transform）

语法：

```
transform ： none | <transform-function> [ <transform-function> ]* 
也就是：
transform: rotate | scale | skew | translate |matrix;
```

### 1.1、旋转rotate（）

rotate(<angle>) :通过指定的角度参数对元素指定一个2D rotation(2D旋转)，需先有transform-origin属性的定义（**默认旋转中点是中心点**）。

transform-origin定义的是旋转的基点，其中angle是指选择角度，正顺时针旋转，负逆时针旋转。（关于变形基点已在前几篇中讲解过，[https://segmentfault.com/a/11...](https://segmentfault.com/a/1190000017104127)）

![clipboard.png](https://segmentfault.com/img/bVbqyHG?w=245&h=165)

### 1.2、移动translate（X,Y）

transform(100px,20px);
![clipboard.png](https://segmentfault.com/img/bVbqyIO?w=240&h=160)

transform:translateX(100px):
![clipboard.png](https://segmentfault.com/img/bVbqyI2?w=237&h=124)

transform:translateY(20px)
![clipboard.png](https://segmentfault.com/img/bVbqyJa?w=220&h=130)

### 1.3、缩放scale（X,Y）

scale(<number>[, <number>])：提供执行[sx,sy]缩放矢量的两个参数指定一个2D scale（2D缩放）。如果第二个参数未提供，则取与第一个参数一样的值。而Y是一个可选参数，**如果没有设置Y值，则表示X，Y两个方向的缩放倍数是一样的,并以X为准**。如：transform:scale(2,1.5);

![clipboard.png](https://segmentfault.com/img/bVbqyKt?w=220&h=130)

### 1.4、斜切skew()

skew(<angle> [, <angle>]) ：X轴Y轴上的skew transformation（斜切变换）。第一个参数对应X轴，第二个参数对应Y轴。如果第二个参数未提供，则值为0，也就是Y轴方向上无斜切。skew是用来对元素进行扭曲变行，第一个参数是水平方向扭曲角度，第二个参数是垂直方向扭曲角度。其中第二个参数是可选参数，如果没有设置第二个参数，那么Y轴为0deg。同样是以元素中心为基点，我们也可以通过transform-origin来改变元素的基点位置。

transform:skew(30deg,10deg);
![clipboard.png](https://segmentfault.com/img/bVbqyK4?w=225&h=140)

**方法：X轴：正数为左，负数为右； Y轴：正数为下，负数为上**

## 二、CSS3过渡（transition）

![图片描述](https://segmentfault.com/img/bVbssWY?w=568&h=210)

**属性详解**

**transition-property**

不是所有属性都能过渡，只有属性具有一个中间点值才具备过渡效果。
**transition-duration**

指定从一个属性到另一个属性过渡所要花费的时间。默认值为0，为0时，表示变化是瞬时的，看不到过渡效果。

**transiton-timing-function**

过渡函数，有如下几种：

- liner ：匀速
- ease-in：加速
- ease-out：减速
- ease-in-out：先加速再减速
- cubic-bezier：三次贝塞尔曲线，可以定制

![1072407-20161223165829136-1482102387.png](https://segmentfault.com/img/bVbssMW?w=500&h=171)

**触发过渡**

单纯的代码不会触发任何过渡操作，需要通过用户的行为（如点击，悬浮等）触发，可触发的方式有：
:hoever :focus :checked 媒体查询触发 JavaScript触发

**局限性**

transition的优点在于简单易用，但是它有几个很大的局限。

- （1）transition需要事件触发，所以没法在网页加载时自动发生。
- （2）transition是一次性的，不能重复发生，除非一再触发。
- （3）transition只能定义开始状态和结束状态，不能定义中间状态，也就是说只有两个状态。
- （4）一条transition规则，只能定义一个属性的变化，不能涉及多个属性。

CSS Animation就是为了解决这些问题而提出的。

## 三、CSS3 animation(动画)

CSS3的animation属性可以像Flash制作动画一样，通过控制关键帧来控制动画的每一步，实现更为复杂的动画效果。ainimation实现动画效果主要由两部分组成：

1）通过类似Flash动画中的帧来声明一个动画；
2）在animation属性中调用关键帧声明的动画。**

注：animation属性到目前位置得到了大多数浏览器的支持，但是，需要添加浏览器前缀哦！

**animation动画属性**

还是先列表格来说明属性，自己感觉会比较清晰：
![图片描述](https://segmentfault.com/img/bVbssU0?w=553&h=326)
（1）animation-name：none为默认值，将没有任何动画效果，其可以用来覆盖任何动画
（2）animation-duration：默认值为0，意味着动画周期为0，也就是没有任何动画效果
（3）animation-timing-function：与transition-timing-function一样
（4）animation-delay：在开始执行动画时需要等待的时间
（5）animation-iteration-count：定义动画的播放次数，默认为1，如果为infinite，则无限次循环播放
（6）animation-direction：默认为nomal，每次循环都是向前播放，（0-100），另一个值为alternate，动画播放为偶数次则向前播放，如果为基数词就反方向播放
（7）animation-state：默认为running，播放，paused，暂停
（8）animation-fill-mode：定义动画开始之前和结束之后发生的操作，默认值为none，动画结束时回到动画没开始时的状态；forwards，动画结束后继续应用最后关键帧的位置，即保存在结束状态；backwards，让动画回到第一帧的状态；both：轮流应用forwards和backwards规则。

**@keyframes**
CSS3的animation制作动画效果主要包括两部分：1. 用关键帧声明一个动画，2.在animation调用关键帧声明的的动画。

@keyframes就是关键帧。这个帧与Flash里的帧类似，一个动画中可以有很多个帧。

一个@keyframes中的样式规则是由多个百分比构成的，可以在这个规则上创建多个百分比，从而达到一种不断变化的效果。另外，@keyframes必须要加webkit前缀。举个例子：

```
div:hover {
  -webkit-animation: 1s changeColor;
  animation: 1s changeColor;  
}

@-webkit-keyframes changeColor {
  0% { background: #c00; }
  50% { background: orange; }
  100% { background: yellowgreen; }
}
@keyframes changeColor {
  0% { background: #c00; }
  50% { background: orange; }
  100% { background: yellowgreen; }
}
```

上面代码中的0% 100%的百分号都不能省略，0%可以由from代替，100%可以由to代替。要让changeColor动画有效果，就必须要通过CSS3animation属性来调用它。

**区别**

animation属性类似于transition，他们都是随着时间改变元素的属性值，其主要区别在于：transition需要触发一个事件才会随着时间改变其CSS属性；animation在不需要触发任何事件的情况下，也可以显式的随时间变化来改变元素CSS属性，达到一种动画的效果