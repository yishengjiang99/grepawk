var io = require('socket.io-client');

var socket=io.connect('http://localhost:3000',{transports:['websocket']});
var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Search youtube (or type "q" to exit):\n',function(keyword){
  if(keyword=='q') rl.close();
  socket.emit("search",keyword);
});


