import * as React from 'react';
import { PureComponent, CSSProperties, ReactNode } from 'react';
import * as Moment from 'moment';
import { calculateInterval } from './utils';

export type MomentType = Moment.Moment;

export interface TimelineData {
	start: MomentType;
	end: MomentType;
	label: string;
	id?: string | number;
}

export interface ExtendedTimelineData extends TimelineData {
	order: number;
}

export interface ITimelineProps {
	data: TimelineData[];
	height: number;
	viewStart: string | MomentType;
	viewEnd: string | MomentType;
	targetDivisions?: number;
	renderDatum?: (datum: ExtendedTimelineData) => ReactNode;
}

export interface ITimelineState {
	viewStart: MomentType;
	viewEnd: MomentType;
	viewHeightOffset: number;
	workingData: ExtendedTimelineData[];
	isDragging: boolean;
}

const DragMouseButton = 0;

const DefaultDatumStyle: CSSProperties = {
	backgroundColor: '#007bff',
	color: '#ffffff',
	border: '2px solid white',
	borderRadius: '5px',
	fontWeight: 'bold',
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
	textAlign: 'center',
	height: '20px',	
};

export class Timeline extends PureComponent<ITimelineProps, ITimelineState> {
	public static defaultProps: Partial<ITimelineProps> = {
		targetDivisions: 10,
	};

	private containerRef: HTMLElement | null = null;
	private startDragX: number = 0;
	private startDragY: number = 0;
	private startDragHeightOffset: number = 0;
	private startDragMoment: MomentType | null = null;
	private endDragMoment: MomentType | null = null;

	componentWillMount() {
		this.setState({
			viewHeightOffset: 0,
		});

		this.processProps(this.props);

		// Add listeners for mouse events
		document.addEventListener('mouseup', this.onEndDrag, false);	
		document.addEventListener('mousemove', this.onMouseMove, false);	
	}

	componentWillUnmount() {
		// Be a good person and clean up my listeners
		document.removeEventListener('mouseup', this.onEndDrag, false);
		document.removeEventListener('mousemove', this.onMouseMove, false);	
	}

	componentWillReceiveProps(nextProps: ITimelineProps) {
		this.processProps(nextProps, this.props);
	}

	processProps(nextProps: ITimelineProps, lastProps?: ITimelineProps) {
		if (lastProps) {
			// Process new data
			if (nextProps.data !== lastProps.data)
				this.processData(nextProps.data);

			// Capture new view settings
			if (!Moment(nextProps.viewEnd).isSame(Moment(lastProps.viewEnd)) || 
				!Moment(nextProps.viewStart).isSame(Moment(lastProps.viewStart))) {
				this.setState({
					viewStart: Moment(nextProps.viewStart),
					viewEnd: Moment(nextProps.viewEnd),
				});
			}		
		}
		else {
			// Process data
			this.processData(nextProps.data);

			// Process view settings
			this.setState({
				viewStart: Moment(nextProps.viewStart),
				viewEnd: Moment(nextProps.viewEnd),
			});
		}
	}

	processData(data: TimelineData[]) {
		let newWorkingData: ExtendedTimelineData[] = [];

		data.forEach(datum => {
			newWorkingData.push({
				...datum,
				order: 0,
			});
		});

		// Sort the data by start date
		newWorkingData.sort((a, b) => a.start.diff(b.start, 'seconds'));

		// Figure out ordering
		for (let i = 0; i < newWorkingData.length; i ++) {
			let a = newWorkingData[i];
			let collisions: ExtendedTimelineData[] = [];
			
			for (let j = 0; j < newWorkingData.length; j ++) {
				let b = newWorkingData[j];
				if (a === b)
					continue;

				if ((a.start.isSameOrBefore(b.end) && a.start.isSameOrAfter(b.start)))
					collisions.push(b)
			}
			
			let order = 0;

			while (collisions.some(datum => datum.order === order))
				order ++;

			a.order = order;
		}
		
		this.setState({
			workingData: newWorkingData,
		});
	}

	onEndDrag = (e: any) => {
		if (e.button !== DragMouseButton) {
			return;
		}

		e.stopPropagation();
		e.preventDefault();
		
		if (this.state.isDragging) {
			this.setState({
				isDragging: false,
			});
		}
	};

	onMouseMove = (e: any) => {
		if (this.state.isDragging && this.startDragMoment && this.endDragMoment && this.containerRef) {
			let { viewStart, viewEnd } = this.state;
			let containerSize = this.containerRef.getBoundingClientRect();

			let viewSeconds = viewEnd.diff(viewStart, 'seconds');
			
			let rawDeltaX = this.startDragX - e.clientX;
			let deltaXPercent = rawDeltaX/containerSize.width;

			let newViewStart = Moment(this.startDragMoment).add(deltaXPercent * viewSeconds, 'seconds');
			let newViewEnd = Moment(this.endDragMoment).add(deltaXPercent * viewSeconds, 'seconds');

			let rawDeltaY = this.startDragY - e.clientY;

			let newViewHeightOffset = Math.max(this.startDragHeightOffset - rawDeltaY, 0);
			
			this.setState({
				viewStart: newViewStart,
				viewEnd: newViewEnd,
				viewHeightOffset: newViewHeightOffset,
			});
		}
	};

	onStartDrag = (e: any) => {
		if (e.button !== DragMouseButton) {
			return;
		}

		e.stopPropagation();
		e.preventDefault();
		
		this.setState({
			isDragging: true,
		});

		this.startDragMoment = Moment(this.state.viewStart);
		this.endDragMoment = Moment(this.state.viewEnd);
		this.startDragHeightOffset = this.state.viewHeightOffset;
		this.startDragX = e.clientX;
		this.startDragY = e.clientY;
	};

	onZoom = (e: any) => {
		let { viewStart, viewEnd } = this.state;

		e.stopPropagation();
		e.preventDefault();

		let deltaSeconds = (viewStart.diff(viewEnd, 'seconds')) * e.deltaY;

		viewStart = Moment(viewStart).add(deltaSeconds/2);
		viewEnd = Moment(viewEnd).subtract(deltaSeconds/2);
		
		this.setState({
			viewStart,
			viewEnd,
		});
	};

	renderDatum(datum: ExtendedTimelineData) {
		let { height, renderDatum } = this.props;
		let { viewStart, viewEnd, viewHeightOffset } = this.state;

		// TODO: Move this out at some point, optimize
		// Don't render this datum if it's out of view
		if ((datum.start.isBefore(viewStart) && datum.end.isBefore(viewEnd)) && 
			(datum.start.isBefore(viewEnd) && datum.end.isBefore(viewStart))) {
				return null;
			}

		let maxSeconds = viewEnd.diff(viewStart, 'seconds');
		let startPercent = Math.min(Math.max(datum.start.diff(viewStart, 'seconds'), 0) / maxSeconds, 1) * 100;
		let endPercent = Math.min(Math.max(viewEnd.diff(datum.end, 'seconds'), 0) / maxSeconds, 1) * 100;

		if (startPercent === 0)
			startPercent = -1;

		if (endPercent === 0)
			endPercent = -1;

		let style: CSSProperties = {
			position: 'absolute',
			top: `${height - 40 - 30 * (datum.order + 1) + viewHeightOffset}px`,
			left: `${startPercent}%`,
			right: `${endPercent}%`,
			overflow: 'hidden',
		}

		let key = `${datum.start.toISOString()}-${datum.end.toISOString()}-${datum.label}`;

		let extendedStyle = renderDatum ? {} : DefaultDatumStyle;

		return (
			<div 
				key={key}
				style={{...extendedStyle, ...style}}
			>
				{renderDatum ? renderDatum(datum) : datum.label}
			</div>
		)
	}

	renderDateFormatted(date: MomentType, resolution?: 'days' | 'hours') {
		if (!resolution)
			resolution = 'days';
		
		if (resolution === 'days') {
			return date.format('MM-DD-YYYY');
		}
		else {
			return date.format('MM-DD-YYYY, h:mm a');
		}
	}

	renderLine(percent: number, percentEnd: number, color: string, key: string, text?: string, textOrder?: number) {
		let { height } = this.props;
		if (!textOrder)
			textOrder = 0;

		let style: CSSProperties = {
			position: 'absolute',
			top: '0px',
			height: `${height}px`,
			left: `${percent * 100}%`,
			right: `${100 - percentEnd * 100}%`,
			whiteSpace: 'nowrap',
			borderLeft: `1px dashed ${color}`,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
		}

		let textStyle: CSSProperties = {
			bottom: `${textOrder * 20}px`,
			position: 'absolute',
			color: color,
		}

		return (
			<div style={style} key={key}>
				{
					text && (
						<div style={textStyle}>
							{text}
						</div>
					)
				}
			</div>
		);
	}

	renderGuideLines() {
		let { targetDivisions } = this.props;
		let { viewEnd, viewStart } = this.state;

		let viewStartUnix = viewStart.unix() + Moment().utcOffset() * 60;
		let viewTotalSeconds = viewEnd.diff(viewStart, 'seconds');
		let interval = calculateInterval(viewTotalSeconds, targetDivisions as number);
		let intervalPercent = interval/viewTotalSeconds;
		let actualGuideLines = Math.floor(viewTotalSeconds / interval);

		let offset = viewStartUnix % interval;
		let current = Moment(viewStart).subtract(offset, 'seconds');
		
		let elements = [];
		
		// Render the bottom container element
		let guideContainerStyle: CSSProperties = {
			position: 'absolute',
			bottom: '0px',
			height: '40px',
			width: '100%',
			overflow: 'hidden',
			whiteSpace: 'nowrap',
			backgroundColor: 'white',
			borderTop: '2px solid #c6c8ca'
		};

		elements.push(
			<div style={guideContainerStyle} key='guide-container'/>
		);

		// Render reach guideline
		for (let i = -1; i < actualGuideLines + 1; i ++) {
			let text = this.renderDateFormatted(current, 'hours');

			let percent = 1 - viewEnd.diff(current, 'seconds') / viewTotalSeconds;
			
			elements.push(
				this.renderLine(percent, percent + intervalPercent, '#c6c8ca', `guideline-${i}`, text)
			);

			current.add(interval, 'seconds');			
		}

		// Render the now line if it's currently in view
		let now = Moment();
		if (now.isBetween(viewStart, viewEnd)) {
			let nowOffset = now.diff(viewStart, 'seconds');
			let nowPercentOffset = nowOffset/viewTotalSeconds;
			elements.push(
				this.renderLine(nowPercentOffset, nowPercentOffset + intervalPercent, 'red', 'now', 'Now', 1)
			);
		}
		
		// Render the current scale
		let scaleStyle: CSSProperties = {
			position: 'absolute',
			top: '10px',
			width: `${(interval / viewTotalSeconds) * 100}%`,
			right: '0px',
			height: '0px',
			borderTop: '1px solid green',
			textAlign: 'center',
		};

		// TODO: Potentially don't use Moment's humanize function as it will take 23 hours and render it as 'a day'?
		elements.push(
			<div style={scaleStyle} key='guide-scale'>
				{
					Moment.duration(interval, 'seconds').humanize()
				}
			</div>
		);

		return elements;
	}

	render() {
		let { height } = this.props;
		let { workingData, viewEnd, viewStart } = this.state;

		let containerStyle: CSSProperties = {
			width: '100%',
			height: height,
			position: 'relative',
			border: '2px solid #c6c8ca',
			overflow: 'hidden',
			cursor: 'pointer',
		};

		let datums = workingData.map(datum => this.renderDatum(datum));
		
		return (
			<div ref={el => this.containerRef = el} style={containerStyle} onWheel={this.onZoom} onMouseDown={this.onStartDrag}>
				{this.renderGuideLines()}
				{datums}
				<div>{`${this.renderDateFormatted(viewStart, 'hours')} - ${this.renderDateFormatted(viewEnd, 'hours')}`}</div>
			</div>
		);
	}
}