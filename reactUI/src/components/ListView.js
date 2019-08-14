import React from 'react';
class ListView extends React.Component{
    render(){
        return (
            <div className={this.props.className}>
                <h5>{this.props.title}</h5>
                <ul>
                    {this.props.list && this.props.list.map ? this.props.list.map((item, i) => {
                        return (
                            <li key={"list-" + i}>
                                <h5 className="list-header">{item.title}</h5>
                                <div className="list-body">{item.description}</div>
                            </li>
                        )
                    }):null}
                </ul>
            </div>
        )
    }
}

export default ListView;