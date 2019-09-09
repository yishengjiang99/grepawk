var Vfs = function(type){
  if(type=='chrome') return chrome_fs();
  else if(type=='public') return api_fs("azure");
  else if(type=='market') return api_fs("market");
  else if(type=='feed')   return api_fs("feed");
  else if(type=='live')   return api_fs("live");
  else if(type=='admin')   return api_fs("admin");}


const IMG_EXTS    = /\.(gif|jpg|jpeg|tiff|png)$/i;
const VIDEO_EXTS  = /\.(mov|mp4|m4a|ogg)$/i;

var chrome_fs = function(){
  window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
  window.directoryEntry = window.directoryEntry || window.webkitDirectoryEntry;
  var localFS;
  function g_init_local_fs(){
    return new Promise((resolve,reject)=>{
      window.requestFileSystem(window.PERSISTENT, 5*1024*1024, function(_localFS){
        localFS= _localFS.root;
        resolve(localFS);
      })
    })
  }

  function g_file_get_content(path){
    return new Promise(async (resolve,reject)=>{
      if(!localFS) localFS = await g_init_local_fs();
      localFS.getFile(path, {create:false,exclusive:false}, function(entry){
        entry.file(function(file){
          var _file=file;
          var reader = new FileReader();
          var readType = 'text';
          reader.onloadend=function(e){
            resolve({type:readType, payload:this.result,file:_file});
          }
          reader.onerror=function(e){
            reject(new Error("reader failed"));
          }
          if(IMG_EXTS.test(file.name)){
            readType='image';
            reader.readAsDataURL(file);
          }else{
            reader.readAsText(file);
          }
        })
      }, function(e){
        reject(e);
      })
    });
  }

  function g_file_put_contents(path,content,append=true){
    return new Promise(async (resolve,reject)=>{
      if(!localFS) localFS = await g_init_local_fs();
      localFS.getFile(path, {create: true, exclusive: true}, (fileEntry)=>{
        if(content){
          fileEntry.createWriter(function(writer){
            if(append){
              writer.seek(writer.length);
            }
            var blob = new Blob([content], {type: 'text/plain'});
            writer.write(blob);
            resolve(fileEntry);
          })
        }else{
          resolve(fileEntry);
        }
      }, reject);
    })
  }  

  function getDirEntriesSync(path){
    return new Promise(async (resolve,reject)=>{
      let fsroot = await g_init_local_fs();
      fsroot.getDirectory(path, {create:false}, function(directory){
        directory.createReader().readEntries(function(entries){
          resolve(entries);
        });
      },reject);
    });
  }
  function g_list_local_files(path){    
    return new Promise(async (resolve, reject)=>{
      let root_node = {
        name: path,
        fullPath:'',
        id: 0
      }
      let queue = [];
      let nodes = [];
      let edges = [];
      queue.push(root_node);
      nodes.push(root_node);
      edges[0]=[];
      let parent;
      while(queue.length>0){
        parent = queue.pop();
        parent.id = parent.id || 0;
        let entries = await getDirEntriesSync(parent.name);
        entries.forEach(async (entry)=>{
          entry.id = nodes.length;
          nodes.push(entry);
          edges[parent.id] = edges[parent.id] || [];
          edges[parent.id].push(entry.id);
          if(entry.isDirectory){
            queue.push(entry);
          }
        })
      }
      resolve([nodes, edges]);
    });
  }

  function handleError(e){
    alert(e.message);
  }

  function g_upload_file_sync(fsroot, file){
    return new Promise((resolve,reject)=>{
      fsroot.getFile(file.fullPath,{create:true, exclusive:false},
        (fentry)=>{
        fentry.createWriter(function(writer){
          writer.write(file);
          resolve();
        }, handleError)
      },handleError);
    })
  }
  function g_upload_files(files){
    return new Promise(async (resolve, reject)=>{
      let fsroot = await g_init_local_fs();
      for(let i = 0; i<files.length; i++){
        await  g_upload_file_sync(fsroot, files[i]);
      }
      resolve();
    });
  }
  return{
    get_files: async function(path){
      try{
        var ret= await g_list_local_files(path);
        return ret;
      }catch(err){  
        alert(err.message);
        return null;
      }
    },
    file_get_meta: function(fullPath, stdout){
      try{
         g_init_local_fs().then((fsroot)=>{
           fsroot.getFile(fullPath, {}, function(fileEntry){
             fileEntry.getMetadata((meta)=>{
                stdout({
                  size: meta.size || 0,
                  modificationTime: (meta.modificationTime && meta.modificationTime.toLocaleString().substring(0,14))|| ""
                });
             },function(err){
              stdout("error: "+ err.message);
            })
           })
         })
      }catch(err){  
       // alert(err.message);
        stdout("error "+err.message);
      }
    },
    file_put_content: async function(filename, content){
      try{
        return await g_file_put_contents(filename, content,true);
      }catch(err){  
        alert(err.message);
      }
    },
    upload_files: async function(files){
      try{
        await g_upload_files(files);
      }catch(e){
        throw e;
      }
    },
    file_get_content: async function(path){
      try{
        var content = await g_file_get_content(path);
        return content;
      }catch(e){
        throw e;
      }
    }
  }
}


var api_fs = function(mntType){
  var mntType = mntType || "azure";

  const NODE_API_HOSTNAME =  window.location.hostname === "localhost" ? "http://localhost" : "https://grepawk.com";
  
  const API_LIST_NAME = NODE_API_HOSTNAME+"/api/files/"+mntType;

  var sync_api_get_json = function(url){
    return new Promise((resolve,reject)=>{
      alert(url);
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
        alert(err.message);
        reject(err);
      });
    })
  }
  return {
    get_files: async function(path){
      let url = API_LIST_NAME+"/list";
      var ret= await sync_api_get_json(url);
      return ret;
    },
    file_get_meta: function(fullPath, stdout){
      stdout(null);
    },
    file_get_content: async function(path){

    },
    file_put_content: async function(path, content){
      await Vfs.api_post_json("/files/azure?path="+path, {content:content});
    },
    upload_files: async function(files){
      var formData = new FormData();
      formData.append("files", files);
      let url = NODE_API_HOSTNAME+"/file/azure/upload";
      return await sync_api_post_json(url,formData);
    }
  }
}

Vfs.api_post_json=function(uri, data){
  return new Promise((resolve,reject)=>{
    var url = "http://localhost/api"+uri;
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
