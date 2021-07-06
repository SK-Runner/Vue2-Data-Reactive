// 给data对象添加一个__ob__属性，这个属性的值为实例本身，该属性不可枚举
export default function(data,key,value,enumerable){
    Object.defineProperty(data,key,{
        enumerable,
        configurable:true,
        value,
        writable:true
    })
}