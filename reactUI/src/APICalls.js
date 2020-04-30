const NODE_API_HOSTNAME =  window.location.hostname === "localhost:3000" ? "http://localhost:8080" : "https://dsp.grepawk.com";

var API={
}


API.api_post_json=function(uri, data){
    return new Promise((resolve,reject)=>{
      var url = NODE_API_HOSTNAME+"/api"+uri;
      fetch(url,{
        method:"POST",
        headers:{
          'Content-Type':"application/json"
        },
        cache:"no-cache",
        body: JSON.stringify(data)
      }).then(resp=>resp.json()).then(resolve).catch(reject);
    })
  }
  
API.api_get_json=function(uri){
    return new Promise((resolve,reject)=>{
      var url = NODE_API_HOSTNAME+"/api"+uri;
      fetch(url,{
        method:"GET"      
     }).then(resp=>resp.json()).then(resolve).catch(reject);
    })
  }

API.generateUUID = function () { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
API.getUUID = function(){
    var uuid = localStorage.getItem("uuid") 
    if(uuid && uuid!=='undefined') return uuid;
    uuid = API.generateUUID();
    localStorage.setItem("uuid",uuid);
}
 export default API;