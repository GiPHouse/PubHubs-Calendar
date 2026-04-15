import fs from 'fs';
import ical from 'ical-generator';
import os from 'os';
import path from 'path';

import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';

export function generateIcsFromEvent(event: CalendarEvent): string {
	const title = event.title;
	const description = event.description;
	const start = event.startTime;
	const end = event.endTime;
	const location = event.location;

	if (!title) throw new Error('event.title is required');
	if (!start) throw new Error('event.startTime is required');
	if (!end) throw new Error('event.endTime is required');

	const calendar = ical({ name: title });

	calendar.createEvent({
		start: start,
		end: end,
		description: description,
		location: location,
		//timezone: ...
	});

	const icsString = calendar.toString();
	const fileName = title + '.ics';
	const filePath = path.join(os.tmpdir(), fileName);
	fs.writeFileSync(filePath, icsString, 'utf8');

	return filePath;
}
