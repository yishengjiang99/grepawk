import React from 'react'
import './App.css'
import Terminal from './Terminal'
import HUD from "./HUD";
import ListView from "./components/ListView"
import Camera from "./Camera";
import AppIconGrid from './AppIconGrid';

class Desktop extends React.Component{
    state={
        processes:[{name:"tty", state:"on"}],
        userInfo:{name:"guest",xp:0,gold:0},
        quests:[],
        icons:[{name:"broadcast-tower",title:"terminal"},
                {name:"folder",title:"files"},
                {name:"tasks",title:"Weather"},
                {name:"file",title:"file"},
                {name:"file",title:"file2"},
                {name:"file",title:"file3"},
                {name:"file",title:"file4"},
                {name:"folder",title:"folder"}]
    }
    constructor(props){
        super(props);
        this.ipc = this.ipc.bind(this);
    }

    componentDidMount(){

    }

    push_proc=(proc)=>{

    }
    ipc(cmd, args){
        switch(cmd){
            case "close":
                const pid = args[0];
                const list = this.state.processes;
                list[pid]="closed";
                this.setState({processes:list});
            break;
            case "cam":
            case "camera":
               var plist = this.state.processes.concat({"name":"camera"});
               this.setState({processes:plist});
            break;
            case "hud-update":
                this.setState({userInfo:args});
            break;
            case "questlist":
                this.setState({quests:args});
            break;
        }
    }

    renderBody(){
        return(
            this.state.processes.map((proc,pid)=>{
                console.log(proc,pid);
                if(proc.state==='off') return null;
                if(proc.name === 'tty'){
                    return (
                        <Terminal pid={pid} title='tty' ipc={this.ipc}/>
                    );
                }else if(proc.name==='camera'){
                    return (
                        <Camera pid={pid} title='Face 2 Face' ipc={this.ipc} />
                    );
                }
            })
        )
    }
    renderHud(){
        return this.state.userInfo ? 
            (<HUD username={this.state.userInfo.username}
                cwd={this.state.userInfo.cwd}
                fname={this.state.userInfo.fname}
                xp={this.state.userInfo.xp} 
                gold={this.state.userInfo.gold} />)
            : null;
    }
    renderQuestView(){
        return(
            <ListView className="quest-list" title="quests" list={this.state.quests} />
        )
    }
    renderBackground(){
        return(
            <AppIconGrid icons={this.state.icons}></AppIconGrid>
        )
    }
    render(){
        return (
            <div className='desktop'>
                <nav className='navbar navbar-light bg-light'>
                    <a class="navbar-brand" href="#">GrepAwk</a>
                    {this.renderHud()}
                </nav>
                {this.renderBackground()}
                {this.renderBody()}
                {this.renderQuestView()}
                
            </div>
        )
    }
}
export default Desktop;
