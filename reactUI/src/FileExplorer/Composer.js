import React from 'react';
import Modal from '../components/Modal';
import AceEditor from 'react-ace';

const editorStyle={
    width:"800px",
    height:"80%",
    top: "5vh",
    left:"10vw",
    backgroundColor:"white",
    color:"black",
    position: "fixed",
    display:"block"    
}
class Composer extends React.Component{
    constructor(props){
        super(props);

    }
    onSave=()=>{
        alert(this.props.value);
        if(this.props.vfs){
            let result = this.props.vfs.file_put_content(this.props.path, this.props.value);
            alert(result);
        }
    }
    render(){
        return(
            <Modal style={editorStyle}
                onClose={this.props.onClose}
                title={this.props.name}
                onSave={this.onSave}
            >
                <AceEditor
                    width={700}
                    mode={this.props.mode}
                    theme="github"
                    value={this.props.value}
                    onChange={this.props.onChange}
                    name={this.props.title} 
                />
            </Modal> 
        )
    }
}
export default Composer;