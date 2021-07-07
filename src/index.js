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