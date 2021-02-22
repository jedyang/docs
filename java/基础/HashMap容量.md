## HashMap的初始容量与扩容问题

对于HashMap，有经验的开发人员都比较熟悉，也是日常工作和面试时常遇到的点。

但是有些细节你可能还不清楚。

### 默认初始容量

HashMap的有默认的大小，是16。从源码和代码都可以验证。

```java
@Test
public void testHashMap() throws Exception {
    HashMap<String, String> users = new HashMap();
    Class<? extends HashMap> mapClass = users.getClass();
    Method capacity = mapClass.getDeclaredMethod("capacity");
    capacity.setAccessible(true);
    System.out.println("capacity:" + capacity.invoke(users));
    System.out.println("size:" + users.size());
}
```

结果：

```
capacity:16
size:0
```

使用默认容量的问题就是，HashMap的自动扩容机制。

默认情况下，扩容系数是0.75。也就是size到13时，users的capacity会自动扩一倍到36

```
@Test
public void testHashMap2() throws Exception {
    HashMap<String, String> users = new HashMap();
    users.put("1", "1");
    users.put("2", "1");
    users.put("3", "1");
    users.put("4", "1");
    users.put("5", "1");
    users.put("6", "1");
    users.put("7", "1");
    users.put("8", "1");
    users.put("9", "1");
    users.put("10", "1");
    users.put("11", "1");
    users.put("12", "1");
    Class<? extends HashMap> mapClass = users.getClass();
    Method capacity = mapClass.getDeclaredMethod("capacity");
    capacity.setAccessible(true);
    System.out.println("capacity:" + capacity.invoke(users));
    System.out.println("size:" + users.size());
    users.put("13", "1");
    System.out.println("capacity:" + capacity.invoke(users));
    System.out.println("size:" + users.size());
}
```

结果：

```
capacity:16
size:12
capacity:32
size:13
```

在扩容时，会进行rehash，这是一个比较耗时的操作。所以要求初始化HashMap时必须指定初始化容量值。

### 设置初始化容量

这里，我就要问一个问题了

如果HashMap<String, String> users = new HashMap(10)，那么users的容量是多少？

```
@Test
public void testHashMap() throws Exception {
    HashMap<String, String> users = new HashMap(10);
    Class<? extends HashMap> mapClass = users.getClass();
    Method capacity = mapClass.getDeclaredMethod("capacity");
    capacity.setAccessible(true);
    System.out.println("capacity:" + capacity.invoke(users));
    System.out.println("size:" + users.size());
}
```

答案是

```
capacity:16
size:0
```

为什么是16，而不是10

原因是，HashMap会根据用户的传值，选择大于这个值的第一个2的幂作为容量。保证容量是2的幂进行哈希寻址最高效。

如果让你来找大于一个Int值的最近的2的幂的数，你会怎么做？

2的幂是什么特征，那就是只有一个位是1，其余全是0。

如果我们能将一个数，从它的最高位开始全部置为1，然后再加1，就可以得到这个2的幂。

看一下HashMap的实现

```
/**
 * Returns a power of two size for the given target capacity.
 */
static final int tableSizeFor(int cap) {
    int n = cap - 1;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
}
```

他是用了对这个数进行无符号右移，然后进行或运算。

经过5次之后，一定会把从第一位不是0的位开始后面所有的位全部置为1。

再进行加1操作，就可以得到一个2的幂

精妙又高效。

### 初始化容量应该设置为多大

如前所述，我们已经知道HashMap会根据传值自动设置为大于该值的2的幂。但是这个规则比较死板。并不是很合理。

比如说，你现在需要一个容量为7的map，你确定只会有7个。

根据默认的规则，HashMap会创建一个容量为8的Map。那么可以知道这个Map的扩展值是6。所以当放进第7个元素时，map会自动扩展到16.这其实并不是我们希望的。

我们设置初始容量值的目的就是避免自动扩展。

所以设置多大合适呢？有一个公式是

```
return (int) ((float) expectedSize / 0.75F + 1.0F);
```

就是除以扩展因子，然后+1。

比如这里  7/0.75 + 1 = 10。这样会创建一个容量为16的map。放进第7个元素时，不会再扩展。

这其实就是用内存空间换效率。

这个公式其实是在guava中的newHashMapWithExpectedSize方法。