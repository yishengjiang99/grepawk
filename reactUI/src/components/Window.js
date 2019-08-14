import React from 'react'
import './Window.css';
import Draggable from 'react-draggable'; // The default



class Window extends React.Component{
    state ={
        minimized:false,
        maximized:false,
        closed:false
    }
    constructor(props){
        super(props)
    }
    onNavBarClick=(e)=>{
        const mode = e.target.className;
        if(mode==='maximize'){
            this.setState({maximized:!this.state.maximized});
        }else if(mode==='minimize'){
            this.setState({minimized:!this.state.minimized});
        }else if(mode==='close'){
            this.setState({closed:true});
            this.props.ipc("close", [this.props.pid]);
        }
    }
    renderNavTop=()=>{
        return (
        <div className='title'>
            <button className='close' onClick={this.onNavBarClick}>x</button>
            <button className='maximize' onClick={this.onNavBarClick}>[]</button>
            <button className='minimize' onClick={this.onNavBarClick}>_</button>
            <p className='title'>{this.props.title}</p>
        </div>
        )
    }

    render(){
        if(this.state.closed) return null;
        var boxClass="";
        if(this.state.minimized){
            boxClass="box box-minimized"
        }else if(this.state.maximized){
            boxClass='box box-full';
        }else{
            boxClass='box';
        }    
        boxClass= (this.props.className ||"")+" " + boxClass;          
        return (
            <Draggable>
                <div className={boxClass}>
                    {this.renderNavTop()}
                    <div className="body">
                        {this.props.children}
                    </div>
                </div>
            </Draggable>
      ) 
    }
}

export default Window;