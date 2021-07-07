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