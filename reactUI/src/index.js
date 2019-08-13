import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import Desktop from './Desktop'
ReactDOM.render(<Desktop/>, document.getElementById('root'));
serviceWorker.unregister();
