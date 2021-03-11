## 高性能无锁队列MpscQueue

Netty源码中大量使用MpscQueue，这是一个无锁队列，可实现多线程下高性能。Netty为什么不使用java原生队列？MpscQueue的原理是怎样的?



### Java原生队列

Java原生队列按照实现方式，可分为阻塞队列和非阻塞队列两种。阻塞队列是基于锁实现的，非阻塞对立是基于CAS操作实现的。



![Java并发队列](高性能无锁队列MpscQueue.assets/Java并发队列.jpg)