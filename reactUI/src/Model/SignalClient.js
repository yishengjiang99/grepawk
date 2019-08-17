const SignalClient=function(){

    var socket;
    var onMessageHandlers={}; //key-value pair so we can remove..

    var socketOnMessage=(event)=>{
        const response = JSON.parse(event.data);
        Object.keys(onMessageHandlers).forEach((key)=>{
            onMessageHandlers[key](response);
        })
    }


    var init = function(){
        return new Promise((resolve,reject)=>{
            if(socket && socket.readyState===WebSocket.OPEN){
                resolve();
            }
            socket = new WebSocket("ws://localhost:8081");
            socket.onopen=(event)=>{resolve()};
            socket.onmessage=socketOnMessage;
            socket.onerror=(event)=>{reject()};
        })
    }

    return{        
        registerBroadcast: function(channelName){
            return new Promise(async (resolve,reject)=>{
                await init();
                socket.send("register_broadcast"+channelName);
                onMessageHandlers["register_"+channelName]=function(response){
                    if(response.ok){
                        delete onMessageHandlers["register_"+channelName];
                        resolve(response.url);
                    }
                }
                setTimeout(()=>{
                    delete onMessageHandlers["register_"+channelName];
                    reject(new Error("Broadcast request timed out"));
                },30000);
            })
        }
    }
}

export default SignalClient;