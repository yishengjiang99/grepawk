import React from "react";

class Composer extends React.Component{
    render(){
        return (
            <div style={this.props.style||{display:"block"}}>
                {this.props.title || "Compose"}
            </div>
        )
    }
    
}
export default Composer