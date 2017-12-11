import { Timeline } from '../../../src';
import * as React from 'react';
import * as ReactDOM from 'react-dom'; 
import * as Moment from "moment";
import { TimelineData } from '../../../src/continuum';
import { PureComponent } from 'react';
import * as _ from 'lodash';

interface IAppState {
    data: TimelineData[],
}

let myInt = 0;

class App extends PureComponent<{}, IAppState> {
    componentWillMount() {
        let data: TimelineData[] = [
            {
               start: Moment().subtract(2, "days"),
               end: Moment(),
               label: "I0",
            },
            {
                start: Moment().subtract(1, "days"),
                end: Moment().add(1, "days"),
                label: "I1",
             },
             {
                start: Moment(),
                end: Moment().add(2, "days"),
                label: "I2",
             },
         ];

        this.setState({
            data,
        });
    }

    onAddData = () => {
        let newData = _.clone(this.state.data);

        let start = Moment().subtract(Math.random() * 5 * 24, "hours").add(Math.random() * 5 * 24, "hours");
        let end = Moment(start).add(Math.random() * 4 * 24, "hours");

        newData.push(
            {
                start: start,
                end: end,
                label: `Test ${myInt ++}`,
            },
        );

        this.setState({
            data: newData,
        });
    };

    onForceRerender = () => {
        this.setState( {
            data: _.clone(this.state.data),
        });
    };

    render() {
        let { data } = this.state;
        let viewStart = Moment().subtract(4, 'days');
        let viewEnd = Moment().add(4, 'days');
        return (
            <div>
                <button onClick={this.onAddData}>Add</button>
                <button onClick={this.onForceRerender}>Rerender</button>
                <h1>Timeline</h1>
                <p>This is my awesome timeline</p>
                <Timeline height={600} data={data} viewStart={viewStart} viewEnd={viewEnd}/>
            </div>
        );
    }
}

ReactDOM.render(
  <App/>,
  document.getElementById('root')
);