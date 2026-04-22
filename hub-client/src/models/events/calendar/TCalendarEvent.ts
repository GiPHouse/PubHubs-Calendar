import { PubHubsMgType } from '@hub-client/logic/core/events';

class CalendarEvent {
	/* This class should be used while users are validating a calendar in UI.
	 * Methods to add could be canSend() to check input validation (e.g. endTime > startTime)
	 */
	title: string;
	description: string;
	color: string;
	startTime: Date;
	endTime: Date;
	isAllDay: boolean;
	location: string;

	constructor(
		// some default values are provided
		title: string = 'Untitled',
		description: string = '',
		color: string,
		location: string,
		isAllDay: boolean = false,
		startTime: Date = new Date(), // if not provided, set to now
		endTime?: Date,
	) {
		this.title = title;
		this.description = description;
		this.color = color;
		this.location = location;
		this.startTime = startTime;
		// is endTime provided? if not, set to startime + 1h
		this.endTime = endTime ?? new Date(startTime.getTime() + 60 * 60 * 1000);
		this.isAllDay = isAllDay;
	}
}

interface TCalendarEventMessageContent {
	/* This interface should be used to describe the event content when sending to Matrix
	 * Use it after the CalendarEvent logic checks out to serialize the data into a base schema.
	 */
	msgtype: PubHubsMgType.CalendarEvent;
	body: string;
	title: string;
	description: string;
	color: string;
	location: string;
	startTime: Date;
	endTime: Date;
	isAllDay: boolean;
	'm.relates_to'?: undefined;
	'm.new_content'?: undefined;
}

export { CalendarEvent, TCalendarEventMessageContent };
