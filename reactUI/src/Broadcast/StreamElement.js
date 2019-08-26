import React from 'react';

class StreamElement extends React.Component{
 
    render(){
        const streamType = this.props.mediaObject[0];
        const stream =  this.props.mediaObject[1];
        const dimensions = this.props.mediaObject[2];
        return(
        <div>
            {this.streamType}
        </div>
        )
    }
}

export default StreamElement;