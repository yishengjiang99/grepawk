const app = require("./server/http.js");
const webSocketService = require("./server/ws.js");
const server = require("http").createServer(app);
server.on("upgrade", function upgrade(req, sock, head) {
  webSocketService.handleUpgrade(req, sock, head, function done(ws) {
    webSocketService.emit("connection", wsreq);
  });
});

app.listen(process.env.PORT || 3000);
