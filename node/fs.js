const net = require('net');
const path = require('path');
const dirname = path.resolve(__dirname);
const base_path = path.dirname(dirname);
const map_path = base_path+"/map/";
const fs = require("fs");
var world = {};

async function load_dir(path){
  new Promise((resolve,reject)=>{
    fs.readdir(path,(err,files)=>{
      if(err) reject(err);
      else    resolve(files);
    })
  }).then((files)=>{
    console.log(files)
  }).catch((err)=>{
    console.error(err)
  })

}
async function init_fs(){
  var zones = load_dir(map_path);
  console.log(zones);
}


init_fs().catch(console.error)

const server = net.createServer((socket) => {
  socket.write("Hello to file server!\n");
  socket.setEncoding("utf-8");

  var remote_address=socket.address().host;
  console.log("connection from "+remote_address);
  userProfiles[remote_address]={
    'profile':"aa"
  };

  socket.on("data",function(data){
    data = data.trim();
    if(!data) return;
    if(data.charAt(0)=='#') return; 
    if(data==="ls"){
      var file_list =ls();
      var fileout=ls_output(file_list);
      socket.write(fileout);

    }


    //stream.on("data",(chunk)=>socket.write(chunk.toString('ascii')));
   // stream.pipe(socket);
   // data.pipe(fs);
  });
}).on('error', (err) => {
  throw err;
});

// grab an arbitrary unused port.
server.listen(4000);

//