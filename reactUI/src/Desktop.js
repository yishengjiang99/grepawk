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
import SearchBar from "./SearchBar"
import API from "./APICalls";
import Composer from "./FileExplorer/Composer"


class Desktop extends React.Component{
    state={
        processes: [],
        // processes:[{name:"tty", state:"on"}],
        userInfo:{name:"guest",xp:0,gold:0},
        quests:[],
        icons:[
            {name:"folder",     title:"Local Files",     cmd:"finder", args:["chrome"]},
            {name:"folder",     title:"Public Files",     cmd:"finder", args:["azure"]},
            {name:"folder",     title:"Content Market",    cmd:"finder", args:["market"]},
            // {name:"folder",     title:"Dropbox Files",    cmd:"finder", args:["dropbox"]},
            // {name:"folder",     title:"Facebook Files",    cmd:"finder", args:["fb"]},
            {name:"terminal",   title:"terminal",cmd:"tty", args:[]},
            {name:"broadcast-tower", title:"Broadcast", cmd:"stream",   args:[]},
            // {name:"play-circle", title:"Watch Hearthstone", cmd:"watch", args:["r5rogue"]},
            {name:"shipping-fast",title:"Write Javascript", cmd:"compose", args:['javascript']}
          ]
    }
    constructor(props){
        super(props);
        this.ipc = this.ipc.bind(this);
    }

    componentDidMount(){
        if(window.location.pathname!=='/'){
            var xpath = window.location.pathname.split("/").splice(1);
            if(xpath.length===1){
                this.ipc("watch", xpath);
            }else if(xpath.length==2){
                this.ipc(xpath[0], xpath.splice(1));
            }   
        }
        else if(window.location.search){
            var t = window.location.search.replace("?","").split("/");
            const cmd = t[0];
            const args = t.splice(1);
            this.ipc(cmd, args);
        }else{
            this.ipc("tty",[]);
        }
        const uuid = API.getUUID();
        API.api_get_json("/checkin?uuid="+uuid).then(_userInfo=>{
            this.setState({userInfo:_userInfo});
        }).catch(err=>{
            alert("check in failed");
        })
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
                        <Terminal key='tty1' pid={pid} title='Telnet' ipc={this.ipc}/>
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
                    var type = proc.args[0] || "";
                    return (
                        <Finder userInfo={this.state.userInfo} ipc={this.ipc} title="Finder" fs_type={type}  ipc={this.ipc}></Finder>
                    )
                }else if(proc.name==="compose"){
                    return(
                        <Composer userInfo={this.state.userInfo} title='write code' ipc={this.ipc}></Composer>
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
    renderSearchBar=()=>{
        return (<SearchBar></SearchBar>)
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
                <nav style={{width:"100vw",height:"18px"}} className='navbar navbar-light bg-light'>
                    <a className="navbar-brand" href="#">GrepAwk</a>

                    <ul className="navbar-nav">
                    <li className="nav-item">
                         <a className="nav-link btn" href="#">Compose</a>
                    </li>
                    </ul>
                    {this.renderHud()}
                </nav>
                <div style={{top:"0", position:"absolute", width:"100vw", height:"calc(100% - 18px)"}} >
                    {this.renderBackground()}
                    {this.renderBody()}
                    {this.renderQuestView()}
                    {this.renderSearchBar()}
                </div>

                
            </div>
        )
    }
}
export default Desktop;
