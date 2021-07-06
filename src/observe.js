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