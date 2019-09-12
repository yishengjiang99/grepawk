import api_fs from "./APIFileSystem";
import chrome_fs from "./ChromeFileSystem";
const NODE_API_HOSTNAME =  window.location.hostname === "localhost" ? "http://localhost" : "https://grepawk.com";
const GREPAWK_STDIN =  window.location.hostname === "localhost" ? "WS://localhost:8086" : "https://grepawk.com/stdin";

var Vfs = function(type){
  if(type=='chrome')      return chrome_fs();
  else if(type=='azure')  return api_fs("azure");
  else if(type=='market') return api_fs("market");
}

Vfs.upload_file_market= async function(file){
  return new Promise((resolve,reject)=>{
    let socket = new WebSocket(GREPAWK_STDIN);
    socket.onopen=(e)=>{
      socket.send("#pathname: azure/market/"+file.name);
      socket.send("#size: "+file.size);
      socket.send("#contentType "+file.type);
      var reader = new FileReader();
      reader.onloadend=(e)=>{
        socket.send(this.result);
        socket.send("EOF");
      }
      reader.readAsArrayBuffer(file);
      socket.onmessage=(e)=>{
        var msg = e.data;
        if(msg.toString().startsWith("URL: ")){
          socket.close();
          resolve(msg.replace("URL: ",""));
        }
        else if(msg.toString().startsWith("ERROR: ")){
          socket.close();
          reject(new Error(msg.replace("ERROR: ","")));
        }
      }
    }
  
  })
};


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
