import React, { useState } from 'react';
import Window from '../components/Window';
import Vfs from './VFS';

class Finder extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            info:           "finder",
            fs_type:        props.fs_type || "chrome",
            dirs:           [], 
            files:          props.files   || [], 
            previewURL:     null,
            previewText:    null 
        }
        this.vfs = Vfs(props.fs_type);
    }


    componentDidMount=async ()=>{
        this.getFiles();
    }

    getFiles = async ()=>{
        let dirpath = this.state.dirs.join("/");
        let files = await this.vfs.get_files(dirpath);
        this.setState({files: files});
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
            return(<div style={previewStyle}>
                <img width="80" src={this.state.previewURL}></img>
            </div>)
        }else if(this.state.previewText!==null){
            return (
                <div style={previewStyle}>
                    <textarea>{this.state.previewText}</textarea>
                </div>
            )
        }

    }
    clickedFile=async (file)=>{
       var preview_content = await this.vfs.file_get_content(file.name);
       if(preview_content.type==='text'){
           this.setState({previewText: preview_content.payload})
       }else if(preview_content.type==='image'){
            this.setState({previewURL:preview_content.payload});
       }
    }

    clickedDir = async(dirname)=>{
       let new_dirs =this.state.dirs.concat(dirname);
       this.setState({dirs:new_dirs},()=>{
           this.getFiles();
       })
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
            {this.state.fs_type}:
            {this.state.dirs.map(dir=>{
               return (<a>{dir+"/"}</a>)
            })}
            </span>
        )
    }
    renderBody = () =>{
        const files = this.state.files || [];
        const bodyStyle={
            position:"absolute",
            top: "20px",
            height: "calc(100% - 20px)",
            left: 0,
            width:"50%",
            overflow:"scroll"
        }

        return (
            <div class='file_list' style={bodyStyle}>
                {files.map( (file,i) =>{
                  var rowStyle = {
                      marginLeft:"20px",
                      width: "calc(100% - 40px)",
                      backgroundColor: i % 0 ===0 ? "grey" : "white",
                      height:"20px"
                  }
                  return (
                      <div style={rowStyle} onClick={()=>{
                        if(!file.isDirectory){
                            this.clickedFile(file)
                        }else{
                            this.clickedDir(file.name);
                        }
                      }}>
                          <span>{file.name}</span>
                          <span style={{float:"right"}}>{file.isDirectory ? "dir" : "file"}</span>
                     </div>
                  )
              })}
            </div>
        )
    }
    render() {
      return (
      <Window icon='computer' title='My Computer' windowInfo={this.state.xpath}>
          <div className="anchor">
              {this.renderBreadCrumb()}
              {this.renderBody()}
              {this.renderPreview()}
          </div>
      </Window>)
    }
}
export default Finder;
