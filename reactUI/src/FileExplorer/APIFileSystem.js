import { EROFS } from "constants";

const NODE_API_HOSTNAME =  window.location.hostname === "localhost" ? "http://localhost" : "https://grepawk.com";
const NODE_STDOUT =  window.location.hostname === "localhost" ? "ws://localhost:8085" : "wss://grepawk.com/stdout";

var api_fs = function(mntType){
  var fileMap = {};
  var mntType = mntType || "azure";  
  const API_LIST_NAME = NODE_API_HOSTNAME+"/api/files/"+mntType;

  var sync_api_get_json = function(url){
    return new Promise((resolve,reject)=>{
      fetch(url)
      .then(resp=>resp.json())
      .then(resolve)
      .catch(err=>{
        alert(err.message);
        reject(err);
      });
    })
  }
  var sync_api_post_json = function(url,body){
    return new Promise((resolve,reject)=>{
      fetch(url,{
        method: "POST",
        body: body
      })
      .then(resp=>resp.json())
      .then(resolve)
      .catch(err=>{
        reject(err);
      });
    })
  }
  return {
    file_get_stream: async function(path){
      return new Promise((resolve,reject)=>{
        var ws = new WebSocket(NODE_STDOUT+"/"+path);
        ws.onopen=(e)=>{
          resolve(ws);
        }
        ws.onerror=reject;
      })
    },
    get_files: async function(path){
      let url = API_LIST_NAME+"/list";
      let fileList= await sync_api_get_json(url);
      fileList[0].forEach(node=>{
          fileMap[node.fullPath] = node;
      })
      return fileList;
    },
    file_get_meta: function(fullPath, stdout){
        if(fileMap[fullPath]){
            stdout({
                size: fileMap[fullPath].size || 0,
                type: fileMap[fullPath].type || "file",
                modificationTime: fileMap[fullPath].updated_at && new Date(fileMap[fullPath].updated_at) || null
            })
        }else{
            stdout(null);
            throw new Error("File not registered");
        }
    },
    file_get_content: function(path){
      let url = API_LIST_NAME+"?path="+path;
      return new Promise((resolve,reject)=>{
        fetch(url)
        .then((response)=>{
          resolve({
            type: "text",
            payload:response.body()
          });
        })
        .catch(reject);
      })
    },
    upload_files: async function(files, basePath, onMessage){
        for(let i =0; i<files.length;i++){
            const _file = files[0];
            let url = API_LIST_NAME+"/upload?basepath="+basePath;
            fetch(url,{
                body: _file,
                method:"POST",
                headers:{
                    contentType:_file.type,
                    'x-file-name': _file.name,
                    'x-file-size': _file.size
                }        
            }).then(async function readResponse(response){
                let update= await response.text();
                console.log(update);
                if(onMessage) onMessage(update);
            }).catch((e)=>{
                alert(e.message);
            });
        }
    }
  }
}

export default api_fs;