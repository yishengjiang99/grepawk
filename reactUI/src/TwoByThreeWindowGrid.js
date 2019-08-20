import React from 'react'
import { relative } from 'path';



class TwoByThreeWindowGrid extends React.Component{
    render(){
        const appWindowGridStyle={
            display:"grid",
            gridGap: "50% 50%",
            width:"100%",
            height:"100%"
        }
        const procs = this.props.processes || [];
        return(
            <div style={appWindowGridStyle}>
            {
                procs.map((proc,pid)=>{
                    const row = Math.floor(pid/2);
                    const col = pid-row;
                    const windowStyle={
                        gridColumnStart:col,
                        gridColumnEnd: col+1,
                        gridRowStart:row,
                        gridRowEnd:row+1,
                        width: "49%",
                        height: "49%",
                        position:"relative",
                        backgroundColor:"reds"
                    }
                    return(
                        <div style={windowStyle}>
                            {this.props.renderProc(pid)}
                        </div>
                    )
                })
            }
            </div>
        )
    }
}
export default TwoByThreeWindowGrid;