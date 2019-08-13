import React from 'react'
import NavBar from './NavBar';
import './Window.css';


class Window extends React.Component{
    constructor(props){
        super(props)
        this.state={windowMode:'normal'}
        this.onNavBarClick=this.onNavBarClick.bind(this);
    }
    onNavBarClick(mode){
        this.setState({windowMode:mode});
    }
    renderNavTop=()=>{
        return (<NavBar title={this.props.title} 
            navbarClick={this.onNavBarClick} />)
    }

    render(){
        return (
            <div className='box'>
                {this.renderNavTop()}
                <div className='body'>
                {this.props.children}
                </div>
            </div>) 
    }
}

export default Window;