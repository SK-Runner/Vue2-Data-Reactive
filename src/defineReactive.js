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