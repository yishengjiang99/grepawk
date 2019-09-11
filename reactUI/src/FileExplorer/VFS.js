import api_fs from "./APIFileSystem";
import chrome_fs from "./ChromeFileSystem";

var Vfs = function(type){
  if(type=='chrome') return chrome_fs();
  else if(type=='azure') return api_fs("azure");
  else if(type=='market') return api_fs("market");
  else if(type=='feed')   return api_fs("feed");
  else if(type=='live')   return api_fs("live");
  else if(type=='admin')   return api_fs("admin");
}
const NODE_API_HOSTNAME =  window.location.hostname === "localhost" ? "http://localhost" : "https://grepawk.com";

Vfs.api_post_json=function(uri, data){
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

export default Vfs;


// var v = Vfs();
// v.get_files("/chrome");
