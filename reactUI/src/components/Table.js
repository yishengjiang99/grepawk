import React from 'react';
var HtmlToReactParser = require('html-to-react').Parser;

class Table extends React.Component{
    constructor(props){
        super(props);
    }
    renderHeaders=()=>{
        if(!this.props.headers) return null;
        return (
            <thead>
                <tr key={'tbtrh1'}>    
                {this.props.headers.map((header,i)=>{
                    return (<th key={"th"+i}>{header}</th>)
                })}
                </tr>
            
            </thead>
        )
    }

    renderLink=(cmd, desc)=>{
        return (
            <span ref={React.createRef()}
                className='terminal-link' 
                onClick={()=>{this.props.clickedCmd(cmd)}}>
                {desc}
            </span>
        )
    }
    renderBody=()=>{
        if(!this.props.rows) return null;
        return (
            <tbody>
            {this.props.rows.map((row)=>{
                return this.renderTableRow(row);
             })}
            </tbody>
        )
    }

    render(){
        return(
        <table className={this.props.className || "table"} border="1">
            {this.renderHeaders()}
            {this.renderBody()}
        </table>
        )
    }
    renderTableRow=(row)=>{
        return (
            <tr>{
                this.props.headers.map((header)=>{
                    var val = row[header] || "";
                    if (header == "opts") {
                        var opt = val[0];
                        return (<td>{this.renderLink(opt.cmd, opt.desc)}</td>)
                    }else if (header === 'thumbnail') {
                        var img_url = val;
                        return (<td><img width={120} src={img_url} /></td>)
                    } else {
                        return (<td>{val}</td>)
                    }
                })
            }</tr>
        )
    }
}

export default Table;