## Stream全解析

### Lambda表达式

先从基础的lamda表达式开始讲起

java8新增的语言级特性,和javascript等函数式编程语言不同。在java中，lambda表达式依然是一个对象。它必须依附于一种特殊的对象类型functional interface。（称为方法引用或者函数式接口）

#### 语法

```
(arg1, arg2...) -> { body }

(type1 arg1, type2 arg2...) -> { body }
```

1. 简单的说，可以看成是没有访问修饰符、返回值声明和名字的方法

2. 参数类型可以省略，自动推断

3. 只有一个参数时，（）可以省略

4. 匿名函数的返回类型与代码块的返回类型一致，若没有返回则为空

5. 函数体，只有一条语句时，可省略{}

6. 每个 Lambda 表达式都能隐式地赋值给函数式接口

   比如 Runnable就是一个函数式接口(用@FunctionalInterface注解修饰)

   Runnable r = () -> System.out.println("hello world");

7. 当不指明函数式接口时，编译器会自动解释这种转化

   new Thread(

      () -> System.out.println("hello world")

   ).start();

#### 双冒号(::)操作符

另一种将常规方法转化为 Lambda 表达式的方法

#### 与匿名类的区别

一大区别在于关键词的使用。

对于匿名类，关键词 this 解读为匿名类，而对于 Lambda 表达式，关键词 this 解读为使用 Lambda 的外部类。

另一不同在于两者的编译方法。

Java 编译器编译 Lambda 表达式并将他们转化为类里面的私有函数，它使用 Java 7 中新加的 invokedynamic 指令动态绑定该方法



### 方法引用或函数接口

上面提到了一个注解FunctionalInterface,可翻译为方法引用或函数接口.

java8新增,用于指明该接口类型声明是根据 Java 语言规范定义的函数式接口。函数式接口只能有一个抽象方法

```
//定义一个函数式接口
@FunctionalInterface
public interface WorkerInterface {

   public void doSomeWork();

}


public class WorkerInterfaceTest {

public static void execute(WorkerInterface worker) {
    worker.doSomeWork();
}

public static void main(String [] args) {

    //使用匿名类的写法
    execute(new WorkerInterface() {
        @Override
        public void doSomeWork() {
            System.out.println("Worker invoked using Anonymous class");
        }
    });

    //使用lambda表达式 
    execute( () -> System.out.println("Worker invoked using Lambda expression") );
}

}
```



### 常用API

#### Collection接口的

Collection接口提供了 stream()方法

我们执行的任何操作都不会对源集合造成影响，你可以同时在一个集合上提取出多个 stream 进行操作。

#### 静态方法

###### of

构造一个Stream对象

```
Stream<String> s1 = Stream.of("a", "b");
```

###### empty

创建一个空的 Stream 对象。

###### contact

连接两个 Stream ，不改变其中任何一个 Steam 对象，返回一个新的 Stream 对象。

```
Stream<String> s1 = Stream.of("a", "b");
Stream<String> s2 = Stream.of("c", "d");
Stream<String> s3 = Stream.concat(s1, s2);
```

###### generate

创建一个无限Stream，一般用于随机数生成

```
Stream<Double> s5 = Stream.generate(Math::random);
```

###### iterate

创建一个无限Stream。可以添加初始元素和生产规则

```
Stream<Integer> s4 = Stream.iterate(1, n -> n + 2);
```



#### 实例方法

##### 返回Stream的

###### peek

对其中每个元素进行处理，返回的是一个新的Stream

主要用于debug使用，打印下当前元素

###### map

一般用这个对每个元素进行处理。比如从一个类型，转换为另一个类型

```
List<String> stringList = integerStream.map(n -> "我是" + n).collect(Collectors.toList());
```

###### peek和map的区别

peek一般只用于debug，打印一下信息使用

peek的参数的Consumer接口,它是没有返回值的

```
@FunctionalInterface
public interface Consumer<T> {
    void accept(T t);
```

map的参数是Function接口,必须给返回值

```
@FunctionalInterface
public interface Function<T, R> {
    R apply(T t);
```

###### 还有一个疑问

```
integerStream.peek或者map(item ->
          System.out.println("=========")
);
```

这一句话的打印是不会执行的，没有后面的collect等终止就不会执行.

也就是说，流方法真正执行是在终止方法触发

###### mapToInt

将元素转换成int类型，后面一般跟sum,max，min,average

###### mapToLong

略

###### mapToDouble

略

###### limit

限制个数

###### distinct

去重功能。判断是根据元素的equals方法和hashCode方法。(两个都需要重写)

基本元素

```
Stream<Integer> integerStream = Stream.of(2, 5, 100, 5);
List<Integer> collect = integerStream.distinct().collect(Collectors.toList());
System.out.println(JSONUtil.toJsonStr(collect));
```

[2,5,100]

对象

```
@Getter
@Setter
class User {
    private String name;
    private int age;
}

@Test
public void distinct() {
    User a = new User();
    a.setName("yun");
    a.setAge(20);

    User b = new User();
    b.setName("yun");
    b.setAge(20);

    Stream<User> userStream = Stream.of(a, b);
    List<User> userList = userStream.distinct().collect(Collectors.toList());
    System.out.println(JSONUtil.parse(userList));


}
```

只写了getter/setter方法时

>  [{"name":"yun","age":20},{"name":"yun","age":20}]

加上@EqualsAndHashCode

> [{"name":"yun","age":20}]



###### sorted

排序,基本元素可以使用默认排序方法

```
Stream<String> strStream = Stream.of("ba", "bb", "aa", "ab");
strStream.sorted().forEach(item -> System.out.println(item));
```

> aa ab ba bb

也可自定义排序方法

自定义根据第二个字母排序

```
        Stream<String> strStream = Stream.of("ba", "bb", "aa", "ab");
        Comparator<String> comparator = (x, y) -> x.substring(1).compareTo(y.substring(1));
        strStream.sorted(comparator).forEach(item -> System.out.println(item));
```

> ba aa bb ab

###### filter

过滤

```
Stream<Integer> integerStream = Stream.of(2, 5, 100, 5);
integerStream.filter(item -> item > 10).forEach(item -> System.out.println(item));
```

> 100



##### 终止方法

###### max

获取Stream中的最大值

例子1

```
Stream<Integer> integerStream = Stream.of(2, 5, 100, 5);
Integer max = integerStream.max(Integer::compareTo).get();
```

例子2

```
BigDecimal maxMarketPrice = productsListByGoodsId.stream().max(Comparator.comparing(YcProducts::getMarketPrice)).get().getMarketPrice();
```

###### min

获取最小值

###### findFirst

获取第一个元素

```
Integer i = integerStream.findFirst().get();
```

###### findAny

随机获取一个元素。串行情况下，就是第一个。并行不一定，先获取谁就是谁。

###### count

返回流中元素个数

```
long count = integerStream.count();
```



###### collection

将最终的Stream汇总为collection,Collectors已经为我们提供了很多拿来即用的收集器。经常用到Collectors.toList()、Collectors.toSet()、Collectors.toMap()。

另外高级用法还有比如Collectors.groupingBy()用来分组

```
// 返回 userId:List<User>
Map<String,List<User>> map = user.stream().collect(Collectors.groupingBy(User::getUserId));

// 返回 userId:每组个数
Map<String,Long> map = user.stream().collect(Collectors.groupingBy(User::getUserId,Collectors.counting()));
```

###### toArray

collection是返回列表、map 等，toArray是返回数组

```
        Stream<Integer> integerStream = Stream.of(2, 5, 100, 5);
        // Object[] objects = integerStream.toArray();
        Integer[] toArray = integerStream.toArray(Integer[]::new);
```

如果无参,是返回Object数组.可以加参数Integer[]::new,可以返回Integer数组

###### forEach

也是对每一个元素进行处理

和map的区别是，forEach不会返回Stream，直接消费掉了

###### forEachOrdered

功能与 forEach是一样的，不同的是，forEachOrdered是有顺序保证的，也就是对 Stream 中元素按插入时的顺序进行消费。

在使用并行的时候，两者会有区别。

###### reduce

具体可以学习map/reduce计算模型.

```
Stream<Integer> integerStream = Stream.of(1,2,3);
        Integer sum = integerStream.reduce(100, (x, y) -> x + y);
        System.out.println(sum);
```

提供初始值100,然后开始累加

> 106

我们直接使用reduce较少,但是Collectors好多方法都用到了 reduce，比如 groupingBy、minBy、maxBy等等。

例子：BigDecimal的求和

```
BigDecimal add = list.stream().map(User::getHeight).reduce(BigDecimal.ZERO, BigDecimal::add);
```



#### 并行方法

创建并行Stream

```
Stream.of(1,2,3).parallel();
或
List<Integer> src = Arrays.asList(1, 2, 3);
Stream<Integer> integerStream = src.parallelStream();
```

并行 Stream和普通Stream支持的api基本一样

并行 Stream 默认使用 `ForkJoinPool`线程池，当然也支持自定义，不过一般情况下没有必要。ForkJoin 框架的分治策略与并行流处理正好契合。

虽然并行这个词听上去很厉害，但并不是所有情况使用并行流都是正确的，很多时候完全没这个必要。

比如

```
        Stream<Integer> integerStream = Stream.of(1,2,3).parallel();
        Integer sum = integerStream.reduce(100, (x, y) -> x + y);
        System.out.println(sum);
```

这个结果就变成306了



