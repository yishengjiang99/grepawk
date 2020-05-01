import React from 'react';
import Video from '../Video'
import Draggable from 'react-draggable'; // The default
import AnimatedCanvas from '../components/Canvas.js';
import { Resizable, ResizableBox } from 'react-resizable';

class MediaObject extends React.Component {

    renderVideo = (stream) => {

        return (<Video width={"100%"} height={"100%"} media={stream}></Video>)
    }

    renderText = (text) => {
        return (<div>{text}</div>)
    }
    renderImage = (pictureUrl) => {
        return (<img src={pictureUrl}></img>);
    }

    renderCanvas = (meter) => {
        let arraybuffer = new Uint8Array(meter.fftSize);

        return (<AnimatedCanvas
            updateCanvasData={function () {
                meter.getByteFrequencyData(arraybuffer);
                return arraybuffer;

            }}
            draw={function (ctx, width, height, data) {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, width, height);
                var x = 0;
                for (let i = 0; i < data.length; i++) {
                    const barheight = data[i];
                    const barWidth = Math.log10(i / data.length) * 20;
                    ctx.fillStyle = `rbga(${barheight},50,50,0.8)`;
                    ctx.fillRect(x, 0, barWidth, barheight);
                }
            }}
        ></AnimatedCanvas>)
    }

    renderAudio = (stream) => {
        return (<audio width={"100%"} height={"100%"} srcObj={stream} muted={true} autoPlay={true} controls={"controls"}></audio>)

    }
    render() {
        const streamType = this.props.mediaObject[0];
        const stream = this.props.mediaObject[1];
        const dimensions = this.props.mediaObject[2];
        const extras = this.props.mediaObject[3];
        const divStyle = {
            position: "absolute",
            left: dimensions[0] + "%",
            top: dimensions[1] + "%",
            width: dimensions[2] + "%",
            height: dimensions[3] + "%"
        }
        if (this.props.notDraggable) {
            return (
                <div style={divStyle}>
                    {streamType == "video" ? this.renderVideo(stream) : null}
                    {streamType == "screenshare" ? this.renderVideo(stream) : null}
                    {streamType == "webcam" ? this.renderVideo(stream) : null}
                    {/* {streamType == "audioMeter" ? this.renderCanvas(stream) : null} */}

                    {streamType == "audio" ? this.renderAudio(stream) : null}
                    {streamType == "text" ? this.renderText(stream) : null}
                    {streamType == "image" ? this.renderImage(stream) : null}
                </div>
            )
        }
        return (
            
            <ResizableBox width={divStyle.width} height={divStyle.height} handle={"s"|"e"|"se"}>
                <Draggable>
                <div style={divStyle}>
                    {streamType == "video" ? this.renderVideo(stream) : null}
                    {streamType == "screenshare" ? this.renderVideo(stream) : null}
                    {streamType == "webcam" ? this.renderVideo(stream) : null}
                    {/* {streamType == "audioMeter" ? this.renderCanvas(stream) : null} */}

                    {streamType == "audio" ? this.renderAudio(stream) : null}
                    {streamType == "text" ? this.renderText(stream) : null}
                    {streamType == "image" ? this.renderImage(stream) : null}
                </div>

                </Draggable>
      
            </ResizableBox>

        )
    }
}

export default MediaObject;