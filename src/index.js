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
    f:[1,2,3]
}
observe(obj)
btn.onclick = function(){
    obj.f.push(4,{g:5})
    console.log(obj.f[4].g);
}