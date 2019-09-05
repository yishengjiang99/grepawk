import React, { useState } from 'react';
import Window from '../components/Window';
import Vfs from './VFS';
import "./Finder.css"
class Finder extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            info:           "finder",
            dirs:           props.dirs    || [], 
            current_node_id: props.current_node_id || 0, 
            fs_type:        props.fs_type || "chrome",
            files:          props.files   || [], 
            edges:          props.edges   || [],
            previewURL:     null,
            previewText:    null ,
            previewFile: null 
        }
        this.vfs = Vfs(props.fs_type);
    }


    componentDidMount=async ()=>{
        this.getFiles();
    }

    getFiles = async ()=>{
        let dirpath = this.state.dirs.join("/");
        let files, edges;
        [files, edges] = await this.vfs.get_files(dirpath) || [];
        this.setState({files: files, edges: edges});
    }

    add_file=async ()=>{
        var filename = prompt("Enter file name");
        var content = prompt("Enter file content");
        let dirs = this.state.dirs.concat(filename);
        let full_path  = dirs.join("/");
        await this.vfs.file_put_content(full_path, content, true);
        this.getFiles();
    }

    upload_to_vfs =async (event)=>{
        try{
            let uploadFiles = event.target.files.map(f=>{
                let fstack = this.state.dirs.push(f.name);
                f.name = fstack.join("/");
                return f;
            })
            await this.vfs.upload_files(uploadFiles);
            this.vfs.get_files();
        }catch(e){
            alert(e.message);
        }
    }
    renderPreview = ()=>{
        const previewStyle={
            position:"absolute",
            left: "50%",
            top: 0,
            height: "100%",
            width: "49%",
            backgroundColor:"white"
        }

        if(this.state.previewURL!==null){
            return(
            <div style={previewStyle}>
                <img height="50%" width="100%" src={this.state.previewURL}></img>
                {this.renderFileInfo(this.state.previewFile)}
            </div>)
        }else if(this.state.previewText!==null){
            return (
                <div style={previewStyle}>
                    <div height="50%" widht="100%">{this.state.previewText}</div>
                    {this.renderFileInfo(this.state.previewFile)}
                </div>
            )
        }

    }
    renderFileInfo = (file) =>{
        if(!file) return  ("");
        return (
            <div>
                <p>Size: {file.size}</p>
                <p>Type: {file.type}</p>
                {/* <p>Last Modified: {file.lastModifiedDate}</p> */}
            </div>
        )
    }
    clickedFile=async (file)=>{
        try{
            var preview_content = await this.vfs.file_get_content(file.fullPath);
            if(preview_content.type==='text'){
                this.setState({
                    previewURL: null,
                    previewText:preview_content.payload, 
                    previewFile:preview_content.file})
            }else if(preview_content.type==='image'){
                 this.setState({
                     previewText: null, 
                     previewURL:preview_content.payload,  
                     previewFile:preview_content.file
                    });
            }
        }catch(e){
            alert(e.message);
        }

    }

    clickedDir = async(dir)=>{
       let new_dirs =this.state.dirs.concat(dir);
       this.setState({dirs:new_dirs, current_node_id:dir.id});
    }
    backDir = (dirId) =>{
        if(dirId===0){
            this.setState({
                dirs:[], 
                current_node_id:0
            });
            return;
        }

        let new_dirs = [];
        let i;
        for(i in  this.state.dirs){
            new_dirs.push(this.state.dirs[i]);
            if(dirId == this.state.dirs[i].id){
                break;
            }
        }
        this.setState({
            dirs:new_dirs, 
            current_node_id:dirId
        });
    }
    renderBreadCrumb=()=>{
        const headerStyle={
            position:"absolute",
            top:0,
            left:0,
            height:"20px",
            width:"100%",
        }
        return(
            <span style={headerStyle}>
            <a onClick={()=>{
               this.backDir(0)
            }}>{this.state.fs_type+" >"}</a>

            {this.state.dirs.map(dir=>{
               return (<a onClick={()=>{
                   this.backDir(dir.id)
               }}>{dir.name+" >"}</a>)
            })}
            </span>
        )
    }
    renderBody2 = ()=>{
       let files_displayed=[];
       const _edges = this.state.edges[this.state.current_node_id] || [];
       const _files = this.state.files || [];
       _edges.forEach((node_id)=>{
        files_displayed.push(_files[node_id])
       })

       if(files_displayed.length==0){
        return (
            <div>No Files</div>
        )
       }else{
        const bodyStyle={
            position:"absolute",
            top: "20px",
            height: "calc(100% - 60px)",
            left: 0,
            width:"47%",
            overflow:"scroll",
            paddingLeft:"2%",
            backgroundColor:"#2A2A2A"
        }
        const ctrlStyle={
            position:"absolute",
            bottom: "0px",
            height: "40px",
            width: "100%",
            left: 0,
            float: "right"
        }
        return (
            <div className='anchor' style={{position:"relative"}}>
                <div className='file_list' style={bodyStyle}>
                    {files_displayed.map((file,i) =>{
                      var rowStyle = {
                          marginLeft:"20px",
                          width: "calc(100% - 40px)",
                          color: "#D7D7D7",
                          backgroundColor: i % 2 ===0 ? "#2A2A2A" : "#242424",
                          height:"20px"
                      }
                      return (
                          <div style={rowStyle} onClick={()=>{
                            if(!file.isDirectory){
                                this.clickedFile(file)
                            }else{
                                this.clickedDir(file);
                            }
                          }}>
                              <span>{file.name}</span>
                              <span style={{float:"right"}}>{file.isDirectory ? "dir" : "file"}</span>
                         </div>
                      )
                  })}
                </div>
                <div className='Controls' style={ctrlStyle}>
                    <button className='btn' onClick={this.add_file}>Compose</button>
                    {'\u00A0'}{'\u00A0'}
                    <button className='btn' onClick={this.upload_to_vfs}>Upload</button>
                </div>
             </div>

        )
       }
    }
    render() {
      return (
      <Window icon='computer' title='My Computer' windowInfo={this.state.xpath}>
          <div className="anchor">
              {this.renderBreadCrumb()}
              {this.renderBody2()}
              {this.renderPreview()}
          </div>
      </Window>)
    }
}
export default Finder;
