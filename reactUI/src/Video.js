import PropTypes from 'prop-types';
import React from 'react';

class Video extends React.Component {
  componentDidMount() {
    this.video.srcObject = this.props.media;
  }

  shouldComponentUpdate(props) {
    return this.props.media !== props.media;
  }

  componentDidUpdate() {
    this.video.srcObject = this.props.media;
  }

  render() {
    const { width, height, muted, children } = this.props;

    return (
      <video
        height={height}
        width={width}
        muted={muted}
        autoPlay
        playsInLine
        ref={(video) => { this.video = video; }}
      >
        {children}
      </video>
    );
  }
}

Video.defaultProps = {
  children: null,
  height: 420,
  width: 640,
  muted: true,
  media: null,
};

Video.propTypes = {
  children: PropTypes.element,
  media: PropTypes.shape(
    {
      active: PropTypes.bool,
      ended: PropTypes.bool,
      id: PropTypes.string,
    },
  ),
  muted: PropTypes.bool,
};

export default Video;
