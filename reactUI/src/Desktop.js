import React from 'react'
import './App.css'
import Terminal from './Terminal'

class Desktop extends React.Component{
    constructor(props){
        super(props);
        this.state={
            windows: [],
            fileSystem:null,
            processes: [],
            mPid: 0,
        }
    }
    errorHandler=()=>{

    }
    icp=(fromPid, toPid, msg)=>{

    }
    componentDidMount(){
        setTimeout(()=>{
           this.setState({fileSystem:{}});
        },300);
        // fetch("/files").then(res=>res.json()).then(fsJson=>{
        //     this.setState({fileSystem:fsJson});
        // }).catch(this.errorHandler);
    }
    renderBody(){
        if(this.state.fileSystem === null){
            return (<div>Loading..</div>);
        }else{
            return (<Terminal fileSystem={this.state.fileSystem} 
                        onClickWindowButton={this.onClickWindowButton}
                        pid={this.state.mPid++}
                        title='tty'
                    />);
        }
    }
    render(){
        return (
            <div className='desktop'>
                <div className='navbar navbar-light'>GrepAwk
                </div>
                <div className='container-fluid'>
                    {this.renderBody()}
                </div>
            </div>
        )
    }
}
export default Desktop;
