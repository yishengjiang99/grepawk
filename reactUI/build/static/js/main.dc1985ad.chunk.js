(window["webpackJsonpmy-app"]=window["webpackJsonpmy-app"]||[]).push([[0],{107:function(e,t,a){},108:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),s=a(24),o=a.n(s),i=(a(49),a(2)),c=a(3),l=a(5),u=a(4),d=a(14),m=a(6),p=(a(50),a(8)),f=a.n(p),h=a(10),g=(a(52),a(43)),v=a.n(g),y=function(e){function t(e){var a;return Object(i.a)(this,t),(a=Object(l.a)(this,Object(u.a)(t).call(this,e))).state={minimized:!1,maximized:!1,closed:!1},a.onNavBarClick=function(e){var t=e.target.className;"maximize"===t?a.setState({maximized:!a.state.maximized}):"minimize"===t?a.setState({minimized:!a.state.minimized}):"close"===t&&(a.setState({closed:!0}),a.props.ipc("close",[a.props.pid]))},a.renderNavTop=function(){return r.a.createElement("div",{className:"title"},r.a.createElement("button",{className:"close",onClick:a.onNavBarClick},"x"),r.a.createElement("button",{className:"maximize",onClick:a.onNavBarClick},"[]"),r.a.createElement("button",{className:"minimize",onClick:a.onNavBarClick},"_"),r.a.createElement("p",{className:"title"},a.props.title))},a}return Object(m.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){if(this.state.closed)return null;var e="";return e=this.state.minimized?"box box-minimized":this.state.maximized?"box box-full":"box",e=(this.props.className||"")+" "+e,r.a.createElement(v.a,null,r.a.createElement("div",{className:e},this.renderNavTop(),r.a.createElement("div",{className:"body"},this.props.children)))}}]),t}(r.a.Component),b=(a(53),a(54).Parser),E=function(e){function t(e){var a;return Object(i.a)(this,t),(a=Object(l.a)(this,Object(u.a)(t).call(this,e))).renderHeaders=function(){return a.props.headers?r.a.createElement("thead",null,r.a.createElement("tr",{key:"tbtrh1"},a.props.headers.map(function(e,t){return r.a.createElement("th",{key:"th"+t},e)}))):null},a.renderBody=function(){return a.props.rows?r.a.createElement("tbody",null,a.props.rows.map(function(e,t){var n="";a.props.headers.map(function(t){var a=e[t]||"",r="";if("opts"==t)a.forEach(function(e,t){r+="<a style='color:yellow' href='#' class='onclick_cmd' cmd='".concat(e.cmd,"'>").concat(e.desc,"</a>")}),n+="<td>"+r+"</td>";else if("thumbnail"===t){n+="<td><img width=120 src='"+a+"'></td>"}else n+="<td>"+a+"</td>"});var s=new b;return r.a.createElement("tr",{key:"tr "+t},s.parse(n))})):null},a}return Object(m.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){return r.a.createElement("table",{className:this.props.className||"table",border:"1"},this.renderHeaders(),this.renderBody())}}]),t}(r.a.Component),k=null,w="ws://localhost:8081";function O(){var e=localStorage.getItem("uuid");if(e)return e;e=function(){var e=(new Date).getTime();return"undefined"!==typeof performance&&"function"===typeof performance.now&&(e+=performance.now()),"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(t){var a=(e+16*Math.random())%16|0;return e=Math.floor(e/16),("x"===t?a:3&a|8).toString(16)})}(),localStorage.setItem("uuid",e)}var S=function(e){function t(e){var a;return Object(i.a)(this,t),(a=Object(l.a)(this,Object(u.a)(t).call(this,e))).state={socket:k,output_rows:[],output_cursor_position:0,uuid:O()},a.initSocket=function(){return new Promise(function(e,t){if(k&&k.readyState===WebSocket.OPEN)e();else{if(k&&k.readyState===WebSocket.CONNECTING)return a.onAddOutputRow({type:"text",data:"Connecting.."}),void e();(k=new WebSocket(w)).onopen=function(t){clearTimeout(n),k.send("check-in "+a.state.uuid),e()};var n=setTimeout(function(){k.readyState,WebSocket.OPEN},5e3)}})},a.onAddOutputRow=function(e){var t=a.state.output_rows.concat(e);a.setState({output_rows:t})},a.parseAPIResponse=function(e){e.stdout&&a.onAddOutputRow({type:"text",data:e.stdout}),e.stderr&&a.onAddOutputRow({type:"text",data:e.stderr}),e.table&&a.onAddOutputRow({type:"table",data:e.table}),e.userInfo&&(localStorage.setItem("uuid",e.userInfo.uuid),a.props.ipc("hud-update",e.userInfo)),e.quests&&a.props.ipc("questlist",e.quests),e.hint},a.renderOutputRow=function(e,t){switch(e.type){case"stdout":case"text":return r.a.createElement("pre",{key:"op-"+t}," ",e.data);case"stderr":return r.a.createElement("pre",{key:"op-"+t}," ",r.a.createElement("span",{style:{color:"red"}},e.data));case"stdin":return r.a.createElement("div",{className:"input-line",key:"op-"+t},r.a.createElement("div",{className:"prompt"},"$"),r.a.createElement("input",{className:"cmdline input-line",disabled:!0,value:e.data}));case"table":return r.a.createElement("div",{key:"op-"+t},r.a.createElement(E,{className:"table table-dark",headers:e.data.headers,rows:e.data.rows}))}},a.keyboardLoaded=function(e){e.target.focus()},a.windowLoaded=function(e){document.getElementsByClassName("terminal-body").scrollTo(0,100),e.target.offsetHeight=1e3},a.keyboardPressed=function(e){13==e.keyCode&&(a.onAddOutputRow({type:"stdin",data:e.target.value}),a.locallyProcessed(e.target.value)||k.send(e.target.value),e.target.value="")},a.renderInputBar=function(){return r.a.createElement("div",{className:"input-line"},r.a.createElement("div",{className:"prompt"},"$"),r.a.createElement("input",{onLoad:a.keyboardLoaded,onKeyDown:a.keyboardPressed,size:"80",id:"terminal_input",className:"cmdline input-line"}))},a.clickOnTerminal=function(e){document.getElementById("terminal_input").focus()},a.scrollToBottom=function(){a.messagesEnd.scrollIntoView({behavior:"smooth"})},a}return Object(m.a)(t,e),Object(c.a)(t,[{key:"componentDidMount",value:function(){var e=Object(h.a)(f.a.mark(function e(){var t=this;return f.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.initSocket();case 2:k.onmessage=function(e){if("object"===typeof e.data){var a=new Image;a.src=URL.createObjectURL(e.data),t.onAddOutputRow({type:"image",data:a})}else if(e.data&&e.data.startsWith("stdout: ")){var n=e.data.replace("stdout: ","");t.onAddOutputRow({type:"text",data:n})}else if(e.data&&e.data.startsWith("stderr: ")){n=e.data.replace("stderr: ","");t.onAddOutputRow({type:"text",data:n})}else t.parseAPIResponse(JSON.parse(e.data))},window.terminalDidMount();case 4:case"end":return e.stop()}},e,this)}));return function(){return e.apply(this,arguments)}}()},{key:"locallyProcessed",value:function(e){if(!e)return!1;var t=e.split(" "),a=t[0],n=t.splice(1);switch(a){case"cam":case"upload":case"new":case"stream":case"broadcast":case"draw":return this.props.ipc(a,n),!0;default:return!1}}},{key:"render",value:function(){var e=this;return r.a.createElement(y,{className:"terminal",title:this.props.title,pid:this.props.pid,ipc:this.props.ipc},r.a.createElement("div",{className:"terminal-body",onClick:this.clickOnTerminal},this.state.output_rows.map(function(t,a){return e.renderOutputRow(t,a)}),this.renderInputBar(),r.a.createElement("div",{className:"terminal-anchor",ref:function(t){e.messagesEnd=t}}," ")))}},{key:"componentDidUpdate",value:function(){this.scrollToBottom()}}]),t}(r.a.Component),C={float:"right",marginRight:"15px"},x=function(e){function t(e){return Object(i.a)(this,t),Object(l.a)(this,Object(u.a)(t).call(this,e))}return Object(m.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){return r.a.createElement("span",{style:C,className:"HUD"},"Name: ",this.props.fname||this.props.username||"guest",", Location: ",this.props.cwd||"root",", XP Level:",this.props.xp||0,", Gold:",this.props.points||0)}}]),t}(r.a.Component),R=function(e){function t(){return Object(i.a)(this,t),Object(l.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){return r.a.createElement("div",{className:this.props.className},r.a.createElement("h5",null,this.props.title),r.a.createElement("ul",null,this.props.list&&this.props.list.map?this.props.list.map(function(e,t){return r.a.createElement("li",{key:"list-"+t},r.a.createElement("h5",{className:"list-header"},e.title),r.a.createElement("div",{className:"list-body"},e.description))}):null))}}]),t}(r.a.Component),j=function(e){function t(){return Object(i.a)(this,t),Object(l.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(c.a)(t,[{key:"componentDidMount",value:function(){this.video.srcObject=this.props.media}},{key:"shouldComponentUpdate",value:function(e){return this.props.media!==e.media}},{key:"componentDidUpdate",value:function(){this.video.srcObject=this.props.media}},{key:"render",value:function(){var e=this,t=this.props,a=t.width,n=t.height,s=t.muted,o=t.children;return r.a.createElement("video",{height:n,width:a,muted:s,autoPlay:!0,ref:function(t){e.video=t}},o)}}]),t}(r.a.Component);j.defaultProps={children:null,height:420,width:640,muted:!0,media:null};var N,I,_=j,T={RTCIceServers:[{url:"stun:stun.l.google.com:19302"},{url:"turn:192.158.29.39:3478?transport=udp",credential:"JZEOEt2V3Qb0y27GRntt2u2PAYA=",username:"28224511:1379330808"},{url:"turn:192.158.29.39:3478?transport=tcp",credential:"JZEOEt2V3Qb0y27GRntt2u2PAYA=",username:"28224511:1379330808"}],optional:[{DtlsSrtpKeyAgreement:!0}]},D=function(e){function t(e){var a;return Object(i.a)(this,t),(a=Object(l.a)(this,Object(u.a)(t).call(this,e))).state={enteredRoom:!1,signalConnected:!1,videoOn:!0,audioOn:!0,flashMessage:"",error:null,myStream:null,room:a.props.room||"default",isHost:null,remoteStreams:[]},a.joinRoom=Object(h.a)(f.a.mark(function e(){return f.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:a.setState({enteredRoom:!0}),N.send(JSON.stringify({type:"login",channel:a.state.room,uuid:a.props.userInfo.uuid}));case 2:case"end":return e.stop()}},e)})),a.initiateRTCPeerConnection=function(){return(I=new RTCPeerConnection(T)).ontrack=function(e){if(e.streams&&e.streams[0]){var t=a.state.remoteStreams.concat(e.streams[0]);a.setState({remoteStreams:t})}},I.onicecandidateerror=function(e){a.setState({flashMessage:e.message})},I.onicecandidate=function(e){null!=e.candidate&&N.send(JSON.stringify({type:"candidate",candidate:e.candidate,channel:a.state.room}))},I},a.onLoggedInWithSignalServer=function(e){a.setState({signalConnected:!0}),1!=e.usersCount?(a.initiateRTCPeerConnection(),I.onnegotiationneeded=function(e){I.createOffer().then(function(e){I.setLocalDescription(e),N.send(JSON.stringify({type:"offer",offer:e,channel:a.state.room}))}).catch(function(e){alert(e.message)})},a.state.myStream.getTracks(function(e){I.addTrack(e,a.state.myStream)}),I.createOffer().then(function(e){I.setLocalDescription(e),N.send(JSON.stringify({type:"offer",offer:e,channel:a.state.room}))}).catch(function(e){alert(e.message)})):a.setState({flashMessage:"Joined channel "+e.channelJoined+". Only you here."})},a.onReceivedRemoteConnectionOffer=function(e){a.initiateRTCPeerConnection(),I.setRemoteDescription(new RTCSessionDescription(e.offer)).then(function(){a.state.myStream.getTracks().forEach(function(e){I.addTrack(e,a.state.myStream)})}).then(function(){return I.createAnswer()}).then(function(e){return I.setLocalDescription(e),e}).then(function(t){N.send(JSON.stringify({type:"answer",answer:t,channel:e.channel,uuid:e.caller_id}))}).catch(function(e){console.log(e),a.setState({flashMessage:e.message+" on receive remote errored"})})},a.onReceivedConnectionRequestResponse=function(e){e.answer.sdp&&I.setRemoteDescription(e.answer).then(function(){return navigator.mediaDevices.getDisplayMedia()}).then(function(e){e.getTracks().forEach(function(t){return I.addTrack(t,e)})})},a.onReceivedICECandidate=function(e){I.addIceCandidate(e.candidate).catch(function(e){console.log("Failure during addIceCandidate(): "+e.name)})},a.chatRoomChanged=function(e){var t=e.target.value;a.setState({room:t})},a.audioCheckBoxChanged=function(e){a.setState({audioOn:e.target.value})},a.videoCheckBoxChanged=function(e){a.setState({videoOn:e.target.value})},a.gotMyStream=function(e){a.setState({myStream:e})},a.renderLobby=function(){return r.a.createElement("div",{className:"cam-lobby"},r.a.createElement("p",null,a.state.flashMessage),r.a.createElement(_,{width:300,media:a.state.myStream}),r.a.createElement("p",null,"Join Room: ",r.a.createElement("input",{id:"join_room_name",onChange:a.chatRoomChanged,value:a.state.room,type:"text",size:"50"})),r.a.createElement("p",null,"Audio: ",r.a.createElement("input",{id:"join_room_audio",onChange:a.audioCheckBoxChanged,type:"checkbox",checked:!0})),r.a.createElement("p",null,"Video: ",r.a.createElement("input",{id:"join_room_video",onChange:a.videoCheckBoxChanged,type:"checkbox",checked:!0})),r.a.createElement("p",null,r.a.createElement("button",{onClick:a.joinRoom},"Go")," "))},a.renderRoom=function(){return r.a.createElement("div",{className:"cam-room"},r.a.createElement("h3",null,"Room ",a.state.room),r.a.createElement("p",null,a.state.flashMessage),r.a.createElement(_,{key:"mstream",width:200,height:100,media:a.state.myStream}),a.state.remoteStreams.map(function(e,t){return console.log(e),r.a.createElement(_,{key:"remote-stream-"+t,width:100,height:100,media:e})}))},a.onClosed=function(){},a.videoRef=r.a.createRef(),a}return Object(m.a)(t,e),Object(c.a)(t,[{key:"componentDidMount",value:function(){var e=Object(h.a)(f.a.mark(function e(){var t,a=this;return f.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return(N=new WebSocket("ws://localhost:9090")).onopen=function(e){a.setState({signalConnected:!0})},N.onmessage=function(e){try{var t=JSON.parse(e.data);console.log("signal on msg ",e),"login"===t.type?a.onLoggedInWithSignalServer(t):"offer"===t.type?t.offer.sdp?a.onReceivedRemoteConnectionOffer(t):console.log("signal ret offer not contrain sdp",t):"answer"===t.type?a.onReceivedConnectionRequestResponse(t):"candidate"===t.type?a.onReceivedICECandidate(t):"error"===t.type&&a.setState({flashMessage:t.message})}catch(n){console.log("signal onmsg failed",n)}},e.prev=3,e.next=6,navigator.mediaDevices.getDisplayMedia();case 6:t=e.sent,this.setState({myStream:t}),e.next=13;break;case 10:e.prev=10,e.t0=e.catch(3),this.setState({error:e.t0.message});case 13:case"end":return e.stop()}},e,this,[[3,10]])}));return function(){return e.apply(this,arguments)}}()},{key:"componentWillUnmount",value:function(){this.onClosed()}},{key:"render",value:function(){return r.a.createElement(y,{className:"camera",title:this.props.title,pid:this.props.pid,ipc:this.props.ipc},null!==this.state.error?r.a.createElement("div",null,"Error: ",this.state.error):0==this.state.signalConnected||null==this.state.myStream?r.a.createElement("div",null,"Connecting.."):0==this.state.enteredRoom?this.renderLobby():this.renderRoom())}}]),t}(r.a.Component),A={RTCIceServers:[{url:"stun:stun.l.google.com:19302"},{url:"turn:192.158.29.39:3478?transport=udp",credential:"JZEOEt2V3Qb0y27GRntt2u2PAYA=",username:"28224511:1379330808"},{url:"turn:192.158.29.39:3478?transport=tcp",credential:"JZEOEt2V3Qb0y27GRntt2u2PAYA=",username:"28224511:1379330808"}],optional:[{DtlsSrtpKeyAgreement:!0}]},P="localhost"==window.location.hostname?"ws://localhost:9091":"wss://grepawk.com/signal",B=function(){var e,t,a,n,r={},s=function(e){var t=JSON.parse(e.data);Object.keys(r).forEach(function(e){r[e](t)})};function o(t){e.send(JSON.stringify(t))}return{startStream:function(i,c){return new Promise(function(){var l=Object(h.a)(f.a.mark(function l(u,d){var m;return f.a.wrap(function(l){for(;;)switch(l.prev=l.next){case 0:return l.next=2,new Promise(function(t,a){e&&e.readyState===WebSocket.OPEN&&t(),(e=new WebSocket(P)).onopen=function(e){t()},e.onmessage=s,e.onerror=function(e){a()}});case 2:return t=c,a=i,(n=new RTCPeerConnection(A)).onicecandidate=function(e){e.candidate&&o({type:"candidate",candidate:e.candidate})},a.getTracks(function(e){n.addTrack(e,a)}),l.next=9,n.createOffer();case 9:return m=l.sent,l.next=12,n.setLocalDescription(m);case 12:o({type:"register_stream",channel:t,offer:m}),r["register_offer_"+t]=function(e){e.ok?(delete r["register_offer_"+t],u()):d(new Error(e.error))},setTimeout(function(){delete r["register_offer_"+t],d(new Error("Broadcast request timed out"))},3e4);case 15:case"end":return l.stop()}},l)}));return function(e,t){return l.apply(this,arguments)}}())}}}(),M={margin:"auto",backgroundColor:"light-gray",width:"80%"},L=function(e){function t(){var e,a;Object(i.a)(this,t);for(var n=arguments.length,s=new Array(n),o=0;o<n;o++)s[o]=arguments[o];return(a=Object(l.a)(this,(e=Object(u.a)(t)).call.apply(e,[this].concat(s)))).state={broad_casting:!1,screenCaptureStream:null,streamURI:a.props.args.length>1&&a.props.args[1]||a.props.userInfo.username,flashMessage:null},a.screenShare=function(){navigator.mediaDevices.getDisplayMedia().then(function(e){document.querySelector("broadcast_preview"),a.setState({screenCaptureStream:e})})},a.handleURIChange=function(e){console.log(e.target.value),a.setState({streamURI:e.target.value})},a.startStream=function(){B.startStream(a.state.screenCaptureStream,a.state.streamURI).then(function(){a.setState({broad_casting:!0})}).catch(function(e){a.setState({flashMessage:e.message})})},a.renderLobby=function(){var e=a.state.streamURI;return r.a.createElement("div",null,r.a.createElement("p",null,"Select broadcast URL:"),r.a.createElement("p",null,"https://grepawk.com/watch/",r.a.createElement("input",{type:"text",name:"select_url",placeholder:"select url",onChange:a.handleURIChange,value:e})),r.a.createElement("p",null,r.a.createElement("a",{onClick:a.startStream,href:"#"},"Start Stream")))},a.renderStreamControll=function(){return r.a.createElement("div",null,"Broadcasting now at ",a.state.streamURI)},a}return Object(m.a)(t,e),Object(c.a)(t,[{key:"componentDidMount",value:function(){this.screenShare()}},{key:"render",value:function(){var e=this.state.screenCaptureStream;this.state.streamURI;return r.a.createElement(y,{className:"stream",title:this.props.title,pid:this.props.pid,ipc:this.props.ipc},this.state.flashMessage?r.a.createElement("div",null,this.state.flashMessage):null,r.a.createElement("div",{className:"stream-control",style:M},e?r.a.createElement(_,{media:e}):r.a.createElement("button",{onClick:this.screenShare},"Screen Share"),!1===this.state.broad_casting?this.renderLobby():this.renderStreamControll()))}}]),t}(r.a.Component),J=(a(101),a(107),function(e){function t(){return Object(i.a)(this,t),Object(l.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(c.a)(t,[{key:"render",value:function(){return r.a.createElement("div",{className:"app-icon-grid"},this.props.icons.map(function(e,t){var a=(t+1)%5,n=Math.floor((t+1)/5),s={gridColumnStart:n,gridColumnEnd:n+1,gridRowStart:a,gridRowEnd:a+1,width:50,height:50};return r.a.createElement("div",{key:"icon"+t,style:s},r.a.createElement("i",{className:"fas fa-lg fa-"+e.name}),r.a.createElement("br",null),e.title)}))}}]),t}(r.a.Component)),U=function(e){function t(e){var a;return Object(i.a)(this,t),(a=Object(l.a)(this,Object(u.a)(t).call(this,e))).state={processes:[{name:"tty",state:"on"}],userInfo:{name:"guest",xp:0,gold:0},quests:[],icons:[{name:"broadcast-tower",title:"terminal"},{name:"folder",title:"files"},{name:"tasks",title:"Weather"},{name:"file",title:"file"},{name:"file",title:"file2"},{name:"file",title:"file3"},{name:"file",title:"file4"},{name:"folder",title:"folder"}]},a.push_proc=function(e){},a.ipc=a.ipc.bind(Object(d.a)(a)),a}return Object(m.a)(t,e),Object(c.a)(t,[{key:"componentDidMount",value:function(){}},{key:"ipc",value:function(e,t){switch(e){case"close":var a=t[0],n=this.state.processes;n[a]="closed",this.setState({processes:n});break;case"cam":case"camera":var r=this.state.processes.concat({name:"camera"});this.setState({processes:r});break;case"stream":r=this.state.processes.concat({name:"stream",args:t});this.setState({processes:r});break;case"watch":r=this.state.processes.concat({name:"watch",args:t});this.setState({processes:r});break;case"hud-update":this.setState({userInfo:t});break;case"questlist":this.setState({quests:t})}}},{key:"renderBody",value:function(){var e=this;return this.state.processes.map(function(t,a){return console.log(t,a),"off"===t.state?null:"tty"===t.name?r.a.createElement(S,{key:"tty1",pid:a,title:"tty",ipc:e.ipc}):"camera"===t.name?r.a.createElement(D,{userInfo:e.state.userInfo,pid:a,title:"Face 2 Face",ipc:e.ipc}):"stream"===t.name?r.a.createElement(L,{userInfo:e.state.userInfo,args:t.args,pid:a,title:"Broadcast",ipc:e.ipc}):void 0})}},{key:"renderHud",value:function(){return this.state.userInfo?r.a.createElement(x,{username:this.state.userInfo.username,cwd:this.state.userInfo.cwd,fname:this.state.userInfo.fname,xp:this.state.userInfo.xp,gold:this.state.userInfo.gold}):null}},{key:"renderQuestView",value:function(){return r.a.createElement(R,{className:"quest-list",title:"quests",list:this.state.quests})}},{key:"renderBackground",value:function(){return r.a.createElement(J,{icons:this.state.icons})}},{key:"render",value:function(){return r.a.createElement("div",{className:"desktop"},r.a.createElement("nav",{className:"navbar navbar-light bg-light"},r.a.createElement("a",{className:"navbar-brand",href:"#"},"GrepAwk"),this.renderHud()),this.renderBackground(),this.renderBody(),this.renderQuestView())}}]),t}(r.a.Component);o.a.render(r.a.createElement(U,null),document.getElementById("root"))},44:function(e,t,a){e.exports=a(108)},49:function(e,t,a){},50:function(e,t,a){},52:function(e,t,a){},53:function(e,t,a){},92:function(e,t){}},[[44,1,2]]]);
//# sourceMappingURL=main.dc1985ad.chunk.js.map