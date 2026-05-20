/// <reference types="vitest" />
// @vitest-environment node

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol, createFsFromVolume, Volume } from 'memfs';
import { TCalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';
import { generateIcsFromEvent } from '@hub-client/logic/calendar.logic';
vi.mock('fs', () => {
  const mockFs = {
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
    unlinkSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
  return mockFs;
});
vi.mock('os', () => ({ tmpdir: () => '/tmp' }));

let mockFs: any;

describe('generateIcsFromEvent', () => {
	beforeEach(() => {
		// Create a fresh virtual filesystem for each test
		const vol = new Volume();
		mockFs = createFsFromVolume(vol);
		mockFs.mkdirSync('/tmp', { recursive: true });

		// Mock the fs and os modules in calendar.logic
		vi.doMock('fs', () => {
			const methods = ['writeFileSync', 'readFileSync', 'existsSync', 'unlinkSync', 'mkdirSync'];
			const mocked: Record<string, any> = {
				default: mockFs,
			};
			methods.forEach(method => {
				mocked[method] = mockFs[method]?.bind(mockFs);
			});
			return mocked;
		});

		vi.doMock('os', () => ({
			tmpdir: () => '/tmp',
			default: { tmpdir: () => '/tmp' },
		}));
	});

	afterEach(() => {
		vi.unmock('fs');
		vi.unmock('os');
	});

	test('should generate ICS file with required fields', async () => {
		vi.resetModules();
		const { generateIcsFromEvent } = await import('@hub-client/logic/calendar.logic');
		const event = {
			title: 'Test Event',
			description: 'Test Description',
			color: '#FF0000',
			location: 'Test Location',
			isAllDay: false,
			startTime: new Date('2023-10-01T10:00:00Z'),
			endTime: new Date('2023-10-01T11:00:00Z')
		} as unknown as TCalendarEvent;

		const filePath = generateIcsFromEvent(event);

		expect(mockFs.existsSync(filePath)).toBe(true);
		
		const content = mockFs.readFileSync(filePath, 'utf8');

		expect(typeof content).toBe('string');
		expect(content).toContain('BEGIN:VCALENDAR');
		expect(content).toContain('DESCRIPTION:Test Description');
		expect(content).toContain('LOCATION:Test Location');
		expect(content).toContain('END:VCALENDAR');
	});

	test('should throw error if title is missing', async() => {
		const { generateIcsFromEvent } = await import('@hub-client/logic/calendar.logic');
		const event = {
			title: '',
			description: 'Test Description',
			color: '#FF0000',
			location: 'Test Location',
			isAllDay: false,
			startTime: new Date('2023-10-01T10:00:00Z'),
			endTime: new Date('2023-10-01T11:00:00Z')
		} as unknown as TCalendarEvent;

		expect(() => generateIcsFromEvent(event)).toThrow('event.title is required');
	});

	test('should throw error if startTime is missing', async() => {
		const { generateIcsFromEvent } = await import('@hub-client/logic/calendar.logic');
		const event = {
			title: 'Test Event',
			description: 'Test Description',
			color: '#FF0000',
			location: 'Test Location',
			isAllDay: false,
			startTime: new Date(''), // Invalid date
			endTime: new Date('2023-10-01T11:00:00Z')
		} as unknown as TCalendarEvent;

		const event2 = {
			title: "test",
			description: "",
			color: "#FF0000",
			location: "",
			isAllDay: false,
			startTime: new Date('2023-10-01T11:00:00Z'),
			// @ts-ignore
			endTime: null,
		} as unknown as TCalendarEvent;


		expect(() => generateIcsFromEvent(event2)).toThrow('event.startTime is required');
	});

	test('should throw error if endTime is missing', async () => {
		vi.resetModules();
		const { generateIcsFromEvent } = await import('@hub-client/logic/calendar.logic');
		const event = {
			title: "Test",
			description: "",
			color: "#FF0000",
			location: "",
			isAllDay: false,
			startTime: new Date('2023-10-01T10:00:00Z'),
			// @ts-ignore
			endTime: null,
		} as unknown as TCalendarEvent;

		expect(() => generateIcsFromEvent(event)).toThrow('event.endTime is required');
	});

	test('should include description and location if provided', async () => {
		vi.resetModules();
		const { generateIcsFromEvent } = await import('@hub-client/logic/calendar.logic');
		const event = {
			title: 'Event with Details',
			description: 'Detailed Description',
			color: '#00FF00',
			location: 'Specific Location',
			isAllDay: false,
			startTime: new Date('2023-10-02T14:00:00Z'),
			endTime: new Date('2023-10-02T15:30:00Z')
		} as unknown as TCalendarEvent;

		const filePath = generateIcsFromEvent(event);

		expect(mockFs.existsSync(filePath)).toBe(true);

		const content = mockFs.readFileSync(filePath, 'utf8');
		expect(content).toContain('DESCRIPTION:Detailed Description');
		expect(content).toContain('LOCATION:Specific Location');
	}); 
}); 
