import React from 'react';
import Modal from '../components/Modal';
import AceEditor from 'react-ace';
import Window from '../components/Window';
import SearchBar from "../SearchBar";

class Composer extends React.Component{
    constructor(props){
        super(props);
        this.editor = React.createRef();
        //this.focusEditor = ()=>this.editor.props.onFocus();

    }
    componentDidMount(){
       // this.focusEditor();
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
            <Window width={1000} height={600} left={220} 
            ipc={this.props.ipc} 
            icon='computer' title={this.props.title}>

            </Window> 
        )
    }
}
export default Composer;