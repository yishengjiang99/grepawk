import React from "react";


const phase_graph={
    "root":["screenschare","webcam","audio","radio","canvas","spreadsheet", "search", "wiki"],
    "screenshare|webcam|audio":["on", "off"],
    "radio": ["%quary%"],
    "canvas": ["image","text", "pen","rectangle", "circle"],
    "search": ["image","video","pdf","livestreams"],
    "wiki": ["propmpt:term"],

}


class Composer extends React.Component{
    // state={
    //     phase: "root",
    //     cmd:null,
    //     args:null
    // }
    constructor(props){
        super(props);
        this.state={
            phase: props.phase || "root"
        }
    }

    static getDerivedStateFromProps(nextProps, prevState){
        debugger;
        
        if(prevState.phase !== nextProps.phase){
            return ({phase : nextProps.phase});
        }else if(nextProps.phase==="1"){
            alert("hi");
        }
    }

    renderOptions=()=>{
        let path = phase_graph[this.state.phase];
        return (
            <div className='container'>
                {
                    path.map((p,idx)=>{
                        return (
                            <div className="row justify-content-left">
                                <div className='md-col-3'></div>
                                <div className='md-col-6'> {idx}. {p}</div>
                            </div>
                        )
                    })
                }
            </div>
        )

    }
    render(){
        return (
            <div style={this.props.style||{display:"block"}}>
                {this.props.title || "Compose"}
                {this.renderOptions()}
            </div>
        )
    }
    
}
export default Composer