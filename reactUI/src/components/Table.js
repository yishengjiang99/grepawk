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
                {this.props.headers.map((header)=>{
                    return (<th>{header}</th>)
                })}
            </thead>
        )
    }
    renderBody=()=>{
        if(!this.props.rows) return null;
        return (
            <tbody>
{           this.props.rows.map(row=>{
                var html="";
                this.props.headers.map((header)=>{
                    var val = row[header] || "";
                    var td_val = ""
                    if (header == "opts") {
                      val.forEach((opt, i) => {
                        td_val += `<a style='color:yellow' href='#' class='onclick_cmd' cmd='${opt.cmd}'>${opt.desc}</a>`;
                      })
                      html+="<td>"+td_val+"</td>";
                    }else if (header === 'thumbnail') {
                        var img_url = val;
                        html += "<td><img width=120 src='" + img_url + "'></td>";
                    } else {
                        html += "<td>" + val + "</td>";
                    }
                })
                var htmlToReactParser = new HtmlToReactParser();

                return (<tr>{htmlToReactParser.parse(html)}</tr>)
            })
        }
             </tbody>
        )        

    }
    render(){
        return(<table className={this.props.className || "table"} border="1">
            {this.renderHeaders()}
            {this.renderBody()}
        </table>)
    }
}
export default Table;