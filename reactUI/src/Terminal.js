import React from 'react'
import Window from './components/Window'
import './Terminal.css'
import Table from './components/Table'

var socket=null;
const node_ws_url = window.location.hostname == 'localhost' ?
"ws://localhost:8081" : "wss://grepawk.com/node";

class Terminal extends React.Component{
    state={
       socket,
       output_rows:[],
       output_cursor_position:0,
       uuid: getUUID()
    }

    constructor(props){
        super(props)
    }
    initSocket=()=>{
        return new Promise((resolve, reject) => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              resolve();
              return;
            }
            if (socket && socket.readyState === WebSocket.CONNECTING) {
              this.onAddOutputRow({type:"text",data:"Connecting.."});
              resolve();
              return;
            } 
            socket = new WebSocket(node_ws_url);
            socket.onopen = e => {
              clearTimeout(timeoutId);
              socket.send("check-in " + this.state.uuid);
              resolve();
            }
            var timeoutId=setTimeout(() => {
                if(socket.readyState!==WebSocket.OPEN){
                   // reject(new Error("connection timed outt"));
                }
            }, 5000);
          })
    }
    onAddOutputRow=(row)=>{
        const list = this.state.output_rows.concat(row);
        this.setState({output_rows:list});
    }
    parseAPIResponse=(data)=>{
        if(data.stdout){
            this.onAddOutputRow({type:"text",data:data.stdout})
        }
        if(data.stderr){
            this.onAddOutputRow({type:"text",data:data.stderr})
        }
        if(data.table){
            this.onAddOutputRow({type:"table",data:data.table})
        }
        if(data.userInfo){
           // this.onAddOutputRow({type:"text",data: JSON.stringify(data)})
            localStorage.setItem("uuid", data.userInfo.uuid);
            this.props.ipc("hud-update",data.userInfo);
        }
        if(data.quests){
            this.props.ipc("questlist", data.quests);
        }
        if(data.hint){
            //todo
        }
    }
    
   async componentDidMount(){
        await this.initSocket();
        socket.onmessage=(event)=>{
            if (typeof event.data === 'object') {
                var image = new Image();
                image.src = URL.createObjectURL(event.data);
                this.onAddOutputRow({type:"image",data:image})
            } 
            else if (event.data && event.data.startsWith("stdout: ")) {
                var stdout = event.data.replace("stdout: ", "");
                this.onAddOutputRow({type:"text",data:stdout})
            }else if (event.data && event.data.startsWith("stderr: ")) {
                var stdout = event.data.replace("stderr: ", "");
                this.onAddOutputRow({type:"text",data:stdout})
            }else{
                this.parseAPIResponse(JSON.parse(event.data));
            }
        }
       window.terminalDidMount();
    }

    renderOutputRow=(row,i)=>{
        switch(row.type){
            case 'stdout':
            case 'text':
                return (<pre key={"op-"+i}> {row.data}</pre>)
            case 'stderr':
                var redStyle={color:"red"};
                return (<pre key={"op-"+i}> <span style={redStyle}>{row.data}</span></pre>)
            case 'stdin':              
                return (<div className='input-line' key={"op-"+i}><div className='prompt'>$</div> 
                   <input className='cmdline input-line' disabled  value={row.data} /></div>);
            case 'table':
                 return(<div key={"op-"+i}><Table className="table table-dark" headers={row.data.headers} rows={row.data.rows}></Table></div>)
            break;
        }
    }
    keyboardLoaded=(e)=>{
      e.target.focus();
    }
    windowLoaded=(e)=>{
       document.getElementsByClassName("terminal-body").scrollTo(0,100);
        e.target.offsetHeight=1000;
    }

    locallyProcessed(cmd_str){
        if(!cmd_str) return false;

        var t = cmd_str.split(" ");
        const cmd = t[0];
        const args = t.splice(1);
        switch(cmd){
            case 'cam':
            case 'upload':
            case 'new':
            case 'stream':
            case 'broadcast':
            case 'draw':
            case 'watch':
                this.props.ipc(cmd,args);
                return true;
            default:
                return false;
        }

    }
    keyboardPressed=(e)=>{
        if(e.keyCode==13){ //enter
            this.onAddOutputRow({type:"stdin",data:e.target.value});
            if(!this.locallyProcessed(e.target.value)){
                socket.send(e.target.value);
            }
            e.target.value="";
        }
    }

    renderInputBar = () => {
        return (<div className='input-line'>
                    <div className='prompt'>$</div>
                    <input onLoad={this.keyboardLoaded}
                           onKeyDown={this.keyboardPressed}
                           size='80' 
                           id='terminal_input' 
                           className='cmdline input-line' />
                </div>
                )
    }

    clickOnTerminal=(e)=>{
          document.getElementById("terminal_input").focus();;
    }


    render(){
        return (<Window className="terminal" title={this.props.title} pid={this.props.pid} ipc={this.props.ipc}>
            <div className='terminal-body' onClick={this.clickOnTerminal}>
            {this.state.output_rows.map((row,i)=>{
                return this.renderOutputRow(row,i);
            })}
            {this.renderInputBar()}
            <div className="terminal-anchor" ref={(el) => { this.messagesEnd = el; }}> </div>
            </div>
        </Window>) 
    }
    componentDidUpdate() {
        this.scrollToBottom();
      }
      scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
      }
}

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
function getUUID()  {
    var uuid = localStorage.getItem("uuid") 
    if(uuid) return uuid;

    uuid = generateUUID();
    localStorage.setItem("uuid",uuid);
}
export default Terminal;