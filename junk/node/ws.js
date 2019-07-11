const fs = require('fs')




fs.open('/Users/yisheng/Dropbox/grepawk/notes/nodejs_jan_17.txt', 'r', (err, fd) => {
  console.log(fd)
})

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8081 })
wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message => ${message}`)
  })
  ws.send('ho!')
})
