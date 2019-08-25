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
    render(){
        return(
            <Window className='stream' title={this.props.title} pid={this.props.pid} ipc={this.props.ipc}>
                <iframe src='/broadcast.html' width='100%' height='100%' frameBorder="0">stop using IE 4</iframe>
            </Window>
        )
    }
}
export default Stream;
