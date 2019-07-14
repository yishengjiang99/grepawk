const WebSocket = require('ws')
const port = process.env.port || 8081
const wss = new WebSocket.Server({ port: port })
const { exec, spawn,execSync } = require('child_process');

console.log("listening on "+port)

var User = {
  getInfo : function(uuid){
    return {xp:1}
  }
}
var users  = {};
wss.on('connection', (ws,request) => {
  ws.on('message', message => {
    try{
      message = message.trim();
      var t = message.split(" ");
      if(t ==="") return;
    
      const cmd = t[0];
      const args =t.length>1 ? t.splice(1) : [];
  
      switch(cmd){
        case 'check-in':
          const uuid  = args[0];
         
          users[uuid] = {
            ws: ws,
            info: User.getInfo(uuid)
          }
          console.log(users); 
          break;
        case 'ls':
          exec(message, (err, stdout, stderr)=>{
              if(err) ws.send("error: "+err.message);
              else ws.send(stdout);
          });
          break;
        default:
          ws.send(message);
          break;
      }
    }catch(err){
      console.log(err);
      ws.send(err.message);
    }
  })
  ws.send('hi!')
})

