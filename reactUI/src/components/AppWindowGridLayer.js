import React from 'react'
import "./AppIconGrid.css"

const icons_per_column = 5;

class AppIconGrid extends React.Component{
    constructor(props){
        super(props);
        this.iconClicked = this.iconClicked.bind(this);
    }

    iconClicked(idx){
        var icon = this.props.proccesses[idx];
        this.props.ipc(icon.cmd, icon.args);
    }
    render(){
        return(
            <div className='app-icon-grid'>
                {this.props.proccesses.map((process,index)=>{
                    const row = (index) % icons_per_column;
                    const col = Math.floor((index) / icons_per_column);
                    const iconStyle ={
                        gridColumnStart:col,
                        gridColumnEnd: col+1,
                        gridRowStart:row-1,
                        gridRowEnd:row,
                        width:50,
                        height:50,
                        borderColor:"black",
                        borderWidth:2
                       // backgroundColor:"#D3D3D3"
                    }
                    const fa_icon = process.fa_icon || "icon";
                    return (
                        <div key={"process-icon-"+index} 
                            style={iconStyle} 
                            onClick={()=>{
                                this.iconClicked(index);
                            }}
                        >
                            <i className={"fas fa-lg fa-"+fa_icon}></i>{process.title}
                        </div>
                        )
                })}

            </div>
        )
    }

}


export default AppIconGrid;