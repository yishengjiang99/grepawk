const WebSocket = require('ws')
const port = process.env.port || 8081
const wss = new WebSocket.Server({ port: port })
const { exec, spawn } = require('child_process');

console.log("listening on "+port)

wss.on('connection', ws => {
  ws.on('message', message => {
    try{
      message = message.trim();
      var cmd = spawn(message);

      cmd.unref();
      cmd.stdout.on('data',(data)=>{
        console.log(data.toString('utf8'));
        ws.send(data.toString('utf8'));
      })
    }catch(err){
      ws.send(err.message);
    }
  })
  ws.send('hi!')
})

