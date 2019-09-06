import React from 'react'
import ListView from '../components/ListView';

class GFileSelector extends React.Component{
    constructor(props){
        super(props);
        this.state={
            files_selected: [],
            status: "new"
        }
    }
    componentDidMount=()=>{

    }
    renderFileSelectedList=()=>{
        return (
            <ListView headers={['name','size','type']} rows={this.state.files_selected}>
            </ListView>
        )
    }
    renderControlPanel=()=>{
        return this.state.status==='new' ?
        (
            <div className='ctrl-panel'>
                <button className='btn btn-secondary' onClick={this.onCancel}>Cancel</button>
                <button className='btn btn-primary' onClick={this.onSave}> Save</button>
            </div>
        ) : (
            <div></div>
        )  
    }
    onFileChange=(e)=>{

    }
    onSave =(e)=>{
        
    }
    onCancel=(e)=>{
        alert("cancel");
    }

    render(){
        return(
            <div className='anchor'>
                <input type="file" 
                    className="form-control" 
                    id="file-select-input" 
                    name="file"
                    onChange={this.props.onFilesChange || this.onFileChange} />
            {this.renderFileSelectedList()}
            {this.renderControlPanel()}
        </div>
        )
    }
}
export default GFileSelector;