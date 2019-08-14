import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import "./AppIconGrid.css"

const icons_per_column = 5;


class AppIconGrid extends React.Component{
    render(){
        return(
            <div className='app-icon-grid'>
                {this.props.icons.map((icon,index)=>{
                    const row = (index+1) % icons_per_column;
                    const col = Math.floor((index+1) / icons_per_column);
                    const iconStyle ={
                        gridColumnStart:col,
                        gridColumnEnd: col+1,
                        gridRowStart:row,
                        gridRowEnd:row+1,
                        width:50,
                        height:50
                       // backgroundColor:"#D3D3D3"
                    }
             
                    return (<div style={iconStyle}><i className={"fas fa-lg fa-"+icon.name}></i><br></br>{icon.title}</div>)
                })}

            </div>
        )
    }

}


export default AppIconGrid;