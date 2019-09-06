import React from 'react'
import ListView from './ListView';

class FileSelector extends React.Component{
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
            <ListView headers={['name','size','type']}rows={this.state.files_selected}>
            </ListView>
        )
    }
    renderControlPanel=()=>{
        return this.state.status==='new' ?
        (
            <div className='ctrl-panel'>
                <button className='btn btn-secondary' onClick={this.props.onCancel}>Cancel</button>
                <button className='btn btn-secondary' onClick={this.props.onSave}> Save</button>
            </div>
        ) : (
            <div></div>
        )  
    }
    render(){
        <div className='anchor'>
            <input type="file" className="form-control" id="file-select-input" name="file"></input>
            {this.renderFileSelectedList()}
            {this.renderControlPanel()}
        </div>
    }
}
export default FileSelector;