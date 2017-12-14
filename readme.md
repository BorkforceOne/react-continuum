# React-Continuum
A React component to help with displaying overlaying events and tasks.

## Timeline Props
| Prop      | Type                   | Description                           | Default
| --------- | ---------------------- | ------------------------------------- | --------
| data      | `TimelineData[]`       | The data to display in the timeline   | Required
| height    | `Number`               | The height of the timeline in pixels  | Required
| viewStart | `Moment or DateTimeString`| The initial view start             | Required
| viewEnd   | `Moment or DateTimeString`| The initial view end               | Required
| targetDivisions   | `Number`| The number of divisions when rendering guidelines | 10
| renderDatum   | `(datum: ExtendedTimelineData) => ReactNode`| Render function to use instead of the built in render, this will override all base styles other than positioning of the element | None

## TimelineData
| Key       | ValueType | Description                  
| --------- | --------- | -----------
| start     | `Moment`  | The start moment of this datum
| end       | `Moment`  | The end moment of this datum
| label     | `String`  | The label associated with this datum

## Example
```javascript
let data = [
    {
        start: Moment().subtract(2, 'days'),
        end: Moment(),
        label: 'Task 1',
    },
    {
        start: Moment().subtract(1, 'days'),
        end: Moment().add(1, 'days'),
        label: 'Task 2',
    },
    {
        start: Moment(),
        end: Moment().add(2, 'days'),
        label: 'Task 3',
    },
];

let viewStart = Moment().subtract(4, 'days');
let viewEnd = Moment().add(4, 'days');

return (
    <Timeline
        height={600}
        data={data}
        viewStart={viewStart}
        viewEnd={viewEnd}
    />
);
```

## Screenshot
![alt text](https://github.com/bjg96/react-continuum/blob/master/images/simple-01.jpg?raw=true "Simple 01")
