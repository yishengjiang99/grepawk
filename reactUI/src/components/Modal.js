import React from "react";

class Modal extends React.Component{
    constructor(props){
        super(props);
        this.state={
            answers: this.props.initialAnswers || {}
        }
    }
    componentDidMount(){
        if(this.props.initialAnswers && this.props.questions){
            var setState={};
            this.props.questions.forEach((question,i)=>{
                setState[question] = this.props.initialAnswers[i];
            })
            this.setState(setState);
        }
    }

    render(){
        const modalStyle = this.props.style || {
            display:  'block',
            position: 'fixed',
            width: '50vw',
            height: '80vh',
            top: '5vh',
            left: '25vw'
        }
        return (
            <div style={modalStyle} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{this.props.title}</h5>
                <button type="button" className="close" onClick={this.props.onClose} aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>{this.props.children || this.renderBody()}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={this.props.onClose}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={this.props.onSave || this.clickedSave}>Publish</button>
              </div>
            </div>
        )
    }
    clickedSave=()=>{
        this.props.onSubmit(this.state.answers);
       
    }
    renderBody=()=>{
        const stateAnwsers = this.state.answers;
        return (
        <div>
        {
            this.props.questions.map((question,idx)=>{
                let val = stateAnwsers[question] || "";
                return (
                    <div className='form-group form-row'>
                        <label className="col-md-6" for={"`input-${idx}`"}>{question}</label>
                        <input 
                            className="col-md-6" 
                            value={val} 
                            onChange={(e)=>{
                                const name = e.target.name;
                                const value = e.target.value;
                                stateAnwsers[name]=value;
                                this.setState({answers: stateAnwsers})
                            }}
                            type='text' 
                            name={question} 
                            ref={'question '+idx}></input>
                    </div>
                )
            })
        }
        </div>)

    }

}

export default Modal;