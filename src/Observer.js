import addProperties from './addProperties';
import defineReactive from './defineReactive';
import {
    arrayMethods
} from './arrayMethods';
import { Dep } from './Dep';
import observe from './observe';

export class Observer {
    constructor(value) {
        // 最后在Observer中添加一个dep属性，值为Dep类的实例
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