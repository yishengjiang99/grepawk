const xfs = require("./lib/xfs.js");
const mime = require('mime-types')
const WebSocket = require('ws')
const url = require('url');


const port = process.env.fs_port || 8085;

const wss = new WebSocket.Server({
    port: port
})

wss.on('connection', (ws, request) => {
  var exitCode = 1;
  const xpath = url.parse(request.url).pathname;
  console.log("connection on readstream \nxpath= "+xpath);

  const parts = xpath.split("/");

  if(parts.length<3){
    exitCode=-1;
    ws.close();
  }
  const schema = parts[1];
  const filePath = parts.splice(2); 
  // ws.send(JSON.stringify([schema,filePath]));
  // ws.send("EOF");
  // ws.close();
  console.log(schema);

  if(schema==='azure'){
    const containerName = filePath[0];
    const blobName = filePath[1];

    const fh = xfs.blobClient.createReadStream(containerName,blobName);
       
    ws.send(("Content-Type: "+mime.lookup(blobName)).toString("UTF-8"));
    fh.on("data",data=>ws.send(data));
    fh.on("end", ()=>{
      console.log("closing ws after loaeding "+xpath);
      ws.close()
    });
  }  

  ws.on("close",()=>{console.log("closed on code "+exitCode)})
});
