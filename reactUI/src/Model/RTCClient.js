const RTCClient=function(signalClient){

    let rtcClient;
    const peerRTCConfig = {
        'RTCIceServers': [{
              'url': 'stun:stun.l.google.com:19302'
           },
           {
              'url': 'turn:192.158.29.39:3478?transport=udp',
              'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
              'username': '28224511:1379330808'
           },
           {
              'url': 'turn:192.158.29.39:3478?transport=tcp',
              'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
              'username': '28224511:1379330808'
           }
        ],
        optional: [{
           'DtlsSrtpKeyAgreement': true
        }]
    
     }
    
    async function startStream(stream){
        
   
    }
    function toString(){
        const status ={
            connectionState: rtcClient.connectionState,
            localDescription: rtcClient.localDescription,
            peerIdentity: rtcClient.peerIdentity,
            signalingState: rtcClient.peerIdentity
        }
        return JSON.stringify(status);
    }


}