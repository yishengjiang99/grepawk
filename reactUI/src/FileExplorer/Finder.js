import React, { useState } from 'react';
import Window from '../components/Window';
import Vfs from './VFS';
import GFileListItem from './GFileListItem';
import "./Finder.css";
import Modal from "../components/Modal";
import AceEditor from 'react-ace';

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
            previewURL:         null,
            previewText:        null,
            previewFile:        null,
            fileBeingPublished: null,
            isUploadingFiles:   false,
            isPublishing:       false, 
            isComposing:        false,
            composingContent:   null
        }
        this.vfs = Vfs(props.fs_type);
        this.composer = React.createRef();
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
        this.setState({
            isComposing: true,
            composingTitle: this.get_full_path(filename),
            composingContent: this.state.composingContent || ""
        })
        
        // let full_path  = this.get_full_path(filename);
        // await this.vfs.file_put_content(full_path, content, true);
        // this.getFiles();
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
                            this.setState({isPublishing:true, fileBeingPublished:file});
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
            return(<img width="80%" height="auto" src={this.state.previewURL}></img>);
        }else if(this.state.previewText!==null){
            return (<div height="50%" width="100%">{this.state.previewText}</div>);
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
            preview_content.type =  preview_content.type || "text";            
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
            alert(e.lineNumber+":"+e.message);
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
               return false;
            }}>{this.state.fs_type+" >"}</a>

            {this.state.dirs.map(dir=>{
               return (<a onClick={()=>{
                   this.backDir(dir.id)
                   return false;
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
            <div>
                <div className='file_list' style={bodyStyle}>
                    {files_displayed.length===0 ? (<div>NO Files</div>) 
                    : files_displayed.map((file,i) =>{
                      return (
                        <GFileListItem 
                            vfs = {this.vfs}
                            rowIndex={i}
                            file={file} 
                            clickedDir={this.clickedDir}
                            clickedFile={this.clickedFile}
                        />
                    )
                  })}
                </div>
                <div className='Controls' style={ctrlStyle}>
                    <button className='btn' onClick={this.add_file}>Compose</button>
                    {'\u00A0'}{'\u00A0'}
                    {this.state.isUploadingFiles == true ? (
                         <input type='file' multiple 
                         className='btn'
                          onChange={this.upload_to_vfs} />
                    ) : (<button className='btn' onClick={()=>{
                        this.setState({isUploadingFiles:true});
                    }}>Upload</button>)}
                   
                </div>
             </div>
        )
    }
    publishFile=(responses)=>{
       
        Vfs.api_post_json("/listing",{
            uuid: this.props.userInfo.uuid,
            title: responses.title,
            price: responses.price,
            tags: responses.tags.split(",")
        }).then(resp=>{
            if(resp.status==='OK'){
                alert("Posting Successful");
            }
            this.setState({isPublishing:false});
        }).catch(err=>{
           alert(err.message);
           this.setState({isPublishing:false});
        })
    }
    render() {
        const editorStyle={
            width:"80vw",
            height:"90vh",
            top: "5vh",
            left:"10vw",
            backgroundColor:"black",
            color:"white",
            position: "fixed",
            display:"block"    
        }
      return (
      <Window width={1000} height={500} left={220} ipc={this.props.ipc} icon='computer' title='My Computer'>
          <div className="anchor">
              {this.renderBreadCrumb()}
              {this.renderBody2()}
              {this.renderPreview()}
          </div>
          {this.state.isPublishing ? 
            (<Modal 
                onSubmit={this.publishFile}
                onClose={()=>{this.setState({isPublishing:false})}}
                questions={['title', 'price', 'tags']}
                initialAnswers={{
                    'title': this.state.fileBeingPublished.name,
                    'price': 10, 
                    'tags': "newFile"
                }}
                questionTypes = {['string', 'numeric', 'array']}
                title='Publish Content' />) 
          : null}

          {this.state.isComposing !== false ? 
            (
                <Modal
                    style={editorStyle}
                    onClose={()=>{this.setState({isComposing:false})}}
                    title={this.state.composingTitle}
                >
                    <AceEditor
                    mode="javascript"
                    theme="github"
                    value={this.state.composingContent || ""}
                    onChange={content=>this.setState({composingContent: content})}
                    name={this.state.composingTitle}
                    editorProps={{$blockScrolling: true}}
                  />
                </Modal>
            ) 
          : null}

      </Window>)
    }
}
export default Finder;
