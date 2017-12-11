import { Timeline } from '../../../src';
import * as React from 'react';
import * as ReactDOM from 'react-dom'; 
import * as Moment from "moment";
import { TimelineData } from '../../../src/continuum';
import { PureComponent } from 'react';
import * as _ from 'lodash';

interface IAppState {
    data: TimelineData[],
    viewStart: Moment.Moment;
    viewEnd: Moment.Moment;
}

let myInt = 4;

class App extends PureComponent<{}, IAppState> {
    componentWillMount() {
        let data: TimelineData[] = [
            {
               start: Moment().subtract(2, "days"),
               end: Moment(),
               label: "Task 1",
            },
            {
                start: Moment().subtract(1, "days"),
                end: Moment().add(1, "days"),
                label: "Task 2",
             },
             {
                start: Moment(),
                end: Moment().add(2, "days"),
                label: "Task 3",
             },
         ];

        this.setState({
            data,
            viewStart: Moment().subtract(4, 'days'),
            viewEnd: Moment().add(4, 'days'),
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
                label: `Task ${myInt ++}`,
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
        let { data, viewStart, viewEnd } = this.state;
        return (
            <div>
                <h1>Timeline Component</h1>
                <p>Below is an example of the Timeline component</p>
                <button onClick={this.onAddData}>Add</button>
                <button onClick={this.onForceRerender}>Force Rerender</button>
                <hr/>
                <Timeline height={600} data={data} viewStart={viewStart} viewEnd={viewEnd}/>
            </div>
        );
    }
}

ReactDOM.render(
  <App/>,
  document.getElementById('root')
);