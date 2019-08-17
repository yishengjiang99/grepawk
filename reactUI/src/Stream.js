import React from 'react'
import Window from './components/Window';
import SignalClient from "./Model/SignalClient.js"
import Video from "./Video";

const signalClient = SignalClient();
const streamControlStyle={
    margin:"auto",
    backgroundColor:"light-gray",
    width:"80%"
}

class Stream extends React.Component{

    state={
        broad_casting:false,
        screenCaptureStream: null,
        streamURI: (this.props.args.length>1 && this.props.args[1]) || this.props.userInfo.username
    }

    componentDidMount(){
        this.screenShare();
        alert(this.state.streamURI);
    }

    screenShare=()=>{
        navigator.mediaDevices.getDisplayMedia().then(stream=>{
            document.querySelector('broadcast_preview');
            this.setState({screenCaptureStream: stream});
        });   
    }
    handleURIChange=(event)=>{
        console.log(event.target.value);
        this.setState({streamURI:event.target.value});
    }
    startStream=(event)=>{
        signalClient.registerBroadcast(this.state.streamURI).then(function(){
            this.setState({broad_casting:true});
        })
    }

    renderLobby=()=>{
        const uri = this.state.streamURI;
        return (
            <div>
                <p>Select broadcast URL:</p>
                <p>https://grepawk.com/watch/<input type='text' name="select_url"
                    placeholder='select url'
                    onChange={this.handleURIChange}
                    value={uri} /></p>
                <p><button onClick={this.startStream}>Start Stream</button></p>
            </div>
        )
    }
    renderStreamControll=()=>{
        return(
            <div>stream started</div>
        )
    }

    render(){
        const broadcastStream = this.state.screenCaptureStream;
        const uri = this.state.streamURI;
        return(
            <Window className='stream' title={this.props.title} pid={this.props.pid} ipc={this.props.ipc}>
                <div className='stream-control' style={streamControlStyle}>
                    {broadcastStream ? (<Video media={broadcastStream} /> ) : 
                    <button onClick={this.screenShare}>Screen Share</button>}
                   
                   {this.state.broad_casting ? this.renderLobby() : this.renderStreamControll()}
                </div>
            </Window>
        )
    }
}
export default Stream;
