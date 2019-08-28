import React from 'react'
import './App.css'
import Terminal from './Terminal'
import HUD from "./HUD";
import ListView from "./components/ListView"
import Camera from "./Camera"
import Broadcast from "./Broadcast/Broadcast"
import Watch from "./Broadcast/Watch"

import AppIconGrid from './AppIconGrid';

class Desktop extends React.Component{
    state={
        processes:[{name:"tty", state:"on"}],
        userInfo:{name:"guest",xp:0,gold:0},
        quests:[],
        icons:[
            {name:"terminal",title:"terminal",cmd:"tty", args:[]},
            {name:"broadcast-tower",title:"Broadcast", cmd:"stream", args:[]},
            {name:"play-circle",title:"Watch Hearthstone", cmd:"watch", args:["rank_5_rogue"]},
            {name:"play-circle",title:"Watch WoW", cmd:"watch", args:["asmongold"]}
          ]
    }
    constructor(props){
        super(props);
        this.ipc = this.ipc.bind(this);
    }

    componentDidMount(){
        if(window.location.search){
            var t = window.location.search.replace("?","").split("/");
            const cmd = t[0];
            const args = t.splice(1);
            this.ipc(cmd, args);
        }
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
            case "broadcast":
            case "stream":
                var plist = this.state.processes.concat({"name":"stream","args":args});
                this.setState({processes:plist});
                break; 
            case "watch":
                var plist = this.state.processes.concat({"name":"watch","args":args});
                this.setState({processes:plist});
                break;
            case "tty":
                var plist = this.state.processes.concat({"name":"tty","args":args});
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
                        <Terminal key='tty1' pid={pid} title='tty' ipc={this.ipc}/>
                    );
                }else if(proc.name==='camera'){
                    return (
                        <Camera userInfo={this.state.userInfo} pid={pid} title='Face 2 Face' ipc={this.ipc} />
                    );
                }else if(proc.name==="stream"){
                    return (
                        <Broadcast args={proc.args} channel={proc.args[0] || ""} pid={pid} title="Broadcast" ipc={this.ipc} />
                    )
                }
                else if(proc.name==="watch"){
                    var channelName = proc.args[0] || "default";
                    return (
                        <Watch userInfo={this.state.userInfo} channelName={channelName} pid={pid} title="Watch" ipc={this.ipc} />
                    )
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
            <AppIconGrid icons={this.state.icons} ipc={this.ipc}></AppIconGrid>
        )
    }
    render(){
        return (
            <div className='desktop'>
                <nav className='navbar navbar-light bg-light'>
                    <a className="navbar-brand" href="#">GrepAwk</a>
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
