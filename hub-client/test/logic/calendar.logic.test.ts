/// <reference types="vitest" />
// @vitest-environment node

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol, createFsFromVolume, Volume } from 'memfs';
import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';
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

	test('should throw error if startTime is missing', async() => {
		const { generateIcsFromEvent } = await import('@hub-client/logic/calendar.logic');
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

	test('should throw error if endTime is missing', async () => {
		vi.resetModules();
		const { generateIcsFromEvent } = await import('@hub-client/logic/calendar.logic');
		const event = new CalendarEvent('Test', '', '#FF0000');
		// @ts-ignore
		event.endTime = null;

		expect(() => generateIcsFromEvent(event)).toThrow('event.endTime is required');
	});

	test('should include description and location if provided', async () => {
		vi.resetModules();
		const { generateIcsFromEvent } = await import('@hub-client/logic/calendar.logic');
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

		expect(mockFs.existsSync(filePath)).toBe(true);

		const content = mockFs.readFileSync(filePath, 'utf8');
		expect(content).toContain('DESCRIPTION:Detailed Description');
		expect(content).toContain('LOCATION:Specific Location');
	}); 
}); 
