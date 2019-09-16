import React from 'react';
import Modal from '../components/Modal';
import AceEditor from 'react-ace';
import Window from '../components/Window';
import SearchBar from "../SearchBar";

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
            icon='computer' title='Compose Stream/Video'>
                <SearchBar 
                    autoFocus={false}
                    verbSuggestions={['radio', 'scan', 'gif', 'clip', 'mime', 'ppt']}
                    additionalSuggestionGraph={"http://localhost/api/autocomplete"}
                    searchBarStyle={{
                                position: 'absolute',
                                left: "10%",
                                width:"80%",
                                top:"15%"

                            }}
                    placeholderText={"Compose tracks"}
                    searchBarStyleTyping={{
                        position: 'absolute',
                        left: "10%",
                        width:"80%",
                        top:"15%"
                    }}                
                ></SearchBar>
            </Window> 
        )
    }
}
export default Composer;