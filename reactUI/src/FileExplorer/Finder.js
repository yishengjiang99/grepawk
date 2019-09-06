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
        let files, edges;
        [files, edges] = await this.vfs.get_files() || [[],[]];
        this.setState({files: files, edges: edges});
    }

    get_full_path = (basename)=>{
        return this.state.dirs.map(d=>d.name).concat(basename).join("/");
    }
    add_file=async ()=>{
        var filename = prompt("Enter file name");
        var content = prompt("Enter file content");
        let full_path  = this.get_full_path(filename);
        await this.vfs.file_put_content(full_path, content, true);
        this.getFiles();
    }

    upload_to_vfs =async (event)=>{
        try{
            var _files = event.target.files || [];
            if(_files.length<1) return;
            var uploads=[];
            for(let i =0; i<_files.length; i++){
                var item = _files.item(i);
                item.fullPath = this.get_full_path(item.name);
                uploads.push(item);
            }
            await this.vfs.upload_files(uploads);
            this.getFiles();
        }catch(e){
            alert(e.message);
        }
    }
    prompt_array = (questions)=>{
        var anwsers=[];
        questions.forEach((q,idx)=>{
            anwsers.push(prompt("question: "+q));            
        })
        return anwsers;
    }
    renderPreview = ()=>{
        const previewStyle={
            position:"absolute",
            left: "55%",
            top: 0,
            height: "70%",
            width: "40%",
            backgroundColor:"transparent"
        }
        const file = this.state.previewFile;
        if(!file) return null;

        return (
            <table style={previewStyle}>            
                <tr>
                    <td colspan={4}>
                        {this.renderPreviewContent()}
                    </td>
                </tr>     
                <tr>
                    <td colspan={4}>
                        <p>Size: {file.size}</p>
                        <p>Type: {file.type}</p>
                    </td>
                </tr>  
                <tr>
                    <td colspan={2}>
                        <button class='btn btn-primary' onClick={(e)=>{
                            var answers = this.prompt_array(['category','price']);
                            Vfs.api_post_json("/files/publish", answers).then(response=>{
                                var text = response.responseText || JSON.stringify(response);
                                alert(text);
                            }).catch((err)=>
                            { 
                                alert(err.message);
                            })
                        }}> Publish </button>
                    </td>
                    <td colspan={2}>
                        <button class='btn btn-primary'>Share</button>
                    </td>
                </tr>                 
            </table>
        )
    }

    renderPreviewContent = () =>{
        if(this.state.previewURL!==null){
            return(<img height="50%" width="100%" src={this.state.previewURL}></img>);
        }else if(this.state.previewText!==null){
            return (<div height="50%" widht="100%">{this.state.previewText}</div>);
        }

    }
    renderFileInfo = (file) =>{
        if(!file) return  ("");
        return (
            <table>
                <tr>
                    <td colspan={4}>
                        <p>Size: {file.size}</p>
                        <p>Type: {file.type}</p>
                    </td>
                </tr>

               
            </table>
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


        const bodyStyle={
            position:"absolute",
            top: "20px",
            height: "calc(100% - 60px)",
            left: 0,
            color:"#D7D7D7",
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
                    {files_displayed.length===0 ? (<div>NO Files</div>) 
                    : files_displayed.map((file,i) =>{
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
                    <input type='file' multiple 
                        className='btn'
                         onChange={this.upload_to_vfs} />
                </div>
             </div>

        )
       
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
