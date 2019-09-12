import react from 'React';
import Table from '../components/Table'
import Window from '../component/Window';

class FileListView extends React.Component{

    constructor(props){
        super(props);
        this.state={
            files:  [],
            edges:  {},
            filesLoaded: false
        }
    }

    render(){
        return(
            <Window width={1000} height={600} left={220} ipc={this.props.ipc} icon='computer' title='Discover Content'>
               
           </Window>
        )

    }

}
export default FileListView;
