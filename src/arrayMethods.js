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