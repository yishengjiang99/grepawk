import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import "./AppIconGrid.css"

const icons_per_column = 5;


class AppIconGrid extends React.Component{
    constructor(props){
        super(props);
        this.iconClicked = this.iconClicked.bind(this);
    }

    iconClicked(idx){
        var icon = this.props.icons[idx];
        this.props.ipc(icon.cmd, icon.args);
    }
    render(){
        return(
            <div className='app-icon-grid'>
                {this.props.icons.map((icon,index)=>{
                    const row = index  % icons_per_column;
                    const col = Math.floor(index / icons_per_column);
                    const iconStyle ={
                        gridColumnStart:col,
                        gridColumnEnd: col+1,
                        gridRowStart:row,
                        gridRowEnd:row+1,
                        width:50,
                        height:50,
                        borderColor:"black",
                        borderWidth:2
                       // backgroundColor:"#D3D3D3"
                    }
             
                    return (
                        <div key={"icon"+index} 
                            style={iconStyle} 
                            onClick={()=>{
                                this.iconClicked(index);
                            }}
                        >
                            <i className={"fas fa-lg fa-"+icon.name}></i><br></br>{icon.title}
                        </div>
                        )
                })}

            </div>
        )
    }

}


export default AppIconGrid;