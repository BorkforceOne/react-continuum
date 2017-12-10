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
}

export interface ITimelineState {
	viewStart: MomentType;
	viewEnd: MomentType;
	workingData: ExtendedTimelineData[];
	numGuideLines: number;
	isDragging: boolean;
}

export class Timeline extends PureComponent<ITimelineProps, ITimelineState> {
	private containerRef: HTMLElement | null = null;
	// private startDragX: number = 0;
	// private startDragY: number = 0;
	// private startDragMoment: MomentType | null = null;

	componentWillMount() {
		this.setState({
			viewStart: Moment().subtract(4, "days"),
			viewEnd: Moment().add(4, "days"),
			numGuideLines: 10,
		});

		this.processData(this.props.data);

		// Add listener for middle mouse
		// document.addEventListener('mouseup', this.handleOutsideMouseUp, false);		
	}
	/*

	componentWillUnmount() {
		document.addEventListener('click', this.handleOutsideMouseUp, false);		
	}*/

	componentWillReceiveProps(nextProps: ITimelineProps) {
		if (nextProps.data !== this.props.data)
			this.processData(nextProps.data);
	}
/*
	handleOutsideMouseUp = (e: any) => {
		// ignore clicks on the component itself
		if (!this.containerRef || this.containerRef.contains(e.target)) {
			return;
		}

		this.setState({
			isDragging: false,
		});
	};

	handleMouseMove = (e: any) => {
		if (this.state.isDragging) {
			let { viewStart, viewEnd } = this.state;
			
			viewStart.add(e.clientX)
			
			this.setState({
				
			});
		}
	};

	onStartDrag = (e: any) => {
		this.setState({
			isDragging: true,
		});

		this.startDragMoment = this.
		this.startDragX = e.clientX;
		this.startDragY = e.clientY;
	};*/

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
		if (!this.containerRef) {
			console.warn("Attempted to render dataum with containerRef not captured");
			// return null;
		}

		let { height } = this.props;
		let { viewStart, viewEnd } = this.state;

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
			startPercent = -10;

		if (endPercent === 0)
			endPercent = -10;

		let style: CSSProperties = {
			position: "absolute",
			backgroundColor: "rgba(0, 128, 128, 0.2)",
			top: `${height - 40 - 30 * (datum.order + 1)}px`,
			height: "20px",
			left: `${startPercent}%`,
			right: `${endPercent}%`,
			overflow: "hidden",
			whiteSpace: "nowrap",
			textOverflow: "ellipsis",
			borderStyle: "solid",
			borderColor: "black",
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
			return date.format("MM-DD-YYYY, h:mm:ss a");
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
			borderTop: "1px dotted green",
			textAlign: "center",
		};

		return (
			<div style={style}>
				{Math.round(seconds/360)/10} hours
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
			<div ref={el => this.containerRef = el} style={style} onWheel = {this.onZoom}>
				{datums}
				{this.renderNowLine()}
				{this.renderGuideLines()}
				{this.renderScale()}
				<div>{`${this.renderDateFormatted(viewStart, "hours")} - ${this.renderDateFormatted(viewEnd, "hours")}`}</div>
			</div>
		);
	}
}