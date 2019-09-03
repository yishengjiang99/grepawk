import React from 'react'
import './App.css'
import Terminal from './Terminal'
import HUD from "./HUD";
import ListView from "./components/ListView"
import Camera from "./Camera"
import Broadcast from "./Broadcast/Broadcast"
import Watch from "./Broadcast/Watch"
import UIWebView from "./components/UIWebView"

import AppIconGrid from './AppIconGrid';
import Finder from "./FileExplorer/Finder";

class Desktop extends React.Component{
    state={
        processes:[{name:"tty", state:"on"}],
        userInfo:{name:"guest",xp:0,gold:0},
        quests:[],
        icons:[
            {name:"linode",title:"My Comuter",cmd:"finder", args:[]},
            {name:"terminal",title:"terminal",cmd:"tty", args:[]},
            {name:"broadcast-tower",title:"Broadcast", cmd:"stream", args:[]},
            {name:"play-circle",title:"Watch Hearthstone", cmd:"watch", args:["rank_5_rogue"]},
            {name:"editor",title:"Word(sic)"}
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
        console.log("desktop ipc ",cmd,args);
       switch(cmd){
  
            case "close":
                const pid = args[0];
                const list = this.state.processes;
                list[pid]="closed";
                this.setState({processes:list});
                break;
            case 'edit':
                var plist = this.state.processes.concat({"name":"iframe",
                        url:"/api/files/edit?url="+args[0]+"&context="+args[1]});
                this.setState({processes:plist});
                break;
            case "cam":
            case "camera":
            case "broadcast":
            case "stream":
            case "watch":
            case "tty":
            case "compose":
            case "finder":
                var plist = this.state.processes.concat({"name":cmd,"args":args});
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
                }else if(proc.name==="iframe"){
                    return (
                        <iframe width="90%" height="80%" src={proc.url}></iframe>
                    )
                }else if(proc.name==='finder'){
                    var xpath = proc.args[0] || "/";
                    return (
                        <Finder xpath={xpath}></Finder>
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
                <div style={{top:"", position:"relative", width:"100%", height:"100%"}} >
                    {this.renderBackground()}
                    {this.renderBody()}
                    {this.renderQuestView()}

                </div>

                
            </div>
        )
    }
}
export default Desktop;
