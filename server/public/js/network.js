function debug(msg,obj){
  msg = "<br>"+(new Date().getTime()-t0)+": "+msg+(obj ? JSON.stringify(obj) : "");
  document.getElementById("console").innerHTML+=msg;
}

var bc  = BroadcasterClient({
    onEvent: debug,
    console: "console"
})

var stream = new MediaStream();

bc.addStream(stream, [0,0,50,50]);

bc.startBroadcast("yisheng");

