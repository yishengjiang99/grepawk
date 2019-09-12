import React from "react";

class Modal extends React.Component{
    render(){
        const modalStyle={
            position:   'fixed',
            width:      '500px',
            height:     '400px',
            overflow:   'scroll',
            top:                200,
            left:               "calc(100% - 500px)/2",
            backgroundColor:    "gray"
        }
        return (
            <div style={modalStyle}>
                <h3>{this.props.title || "title"}</h3>
                <div>

                </div>
            </div>
        )

    }

}

export default Modal;