import fs from 'fs';
import { describe, test, expect, afterEach } from 'vitest';
import { generateIcsFromEvent } from '@hub-client/logic/calendar.logic';
import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';

describe('generateIcsFromEvent', () => {
	let createdFiles: string[] = [];

	afterEach(() => {
		createdFiles.forEach(filePath => {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		});
		createdFiles = [];
	});

	test('should generate ICS file with required fields', () => {
		const event = new CalendarEvent(
			'Test Event',
			'Test Description',
			'#FF0000',
			'Test Location',
			false,
			new Date('2023-10-01T10:00:00Z'),
			new Date('2023-10-01T11:00:00Z')
		);

		const filePath = generateIcsFromEvent(event);
		createdFiles.push(filePath);

		expect(fs.existsSync(filePath)).toBe(true);
		const content = fs.readFileSync(filePath, 'utf8');
		expect(content).toContain('BEGIN:VCALENDAR');
		expect(content).toContain('SUMMARY:Test Event');
		expect(content).toContain('DESCRIPTION:Test Description');
		expect(content).toContain('LOCATION:Test Location');
		expect(content).toContain('DTSTART:20231001T100000Z');
		expect(content).toContain('DTEND:20231001T110000Z');
		expect(content).toContain('END:VCALENDAR');
	});

	test('should throw error if title is missing', () => {
		const event = new CalendarEvent(
			'',
			'Test Description',
			'#FF0000',
			'Test Location',
			false,
			new Date('2023-10-01T10:00:00Z'),
			new Date('2023-10-01T11:00:00Z')
		);

		expect(() => generateIcsFromEvent(event)).toThrow('event.title is required');
	});

	test('should throw error if startTime is missing', () => {
		const event = new CalendarEvent(
			'Test Event',
			'Test Description',
			'#FF0000',
			'Test Location',
			false,
			new Date(''), // Invalid date
			new Date('2023-10-01T11:00:00Z')
		);

        const event2 = new CalendarEvent('Test', '', '#FF0000');
		// @ts-ignore
		event2.startTime = null;

		expect(() => generateIcsFromEvent(event2)).toThrow('event.startTime is required');
	});

	test('should throw error if endTime is missing', () => {
		const event = new CalendarEvent('Test', '', '#FF0000');
		// @ts-ignore
		event.endTime = null;

		expect(() => generateIcsFromEvent(event)).toThrow('event.endTime is required');
	});

	test('should include description and location if provided', () => {
		const event = new CalendarEvent(
			'Event with Details',
			'Detailed Description',
			'#00FF00',
			'Specific Location',
			false,
			new Date('2023-10-02T14:00:00Z'),
			new Date('2023-10-02T15:30:00Z')
		);

		const filePath = generateIcsFromEvent(event);
		createdFiles.push(filePath);

		const content = fs.readFileSync(filePath, 'utf8');
		expect(content).toContain('DESCRIPTION:Detailed Description');
		expect(content).toContain('LOCATION:Specific Location');
	});

	test('should handle minimal event', () => {
		const event = new CalendarEvent('Minimal Event', '', '#000000');

		const filePath = generateIcsFromEvent(event);
		createdFiles.push(filePath);

		const content = fs.readFileSync(filePath, 'utf8');
		expect(content).toContain('SUMMARY:Minimal Event');
		expect(content).toContain('DESCRIPTION:');
		expect(content).toContain('LOCATION:');
	});
});