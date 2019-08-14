import React from 'react'
const hudStyle={
  float:'right',
  marginRight:"15px"          
}
class HUD extends React.Component{
    constructor(props){
        super(props)
    }
    
    render(){
        return(
            <span style={hudStyle} className="HUD">
                Name: {this.props.fname || this.props.username || "guest"}, 
                Location: {this.props.cwd ||"root"},
                XP Level:{this.props.xp || 0}, 
                Gold:{this.props.points||0}
            </span>
        )
    }
}

export default HUD;