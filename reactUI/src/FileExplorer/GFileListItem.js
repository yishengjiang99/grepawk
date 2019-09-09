import React from 'react';

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
        const modStr =  this.state.fileMetaDescriptor.modificationTime || "";
        const typeStr = this.state.fileMetaDescriptor.type || file.isDirectory ? "dir" : "file";
        var rowStyle = {
            marginLeft:"20px",
            width: "calc(100% - 40px)",
            color: "#D7D7D7",
            backgroundColor: rowIndex % 2 ===0 ? "#2A2A2A" : "#242424",
            height:"50px"
        }
        var spanStyle={
            marginLeft:"5px",
           width: "100px"
        }

        return (
            <div style={rowStyle} onClick={()=>{
                if(!file.isDirectory){
                    this.props.clickedFile(file)
                }else{
                    this.props.clickedDir(file);
                }
              }}>
                <div>
                    <span style={spanStyle}>{file.name}</span>
                    <span style={spanStyle}>{sizeStr}</span>
                    <span style={spanStyle}>{modStr}</span>
                    <span style={spanStyle}>{typeStr}</span>
                </div>
                <div>
                    
                </div>
           </div>

        )
    }
}
export default GFileListItem;