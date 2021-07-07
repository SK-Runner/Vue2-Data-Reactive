# Vue的数据响应式原理

## 一、数据的监听

### 1、神奇的Object.defineProperty方法

​    思考问题：在Vue中为什么仅仅修改数据的值，界面就会随之变化？如果是普通JS我们应该如何实现？

​        最普通的做法：获取DOM，在点击事件中使用innerText等操作DOM。

```html
    <button id="btn">点击后试图改变</button>
    <div id="container">hello</div>
```

```javascript
let container = document.getElementById('container');
let btn = document.getElementById('btn');

let obj = {
    text = ''
};

btn.onclick = function(){
    obj.text = ' world!';
    container.innerText += obj.text;
}
```

​        ES6带给我们一个新的做法：Object.defineProperty(对象，“对象的属性名”，{ 构造器属性 } )

```javascript
let container = document.getElementById('container');
let btn = document.getElementById('btn');

let obj = {
    text:''
}

btn.onclick = function(){
    // 我们仅仅修改obj的text属性的值，他就会改变试图
    obj.text = ' world!'
    console.log(obj.text) //空字符串，为什么值没有修改？因为set方法需要把新值没有替换旧值，需要变量周转。
}

Object.defineProperty(obj,'text',{
    get(){
        console.log('你正在访问obj的text属性');
        return value;
    },
    set(value){
        console.log("你正在试图修改obj的text属性的值为："+value);
        container.innerText += value;
    }
})
```

### 2、封装Object.defineProperty

​    存在的问题：get和set方法需要变量进行周转，如何将Object.defineProperty封装，提高复用性？

​    答案：封装一个defineReactive( data , key , value )

```javascript
export default function(data, key, value){
    if(arguments.length==2){
        value = data[key]
    }
    Object.defineProperty(data,key,{
        // 属性可枚举
        enumerable:true,
        // 属性可被删除
        configurable:true,
        get(){
            console.log("你正在尝试访问"+key+"属性的值："+value);
            return value;
        },
        set(newValue){
            console.log("你正在试图修改"+key+"属性的值为："+newValue);
            if(value === newValue) return;
            value = newValue;
        }
    })
}
```

### 3、如何侦测对象的全部属性？

​    问题：我们只是调用了一次defineReactive方法，监测了一个属性，如何检测obj的全部属性？

​	此时需要使用递归来为对象所有属性添加侦测，以下时程序流程图。

​    ![递归实现数据监测](D:\VScodeProject\vue源码分析\Vue2-Data-Reactive\pic\递归实现数据监测.jpg)

​    

```javascript
文件：index.js
import observe from './observe'

let btn = document.getElementById('btn');
let obj = {
    a:{
        b:{
            c:1
        }
    },
    d:{
        e:2
    },
    f:3
}
observe(obj)
btn.onclick = function(){
    obj.a.b.c = '2'
}
```

```javascript
文件：observe.js
import {Observer} from './Observer'
export default function(value){
    if(typeof value !== 'object') return;
    
    let ob;
    if(typeof value.__ob__ !== "undefined"){
        ob = value.__ob__;
    }else{
        ob = new Observer(value);
        //console.log(value.__ob__ == ob); //true
    }

    return ob;
}
```

```javascript
文件：Observer.js
import addProperties from './addProperties'
import defineReactive from './defineReactive';
export class Observer{
    constructor(value){
        // 为对象添加一个__ob__的属性，值为实例本身
        // 此处this指向Observer的实例本身
        addProperties(value,'__ob__',this,false);

        // 遍历，为对象的每一项添加监测
        this.walk(value);
    }
    walk(value){
        for(let k in value){
            defineReactive(value,k)
        }
    }
}
```

```javascript
文件：addProperties.js
export default function(data,key,value,enumerable){
    Object.defineProperty(data,key,{
        enumerable,
        configurable:true,
        value,
        writable:true
    })
}
```

```javascript
文件：defineReactive.js
import observe from "./observe";

export default function(data, key, value){
    if(arguments.length==2){
        value = data[key]
    }

    // 对子元素也要observe，至此多个类之间形成了递归
    observe(value);

    Object.defineProperty(data,key,{
        // 属性可枚举
        enumerable:true,
        // 属性可被删除
        configurable:true,
        get(){
            console.log("你正在尝试访问"+key+"属性的值："+value);
            return value;
        },
        set(newValue){
            console.log("你正在试图修改"+key+"属性的值为："+newValue);
            if(value === newValue) return;
            // 如果设置新的值，新值也需要被observe一下
            observe(newValue)
            value = newValue;
        }
    })
}
```

### 4、数组属性的监测

原理图：改变数组的原型对象，并且在新对象中添加7中数组方法。调用对象某一方法时，顺着原型链找到arrayMethods后就不再继续往下找了。

![侦测数组响应式的原理](D:\VScodeProject\vue源码分析\Vue2-Data-Reactive\pic\侦测数组响应式的原理.png)

数组属性响应式侦测流程图（结合整体，只有红色部分是）：

![数组的响应式监测](D:\VScodeProject\vue源码分析\Vue2-Data-Reactive\pic\数组的响应式监测.jpg)

```javascript
文件：index.js
let obj = {
    a:{
        b:{
            c:1
        }
    },
    d:{
        e:2
    },
    f:[1,2,3]
}
observe(obj)
btn.onclick = function(){
    obj.f.push(4,{g:5})
    console.log(obj.f[4].g);
}
```

```javascript
文件：Observer.js————>构造函数中添加了新的条件按判断，如果对象是数组。。。。。。
import addProperties from './addProperties';
import defineReactive from './defineReactive';
import {
    arrayMethods
} from './arrayMethods';
import observe from './observe';

export class Observer {
    constructor(value) {
        // 为对象添加一个__ob__的属性，值为实例本身
        // 此处this指向Observer的实例本身
        addProperties(value, '__ob__', this, false);

        // 如果当前对象是一个数组
        if (Array.isArray(value)) {
            // 那么需要改变该数组的原型对象
            Object.setPrototypeOf(value, arrayMethods);
            // 并且为数组的每一项添加监测
            this.arrayWalk(value);
        }
        // 如果不是数组，遍历该对象的每一项并且添加监测
        else {
            this.walk(value);
        }

    }
    walk(value) {
        for (let k in value) {
            defineReactive(value, k)
        }
    }
    arrayWalk(arr) {
        for (let i = 0, j = arr.length; i < j; i++) {
            observe(arr[i])
        }
    }
}
```

```javascript
文件：arrayMethods.js -------->改变array的原型对象为新对象arrayMethods
import addProperties from './addProperties';

// 获取到数组原来的原型对象
const origin = Array.prototype
// 以Array.prototype为原型创建arrayMethods对象，并暴露
export const arrayMethods = Object.create(origin)

// 列出需要重写的数组方法
const methods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
]

// 使用addProperties为arrayMethods原型对象添加方法
methods.forEach(methodName => {

    // 对于数组每一个原型对象中的方法，原本功能不能减少，所以备份原来相应功能
    let originMethod = origin[methodName]

    addProperties(arrayMethods,methodName,function(){
        console.log('您正在调用'+methodName+'方法');
        // 使用apply调用原来的功能
        let originResult = originMethod.apply(this,arguments)

        // 获取插入的新项
        let inserted = []
        switch(methodName){
            case 'push':
            case 'unshift':
                inserted = arguments;
                break;
            case 'splice':
                /**
                 * 不能写arguments.slice(2)，因为arguments对象是一个类数组对象(除此之外还有DOM方法返回的结果)
                 * 类数组对象使用数组方法：Array.prototype.（可变为其他方法slice）.apply(arguments,[2])
                 */
                inserted = Array.prototype.slice.apply(arguments,[2]);
                break;
        }
        if(inserted.length!=0){
            // 将新插入的项也添加监测（push、unshift、splice）
            this.__ob__.arrayWalk(inserted)
        }

        return originResult;
    })
})
```



## 二、依赖收集以及Vue中Watch的实现机理

### 1、依赖收集

​	在Vue中，数据的响应式侦测使用了**发布者-订阅者模式**，即发布者收集依赖并在需要时通知订阅者进行数据的更新操作，依赖在我看来就是组件中或其他地方使用的数据。不过这个数据和数据本身并不相同，它拥有自己独特的功能和作用，也就是后文提及的watcher。

​	依赖收集的原则：在get中收集依赖、在set中触发依赖。（具体看下图）

### 2、watch的实现机理

​	原理图：![发布订阅模式](D:\VScodeProject\vue源码分析\Vue2-Data-Reactive\pic\发布订阅模式.png)

​	

​		实现的小功能：监测数据对象xiaoming属性的变化，并且使用watch类对其某一属性进行实例，当被监测的属性值变化时，通知watch调用回调函数（模拟更新组件），具体实现流程：点击按钮，小明的年龄增长一岁，朋友数组中增加一个X朋友，回调函数输出相应语句。源码如下：

```javascript
文件：index.js
import observe from './observe'
import {Watch} from './Watch'

let btn = document.getElementById('btn');
let ming = {
    prop:{
        name:'小明',
        age:18
    },
    friends:['Tom','Jack']
}
observe(ming)
new Watch(ming,'prop.age',(val)=>{
    console.log('今天是小明'+val+"的生日，祝福小明");

})
new Watch(ming,'friends',(val)=>{
    console.log('小明的朋友有：',val);
})
btn.onclick = function(){
    ming.prop.age++;
    ming.friends.push('X')
}
```

```javascript
文件：Observer.js ------->仅仅在构造函数内添加dep属性
export class Observer {
constructor(value) {
        // ★★★最后在Observer中添加一个dep属性，值为Dep类的实例★★★
        this.dep = new Dep()

        // 为对象添加一个__ob__的属性，值为实例本身
        // 此处this指向Observer的实例本身
        addProperties(value, '__ob__', this, false);

        // 如果当前对象是一个数组
        if (Array.isArray(value)) {
            // 那么需要改变该数组的原型对象
            Object.setPrototypeOf(value, arrayMethods);
            // 并且为数组的每一项添加监测
            this.arrayWalk(value);
        }
        // 如果不是数组，遍历该对象的每一项并且添加监测
        else {
            this.walk(value);
        }
    }
}
```

```javascript
文件：defineReactive.js ---->注意五角星★位置

import observe from "./observe";
import {Dep} from "./Dep";

export default function(data, key, value){
    //★★★
    const dep = new Dep()

    if(arguments.length==2){
        value = data[key]
    }

    // 对子元素也要observe，至此多个类之间形成了递归
    let childOb = observe(value);

    Object.defineProperty(data,key,{
        // 属性可枚举
        enumerable:true,
        // 属性可被删除
        configurable:true,
        get(){
            console.log("你正在尝试访问"+key+"属性的值："+value);
            // ★★★如果该数据在访问时处于依赖收集阶段（数据被Watch观察，产生了一个Watch实例），那么就收集该实例★★★
            if(Dep.target){
                dep.depend();
                // ★★★也要考虑子节点★★★
                if(childOb){
                    childOb.dep.depend();
                }
            }

            return value;
        },
        set(newValue){
            console.log("你正在试图修改"+key+"属性的值为："+newValue);

            if(value === newValue) return;
            // 如果设置新的值，新值也需要被observe一下
            observe(newValue)
            value = newValue;

            // ★★★数据变化，通知更新★★★
            dep.notify();
        }
    })
}
```

```javascript
文件：arrayMethods.js  --------> 注意五角星★位置
import addProperties from './addProperties';

// 获取到数组原来的原型对象
const origin = Array.prototype
// 以Array.prototype为原型创建arrayMethods对象，并暴露
export const arrayMethods = Object.create(origin)

// 列出需要重写的数组方法
const methods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
]

// 使用addProperties为arrayMethods原型对象添加方法
methods.forEach(methodName => {

    // 对于数组每一个原型对象中的方法，原本功能不能减少，所以备份原来相应功能
    let originMethod = origin[methodName]

    addProperties(arrayMethods,methodName,function(){
        console.log('您正在调用'+methodName+'方法');
        // 使用apply调用原来的功能
        let originResult = originMethod.apply(this,arguments)

        // 获取插入的新项
        let inserted = []
        switch(methodName){
            case 'push':
            case 'unshift':
                inserted = arguments;
                break;
            case 'splice':
                /**
                 * 不能写arguments.slice(2)，因为arguments对象是一个类数组对象(除此之外还有DOM方法返回的结果)
                 * 类数组对象使用数组方法：Array.prototype.（可变为其他方法slice）.apply(arguments,[2])
                 */
                inserted = Array.prototype.slice.apply(arguments,[2]);
                break;
        }
        if(inserted.length!=0){
            // 将新插入的项也添加监测（push、unshift、splice）
            this.__ob__.arrayWalk(inserted)
        }

        // ★★★对于数组属性使用数据的方法，在最后也需要通知更新★★★
        this.__ob__.dep.notify();

        return originResult;
    })
})
```

​	**最重要的Dep类和Watch类：**

```javascript
文件：Dep.js
export class Dep{
    constructor(){
        console.log('我是依赖构造器');

        // 1、用数组存储自己的订阅者，sub = subscribes（订阅）
        // 这个数组里放的是Watcher的实例
        this.subs = [];

        // 5、让每个实例都有个ID
        this.id = id++;
    }
    // 4、添加订阅
    addSub(sub){
        this.subs.push(sub)
    }
    // 通知更新
    notify(){
        console.log("我是notify");
        // 2、浅克隆一份订阅者
        const subs = this.subs.slice();
        // 3、让每个订阅者更新状态
        for(let i=0,l=subs.length;i<l;i++){
            subs[i].update();
        }
    }
    // 6、添加依赖
    depend(){
        // Dep.targe一个全局唯一的位置
        if(Dep.target){
            this.addSub(Dep.target)
        }
    }
};
```

```javascript
文件：Watch.js
import { Dep } from "./Dep";

var uid = 0;
export class Watch{
    constructor(target,expression,callback){
        console.log('我是Watch构造器');
        this.id = id++;
        this.target = target;
        // 获取target对象的expression表达式值的方法
        this.getter = parsePath(expression);
        // 回调函数
        this.callback = callback;
        // 获取的表达式值
        this.value = this.get();
    }
    update(){
        this.getAndInvoke(this.callback)
    }

    // 进入依赖收集阶段,将全局的依赖设置为依赖本身（watcher）
    get(){
        Dep.target =  this;

        const obj = this.target;

        let value;
        // 只要能找就一直找
        try{
            value = this.getter(obj);
        }finally{
            // 表示依赖收集结束
            Dep.target = null;
        }
        
        return value;
    }

    // 得到依赖
    getAndInvoke(cb){
        const value = this.get()
        if(value !== this.value || typeof value=='object'){
            const oldValue = this.value;
            this.value = value;
            cb.call(this.target,value);
        }
    }
}

// 将例如“a.b.c.d”的表达式拆分
function parsePath(str){
    let segments = str.split('.')

    return (obj)=>{
        for(let i=0 ; i<segments.length ; i++){
            if(!obj) return;
            obj = obj[segments[i]]
        }
        return obj
    };
}
```

