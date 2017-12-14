const SecondsInSecond = 1;
const SecondsInMinute = SecondsInSecond * 60;
const SecondsInHour = SecondsInMinute * 60;
const SecondsInDay = SecondsInHour * 24;
const SecondsInWeek = SecondsInDay * 7;
const SecondsInMonth = SecondsInWeek * 4;
const SecondsInYear = SecondsInDay * 365;

const Intervals = [
	SecondsInSecond,
	SecondsInMinute,
	SecondsInHour,
	SecondsInDay,
	SecondsInWeek,
	SecondsInMonth,
	SecondsInYear,
];

/**
 * Calculates an interval in seconds snapped to seconds, minutes, 
 * hours, days, weeks, months, or years that best fits the desired 
 * number of divisions.
 * @param duration Duration to snap
 * @param targetDivisions The desired number of divisions to split our duration into
 */	
export function calculateInterval(duration: number, targetDivisions: number): number {
    let currentIndex = 0;
    let currentInterval = Intervals[currentIndex];
    let nextInterval = Intervals[currentIndex + 1];
    let workingInterval = currentInterval;
    let divisions = Math.floor(duration / currentInterval);
    
    // TODO: Potentially optimize this by getting the first base interval that goes over
    //       and then backtrack to the previous interval and add until we reach the target.

    while (divisions > targetDivisions) {
        workingInterval += currentInterval;
        
        if (currentIndex < Intervals.length - 1 && nextInterval < workingInterval) {
            currentInterval = nextInterval;
            workingInterval = currentInterval;
            currentIndex ++;
            nextInterval = Intervals[currentIndex + 1];
        }

        divisions = Math.floor(duration / workingInterval);
    }

    return workingInterval;
}
