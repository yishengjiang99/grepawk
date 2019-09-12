const xfs = require("./lib/xfs.js");
const mime = require('mime-types')
const WebSocket = require('ws')
const url = require('url');


const port = process.env.fs_port || 8086;

const wss = new WebSocket.Server({
    port: port
})

wss.on('connection', (ws, request) => {
  var exitCode = 1;
  var path=null;
  var size= null;
  var fh = null;
  var contentType = "";
  var containerName, blobName;
  ws.on("message", (message)=>{
    if(message.startsWith("#pathname: ")) {
      path = message.replace("#pathname: ","").trim();
      console.log("upload "+path);
    }else if(message.startsWith("#size: ")){
      size =parseInt(message.replace("#size: ").trim());
      console.log("upload size ",size);
    }else if(message.startsWith("#contentType: ")){
      contentType = message.replace("#contentType: ").trim();
    }else if(path !==null && fh===null){
      path = path.split("/");
      containerName = path[1];
      blobName = path[2];
      console.log(containerName, blobName);
      fh = xfs.blobClient.createWriteStreamToBlockBlob(containerName,blobName,{
        contentSettings:{
          contentType: contentType || mime.lookup(path)
        }
      });
      fh.on("error", console.log);
      fh.on("finish", console.log)
    }else if(message.trim()==="EOF"){
      fh.end();
      ws.send("URL: "+xfs.blobClient.getUrl(containerName, blobName));
      ws.close();
    }else if(fh!==null){
      console.log("writing ", message);
      fh.write(message);
    }
  });
  ws.on("close",()=>{console.log("closed on code "+exitCode)})
});
