import { Timeline } from '../../../src';
import * as React from 'react';
import * as ReactDOM from 'react-dom'; 
import * as Moment from "moment";
import { TimelineData, ExtendedTimelineData } from '../../../src/continuum';
import { PureComponent, CSSProperties } from 'react';
import * as _ from 'lodash';

interface IAppState {
    data: TimelineData[],
    viewStart: Moment.Moment;
    viewEnd: Moment.Moment;
    useRenderer: boolean;
}

let myInt = 4;

class App extends PureComponent<{}, IAppState> {
    componentWillMount() {
        let today = Moment().startOf('day');

        let data: TimelineData[] = [
            {
               start: Moment(today).subtract(2, 'days'),
               end: Moment(),
               label: 'Task 1',
            },
            {
                start: Moment(today).subtract(1, 'days'),
                end: Moment(today).add(1, 'days'),
                label: 'Task 2',
            },
             {
                start: Moment(today),
                end: Moment(today).add(2, 'days'),
                label: 'Task 3',
            },
         ];

        this.setState({
            data,
            viewStart: Moment(today).subtract(4, 'days'),
            viewEnd: Moment(today).add(4, 'days'),
            useRenderer: false,
        });
    }

    onAddData = () => {
        let newData = _.clone(this.state.data);

        let start = Moment().subtract(Math.random() * 5 * 24, 'hours').add(Math.random() * 5 * 24, 'hours');
        let end = Moment(start).add(Math.random() * 4 * 24, 'hours');

        newData.push(
            {
                start: start,
                end: end,
                label: `Task ${myInt}`,
            },
        );

        myInt++;

        this.setState({
            data: newData,
        });
    };

    onForceRerender = () => {
        this.setState( {
            data: _.clone(this.state.data),
        });
    };

    onToggleRenderer = () => {
        this.setState( {
            useRenderer: !this.state.useRenderer,
        });
    };

    renderDatum = (datum: ExtendedTimelineData) => {
        let backgroundColor = Moment().isBetween(datum.start, datum.end) ? '#dc3545' : '#007bff';
                
        let style: CSSProperties = {
            backgroundColor,
            color: '#ffffff',
            border: '2px solid white',
            borderRadius: '5px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            textAlign: 'center',
            height: '20px',	
        };
        
        return (
            <div style={style}>
                {datum.label}
            </div>
        )
    };

    render() {
        let { data, viewStart, viewEnd, useRenderer } = this.state;
        return (
            <div>
                <h1>Timeline Component</h1>
                <p>Below is an example of the Timeline component</p>
                <button onClick={this.onAddData}>Add</button>
                <button onClick={this.onForceRerender}>Force Rerender</button>
                <br/>
                <span>
                    Use custom datum renderer: 
                    <input id="checkBox" type="checkbox" checked={useRenderer} onChange={this.onToggleRenderer}/>
                </span>
                <hr/>
                <Timeline 
                    height={600}
                    data={data}
                    viewStart={viewStart}
                    viewEnd={viewEnd}
                    renderDatum={useRenderer ? this.renderDatum : undefined}
                />
            </div>
        );
    }
}

ReactDOM.render(
  <App/>,
  document.getElementById('root')
);