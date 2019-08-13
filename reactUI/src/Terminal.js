import React from 'react'
import Window from './components/Window'
import './Terminal.css'
var socket=null;
const node_ws_url = 'ws://localhost:8081';


class Terminal extends React.Component{
    state={
       socket,
       output_rows:[{type:'text',data:'welcome!'},{type:'text',data:'welcome!'}],
       output_cursor_position:0,
       uuid: localStorage.getItem("uuid") || "1234"
    }
    constructor(props){
        super(props)
        this.input_ref=React.createRef();
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

   async componentDidMount(){
        await this.initSocket();
        socket.onmessage=(event)=>{
            if (event.data && event.data.startsWith("stdout: ")) {
                var stdout = event.data.replace("stdout: ", "");
                this.onAddOutputRow({type:"text",data:stdout})
               // output("<pre>" + stdout + "</pre>");
            }
        }
       window.terminalDidMount();
    }

    renderOutputRow=(row,i)=>{
        switch(row.type){
            case 'text':
                return (<pre key={"op-"+i}> {row.data}</pre>)
                break;
            case 'stdin':
                
                return (<div className='input-line' key={"op-"+i}><div className='prompt'>$</div> 
                   <input className='cmdline input-line' disabled  value={row.data} /></div>);
                break;
            break;
        }
    }
    keyboardLoaded=(e)=>{
      e.target.focus();
    }
    keyboardPressed=(e)=>{
        if(e.keyCode==13){ //enter
            this.onAddOutputRow({type:"stdin",data:e.target.value});
            socket.send(e.target.value);
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
    render(){
        return (<Window title={this.props.title}>
            <div className='terminal-body'>
            {this.state.output_rows.map((row,i)=>{
                return this.renderOutputRow(row,i);
            })}
            {this.renderInputBar()}
            </div>
        </Window>) 
    }
}

export default Terminal;