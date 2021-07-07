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