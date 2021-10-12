const app = require("./server/http.js");
const webSocketService = require("./server/ws.js");
const server = require("http").createServer(app);
server.on("upgrade", function upgrade(request, sock, head) {
  webSocketService.handleUpgrade(
    request,
    sock,
    head,
    function done(wsclient, wsRequest) {
      webSocketService.emit("connection", wsclient, wsRequest);
    }
  );
});
server.listen(process.env.PORT || 3000);
