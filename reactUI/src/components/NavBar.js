import React from 'react'
//deprecated
class NavBar extends React.Component{
    constructor(props){
        super(props);
      //  this.navbarClick=this.navbarClick.bind(this)
        
        }
    render(){
        return (<div className='title'>
        <button className='close' onClick={this.props.navbarClick}>x</button>
        <button className='maximize' onClick={this.props.navbarClick}>[]</button>
        <button className='minimize' onClick={this.props.navbarClick}>_</button>
        <p className='title'>{this.props.title}</p>
        </div>)
    }
}
export default NavBar;