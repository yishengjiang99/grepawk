import React from 'react';
import Video from '../Video'
import Draggable from 'react-draggable'; // The default

class MediaObject extends React.Component{

    renderVideo=(stream,width,height)=>{
        
        return (<Video width={"100%"} height={"100%"} media={stream}></Video>)
    }
 
    renderAudio=()=>{
        return (<div>todo</div>)
    }
    render(){
        const streamType = this.props.mediaObject[0];
        const stream =  this.props.mediaObject[1];
        const dimensions = this.props.mediaObject[2];
        const divStyle={
            position:"absolute",
            left:   dimensions[0]+"%",
            top:    dimensions[1]+"%",
            width:  dimensions[2]+"%",
            height: dimensions[3]+"%"
        }
        if(this.props.notDraggable){
            return(
                <div style={divStyle}>
                    {streamType=="video"       ?   this.renderVideo(stream) : null}
                    {streamType=="screenshare" ? this.renderVideo(stream) : null}
                    {streamType=="webcam"      ? this.renderVideo(stream) : null}
                    {streamType=="audio"       ? this.renderAudio(stream) : null}
                </div>
            )
        }
        return(
            <Draggable>          
                 <div style={divStyle}>
                    {streamType=="video" ? this.renderVideo(stream) : null}
                    {streamType=="screenshare" ? this.renderVideo(stream) : null}
                    {streamType=="webcam"      ? this.renderVideo(stream) : null}
                    {streamType=="audio"       ? this.renderAudio(stream) : null}
                </div>
            </Draggable>

        )
    }
}

export default MediaObject;