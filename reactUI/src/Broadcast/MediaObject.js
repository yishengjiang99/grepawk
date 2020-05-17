import React from 'react';
import Video from '../Video'
import AnimatedCanvas from '../components/Canvas.js';
class MediaObject extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
           dimensions: props.mediaObject[2]
        }
    }

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

        return (
        <AnimatedCanvas
            updateCanvasData={function () {
                meter.getByteFrequencyData(arraybuffer);
                return arraybuffer;

            }}
            draw={function (ctx, width, height, data) {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, width, height);
                var x = 0;
                for (let i = 0; i < data.length; i++) {
                    const barheight = data[i]* 10;
                    const barWidth = 3;
                    ctx.fillStyle = `rbga(${barheight},50,50,0.8)`;
                    ctx.fillRect(x, 0, barWidth, barheight);
                    console.log([x, 0, barWidth, barheight], 'drawcan')
                    x+= barWidth;
                }
            }}
        ></AnimatedCanvas>)
    }

    renderAudio = (stream) => {
        return (<audio width={"100%"} height={"100%"} srcObject={stream} muted={false} autoPlay={true} controls></audio>)

    }
    render() {
        const streamType = this.props.mediaObject[0];
        const stream = this.props.mediaObject[1];
        const dimensions = this.state.dimensions;
        const extras = this.props.mediaObject[3];
        const divStyle = {
            position: "absolute",
            left: dimensions[0] + "%",
            top: dimensions[1] + "%",
            width: dimensions[2] + "%",
            height: dimensions[3] + "%"
        }

        return (
            <div draggable style={divStyle}>
            {streamType == "video" ? this.renderVideo(stream) : null}
            {streamType == "screenshare" ? this.renderVideo(stream) : null}
            {streamType == "webcam" ? this.renderVideo(stream) : null}
            {streamType == "audioMeter" ? this.renderCanvas(stream) : null}

            {streamType == "audio" ? this.renderAudio(stream) : null}
            {streamType == "text" ? this.renderText(stream) : null}
            {streamType == "image" ? this.renderImage(stream) : null}
        </div>
        )
    }
}

export default MediaObject;