import fs from 'fs';
import ical from 'ical-generator';
import os from 'os';
import path from 'path';

import { TCalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

function createSafeFileName(title: string): string {
	return title.replace(/[^a-zA-Z0-9-_\.]/g, '_');
}

export function generateIcsStringFromEvent(event: TCalendarEvent): string {
	const title = event.title;
	const description = event.description;
	const start = event.startTime;
	const end = event.endTime;
	const location = event.location;

	if (!title) throw new Error('event.title is required');
	if (!start) throw new Error('event.startTime is required');
	if (!end) throw new Error('event.endTime is required');

	const calendar = ical({ name: 'Calendar' });

	calendar.createEvent({
		summary: title,
		start: start,
		end: end,
		description: description,
		location: location,
	});

	return calendar.toString();
}

export function generateIcsFromEvent(event: TCalendarEvent): string {
	if (isBrowser) {
		throw new Error('generateIcsFromEvent is not supported in browser. Use downloadIcsFromEvent instead.');
	}

	const icsString = generateIcsStringFromEvent(event);
	const fileName = `${createSafeFileName(event.title)}.ics`;
	const filePath = path.join(os.tmpdir(), fileName);
	fs.writeFileSync(filePath, icsString, 'utf8');

	return filePath;
}

export function downloadIcsFromEvent(event: TCalendarEvent): void {
	const icsString = generateIcsStringFromEvent(event);
	const fileName = `${createSafeFileName(event.title)}.ics`;

	if (isBrowser) {
		const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileName;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
		return;
	}

	generateIcsFromEvent(event);
}
