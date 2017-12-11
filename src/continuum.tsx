import * as React from "react";
import { PureComponent, CSSProperties } from "react";
import * as Moment from "moment";

export type MomentType = Moment.Moment;

export interface TimelineData {
	start: MomentType;
	end: MomentType;
	label: string;
}

export interface ExtendedTimelineData extends TimelineData {
	order: number;
}

export interface ITimelineProps {
	data: TimelineData[];
	height: number;
	viewStart: string | MomentType;
	viewEnd: string | MomentType;
}

export interface ITimelineState {
	viewStart: MomentType;
	viewEnd: MomentType;
	viewHeightOffset: number;
	workingData: ExtendedTimelineData[];
	numGuideLines: number;
	isDragging: boolean;
}

export class Timeline extends PureComponent<ITimelineProps, ITimelineState> {
	private containerRef: HTMLElement | null = null;
	private startDragX: number = 0;
	private startDragY: number = 0;
	private startDragHeightOffset: number = 0;
	private startDragMoment: MomentType | null = null;
	private endDragMoment: MomentType | null = null;

	componentWillMount() {
		this.setState({
			viewStart: Moment().subtract(4, "days"),
			viewEnd: Moment().add(4, "days"),
			numGuideLines: 10,
			viewHeightOffset: 0,
		});

		this.processProps(this.props);
		// Add listener for middle mouse
		document.addEventListener('mouseup', this.onEndDrag, false);	
		document.addEventListener('mousemove', this.onMouseMove, false);	
	}

	componentWillUnmount() {
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
			if (nextProps.viewEnd !== lastProps.viewEnd || 
				nextProps.viewStart !== lastProps.viewStart) {
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

	onEndDrag = (e: any) => {
		if (e.button !== 1) {
			return;
		}

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
		if (e.button !== 1) {
			return;
		}

		this.setState({
			isDragging: true,
		});

		this.startDragMoment = Moment(this.state.viewStart);
		this.endDragMoment = Moment(this.state.viewEnd);
		this.startDragHeightOffset = this.state.viewHeightOffset;
		this.startDragX = e.clientX;
		this.startDragY = e.clientY;
	};

	processData(data: TimelineData[]) {
		let newWorkingData: ExtendedTimelineData[] = [];

		data.forEach(datum => {
			newWorkingData.push({
				...datum,
				order: 0,
			});
		});

		// Sort the data by start date
		newWorkingData.sort((a, b) => a.start.diff(b.start, "seconds"));

		for (let i = 0; i < newWorkingData.length; i ++) {
			let a = newWorkingData[i];
			let collisions: ExtendedTimelineData[] = [];
			
			for (let j = 0; j < newWorkingData.length; j ++) {
				let b = newWorkingData[j];
				if (a === b)
					continue;

				if ((a.start.isBefore(b.end) && a.start.isAfter(b.start)))
					collisions.push(b)
			}
			
			let order = 0;

			while (collisions.some(datum => datum.order === order))
				order ++;

			a.order = order;
		}
		
		// Figure out ordering
		newWorkingData

		this.setState({
			workingData: newWorkingData,
		});
	}

	onZoom = (e: any) => {
		let { viewStart, viewEnd } = this.state;

		let deltaSeconds = (viewStart.diff(viewEnd, "seconds")) * e.deltaY;

		viewStart = Moment(viewStart).add(deltaSeconds/2);
		viewEnd = Moment(viewEnd).subtract(deltaSeconds/2);
		
		this.setState({
			viewStart,
			viewEnd,
		});
	};

	renderDatum(datum: ExtendedTimelineData) {
		let { height } = this.props;
		let { viewStart, viewEnd, viewHeightOffset } = this.state;

		// TODO: Move this out at some point, optimize
		// Don't render this datum if it's out of view
		if ((datum.start.isBefore(viewStart) && datum.end.isBefore(viewEnd)) && 
			(datum.start.isBefore(viewEnd) && datum.end.isBefore(viewStart))) {
				return null;
			}

		let maxSeconds = viewEnd.diff(viewStart, "seconds");
		let startPercent = Math.min(Math.max(datum.start.diff(viewStart, "seconds"), 0) / maxSeconds, 1) * 100;
		let endPercent = Math.min(Math.max(viewEnd.diff(datum.end, "seconds"), 0) / maxSeconds, 1) * 100;

		if (startPercent === 0)
			startPercent = -1;

		if (endPercent === 0)
			endPercent = -1;

		let style: CSSProperties = {
			position: "absolute",
			backgroundColor: "rgba(0, 128, 128, 0.2)",
			top: `${height - 40 - 30 * (datum.order + 1) + viewHeightOffset}px`,
			height: "20px",
			left: `${startPercent}%`,
			right: `${endPercent}%`,
			overflow: "hidden",
			whiteSpace: "nowrap",
			textOverflow: "ellipsis",
			borderStyle: "solid",
			borderColor: "black",
			textAlign: "center",
		}

		let key = `${datum.start.toISOString()}-${datum.end.toISOString()}-${datum.label}`;

		let title = `${this.renderDateFormatted(datum.start)} - ${this.renderDateFormatted(datum.end)} - ${datum.label}`

		return (
			<div style={style} key={key} title={title}>
				{datum.label}
			</div>
		)
	}

	renderDateFormatted(date: MomentType, resolution?: "days" | "hours") {
		if (!resolution)
			resolution = "days";
		
		if (resolution === "days") {
			return date.format("MM-DD-YYYY");
		}
		else {
			return date.format("MM-DD-YYYY, h:mm a");
		}
	}

	renderLine(percent: number, color: string, key: string, text?: string) {
		let { height } = this.props;

		let style: CSSProperties = {
			position: "absolute",
			top: `0px`,
			height: `${height}px`,
			left: `${percent * 100}%`,
			right: `${100 - percent * 100}%`,
			whiteSpace: "nowrap",
			borderLeft: `1px dotted ${color}`
		}

		let textStyle: CSSProperties = {
			bottom: "0px",
			position: "absolute",
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

	renderBaseline() {
		let { height } = this.props;
		let { viewHeightOffset } = this.state;

		let style: CSSProperties = {
			position: "absolute",
			top: `${height - 40 + viewHeightOffset}px`,
			height: "0px",
			width: "100%",
			overflow: "hidden",
			whiteSpace: "nowrap",
			borderTop: "1px solid rgba(0, 0, 0, 0.25)",
		}

		return (
			<div style={style} />
		);
	}

	renderNowLine() {
		return this.renderLine(0.5, "red", "now", "Now");
	}

	renderGuideLines() {
		let { viewEnd, viewStart, numGuideLines } = this.state;

		let seconds = (viewEnd.diff(viewStart, "seconds"));
		
		let current = Moment(viewStart);
		
		let lines = [];

		for (let i = 0; i < numGuideLines; i ++) {
			let text = this.renderDateFormatted(current);

			current.add(seconds / numGuideLines, "seconds");

			if (i / 10 === 0.5)
				continue;
			
			lines.push(
				this.renderLine(i/10, "rgba(0, 0, 0, 0.25)", `guideline-${100/i}`, text)
			);
		}

		return lines;
	}

	renderScale() {
		let { viewEnd, viewStart, numGuideLines } = this.state;

		let seconds = (viewEnd.diff(viewStart, "seconds")) / numGuideLines;
		
		let style: CSSProperties = {
			position: "absolute",
			top: "10px",
			width: `${(1/numGuideLines) * 100}%`,
			right: "0px",
			height: "0px",
			borderTop: "1px solid green",
			textAlign: "center",
		};

		let useDays = false;
		let hours = Math.round(seconds/360)/10;
		let days = Math.round(hours/2.4)/10;

		if (hours > 23.9)
			useDays = true;

		return (
			<div style={style}>
				{
					useDays ? `${days} days` : `${hours} hours`
				}
			</div>
		)
	}

	render() {
		let { height } = this.props;
		let { workingData, viewEnd, viewStart } = this.state;

		let style: CSSProperties = {
			width: "100%",
			height: height,
			position: "relative",
			borderStyle: "solid",
			borderColor: "black",
			overflow: "hidden",
		};

		let datums = workingData.map(datum => this.renderDatum(datum));
		
		return (
			<div ref={el => this.containerRef = el} style={style} onWheel={this.onZoom} onMouseDown={this.onStartDrag}>
				{datums}
				{this.renderNowLine()}
				{this.renderGuideLines()}
				{this.renderScale()}
				{this.renderBaseline()}
				<div>{`${this.renderDateFormatted(viewStart, "hours")} - ${this.renderDateFormatted(viewEnd, "hours")}`}</div>
			</div>
		);
	}
}