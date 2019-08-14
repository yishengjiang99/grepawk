import React from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'


class AppIcon extends React.Component{
     render(){
         return(<div>
            <FontAwesomeIcon icon={this.props.faName} />
         </div>)
     }
}
AppIcon.defaultProps={
    width:50,
    height:50,
    faName:'check-square'
}

export default AppIcon;