import observe from "./observe";
import {Dep} from "./Dep";

export default function(data, key, value){
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
            // 如果该数据在访问时处于依赖收集阶段（数据被Watch观察，产生了一个Watch实例），那么就收集该实例
            if(Dep.target){
                dep.depend();
                // 也要考虑子节点
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

            // 数据变化，通知更新
            dep.notify();
        }
    })
}