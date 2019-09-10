import React from 'react';

import Moment from 'react-moment';

class GFileListItem extends React.Component{

    constructor(props){
        super(props);
        this.state={
            fileMetaDescriptor: {},
        }
        this.fetchingMeta = false;
    }

    componentDidMount=()=>{
        if(this.props.vfs && this.fetchingMeta===false){
            this.fetchingMeta = true;
            var that = this;
            this.props.vfs.file_get_meta(this.props.file.fullPath, function(meta){
                if(meta!==null && meta!== that.state.fileMetaDescriptor){
                    that.setState({fileMetaDescriptor: meta});
                }
                that.fetchingMeta = false;
            });
        }
    }

    render(){
        const rowIndex = this.props.rowIndex;
        const file = this.props.file;
        const sizeStr = this.state.fileMetaDescriptor.size || "0";
        const typeStr = this.state.fileMetaDescriptor.type || file.isDirectory ? "dir" : "file";
        var rowStyle = {
            paddingLeft:"5px",
            color: "#D7D7D7",
            backgroundColor: rowIndex % 2 ===0 ? "#2A2A2A" : "#242424",
            height:"50px",
            position:"relative"
        }
        var spanOne={
            position:"absolute",
            top: 2,
            left: 2,
            width: 20,
            height: 48
        }
        var spanTwo={
            position:"absolute",
            top: 2,
            left: 25,
            width: 100,
            height: 48
        }
        var spanThree={
            position:"absolute",
            top: 2,
            left: 170,
            width: 200,
            height: 48
        }
        var spanFour={
            position:"absolute",
            top: 2,
            right: 5,
            width: 100,
            height: 48
        }


        const faName = file.isDirectory === true ? "fa-folder" : "fa-file";
        return (
            <div style={rowStyle} onClick={()=>{
                if(!file.isDirectory){
                    this.props.clickedFile(file)
                }else{
                    this.props.clickedDir(file);
                }
              }}>
                  <div>
                    <span style={spanOne}>
                        <i className={"fas fa-lg "+faName}> </i>  
                   </span>
                   <span style={spanTwo}>{file.name}</span>
                    <span style={spanThree}>{sizeStr}byte</span>
                    <span style={spanFour}>
                        {this.state.fileMetaDescriptor.modificationTime ? 
                            <Moment
                                format="YYYY/MM/DD" 
                                date={this.state.fileMetaDescriptor.modificationTime}
                            />
                            :null}
                    </span>
                </div>
                <div>
                    
                </div>
           </div>

        )
    }
}
export default GFileListItem;