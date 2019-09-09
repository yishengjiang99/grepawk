import React from 'react';

class GFileListItem extends React.Component{

    constructor(props){
        super(props);
        this.state={
            fileMetaDescriptor: ""
        }
    }

    render(){
        const rowIndex = this.props.rowIndex;
        const file = this.props.file;
        const desc = this.state.fileMetaDescriptor;

        var rowStyle = {
            marginLeft:"20px",
            width: "calc(100% - 40px)",
            color: "#D7D7D7",
            backgroundColor: rowIndex % 2 ===0 ? "#2A2A2A" : "#242424",
            height:"20px"
        }
        return (

            <div style={rowStyle} onClick={()=>{
                if(!file.isDirectory){
                    this.props.clickedFile(file)
                }else{
                    this.props.clickedDir(file);
                }
              }}>
                  <span>{file.name}</span>                 
                  <span style={{float:"right"}}>{file.isDirectory ? "dir" : "file"}</span>
                  <p>{desc}</p>
             </div>
        )
    }
}
export default GFileListItem;