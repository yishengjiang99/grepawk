import React from 'react'
import SignalClient from './Model/SignalClient'
import Window from './components/Window'
import Video from "./Video"


class Watch extends React.Component{

    state = {
        streamLoaded:false,
        flashMessage:null,
        remoteStream:null,
        streamURI: (this.props.args.length>0 && this.props.args[0]) || this.props.userInfo.username
    }    
    componentDidMount(){
        const client = SignalClient();
        client.watchStream(this.state.streamURI,this.props.userInfo).then((remoteStream)=>{
            debugger;
            this.setState({
                streamLoaded:true,
                remoteStream:remoteStream
            })
        }).catch(e=>{
            this.setState({flashMessage:e.message});
        })
    }
    render(){
        return(
            <Window className='watch' title={this.props.title} pid={this.props.pid} ipc={this.props.ipc}>
                {this.state.flashMessage ? (<div>{this.state.flashMessage}</div>) : null}
                {this.state.remoteStream ? (<Video media={this.state.remoteStream} /> ) : "Loading.."}
            </Window>
        )
       

    }
}
export default Watch