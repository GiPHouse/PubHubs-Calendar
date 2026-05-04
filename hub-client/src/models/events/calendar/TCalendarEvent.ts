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
<<<<<<< linking-funcs
	id?: string;
	location?: string;
	room?: string;

	constructor(
		// some default values are provided
		title: string = 'New Calendar Event',
		description: string = '',
		color: string = '#3788d8',
		isAllDay: boolean = false,
		startTime: Date = new Date(), // if not provided, set to now
		endTime?: Date,
		id?: string,
		location?: string,
		room?: string,
=======
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
>>>>>>> matrix-composable-sendevent
	) {
		this.title = title;
		this.description = description;
		this.color = color;
<<<<<<< linking-funcs
=======
		this.location = location;
>>>>>>> matrix-composable-sendevent
		this.startTime = startTime;
		// is endTime provided? if not, set to startime + 1h
		this.endTime = endTime ?? new Date(startTime.getTime() + 60 * 60 * 1000);
		this.isAllDay = isAllDay;
<<<<<<< linking-funcs
		this.id = id;
		this.location = location;
		this.room = room;
=======
>>>>>>> matrix-composable-sendevent
	}
}

interface TCalendarEventMessageContent {
	/* This interface should be used to describe the event content when sending to Matrix
	 * Use it after the CalendarEvent logic checks out to serialize the data into a base schema.
	 */
<<<<<<< linking-funcs
	msgtype: PubHubsMgType;
=======
	msgtype: PubHubsMgType.CalendarEvent;
>>>>>>> matrix-composable-sendevent
	body: string;
	title: string;
	description: string;
	color: string;
<<<<<<< linking-funcs
	location?: string;
	room?: string;
	startTime: Date;
	endTime: Date;
	isAllDay: boolean;
	'm.relates_to'?: {
		event_id: string;
		rel_type: PubHubsMgType;
	};
	'm.new_content'?: TCalendarEventMessageContent;
=======
	location: string;
	startTime: Date;
	endTime: Date;
	isAllDay: boolean;
	'm.relates_to'?: undefined;
	'm.new_content'?: undefined;
>>>>>>> matrix-composable-sendevent
}

export { CalendarEvent, TCalendarEventMessageContent };
