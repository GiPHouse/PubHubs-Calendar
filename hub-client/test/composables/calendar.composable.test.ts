import { useCalendarEvents } from '@hub-client/composables/calendar.composable';

import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

/**
 * The composable under test exists to validate input and forward to the
 * calendar store. We replace the store module wholesale so the tests only
 * exercise validation behaviour, not Matrix plumbing.
 */
const { addCalendarEventMock, delCalendarEventMock, updateCalendarEventMock, getCalendarEventsMock } = vi.hoisted(() => ({
	addCalendarEventMock: vi.fn(async () => undefined),
	delCalendarEventMock: vi.fn(async () => undefined),
	updateCalendarEventMock: vi.fn(async () => undefined),
	getCalendarEventsMock: vi.fn(async () => [] as CalendarEvent[]),
}));

vi.mock('@hub-client/stores/calendar.stores', () => ({
	useCalendarStore: vi.fn(() => ({
		addCalendarEvent: addCalendarEventMock,
		delCalendarEvent: delCalendarEventMock,
		editCalendarEvent: updateCalendarEventMock,
		getCalendarEvents: getCalendarEventsMock,
	})),
}));

describe('CalendarComposable', () => {
<<<<<<< linking-funcs
	beforeEach(() => {
		setActivePinia(createPinia());
		addCalendarEventMock.mockClear();
		delCalendarEventMock.mockClear();
		updateCalendarEventMock.mockClear();
		getCalendarEventsMock.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('createCalendarEvent validates, trims, and forwards the event to the store', async () => {
		const { createCalendarEvent } = useCalendarEvents();

		const startTime = new Date('2026-04-08T15:30:00.000Z');
		const endTime = new Date('2026-04-08T18:00:00.000Z');

		// Inputs are deliberately padded with whitespace. validateEvent is
		// expected to trim them before handing off.
		const event = new CalendarEvent('  SWE Meeting  ', '  Weekly planning  ', '   #bf5cd8   ', false, startTime, endTime);

		await createCalendarEvent('!room:example', event);

		expect(addCalendarEventMock).toHaveBeenCalledTimes(1);
		expect(addCalendarEventMock).toHaveBeenCalledWith(
			'!room:example',
			expect.objectContaining({
				title: 'SWE Meeting',
				description: 'Weekly planning',
				color: '#bf5cd8',
				isAllDay: false,
				startTime,
				endTime,
			}),
		);
	});

	test('createCalendarEvent preserves id / location / room metadata through validation', async () => {
		const { createCalendarEvent } = useCalendarEvents();

		const start = new Date('2026-04-08T15:30:00.000Z');
		const end = new Date('2026-04-08T16:00:00.000Z');
		const event = new CalendarEvent('Demo', 'Short demo', '#123456', false, start, end, '$evt:1', 'A2.14', 'Engineering');

		await createCalendarEvent('!room:example', event);

		expect(addCalendarEventMock).toHaveBeenCalledWith(
			'!room:example',
			expect.objectContaining({ id: '$evt:1', location: 'A2.14', room: 'Engineering' }),
		);
	});

	test('updateCalendarEvent validates and forwards the event to the store', async () => {
		const { updateCalendarEvent } = useCalendarEvents();

		const startTime = new Date('2026-04-08T15:30:00.000Z');
		const endTime = new Date('2026-04-08T18:00:00.000Z');
		const event = new CalendarEvent('  Updated Event  ', '  Updated description  ', '#123456', true, startTime, endTime);

		await updateCalendarEvent('!room:example', '$event123', event);

		expect(updateCalendarEventMock).toHaveBeenCalledTimes(1);
		expect(updateCalendarEventMock).toHaveBeenCalledWith(
			'!room:example',
			'$event123',
			expect.objectContaining({
				title: 'Updated Event',
				description: 'Updated description',
				color: '#123456',
				isAllDay: true,
				startTime,
				endTime,
			}),
		);
	});

	test('removeCalendarEvent forwards to the store delete action', async () => {
		const { removeCalendarEvent } = useCalendarEvents();

		await removeCalendarEvent('!room:example', '$event123');

		expect(delCalendarEventMock).toHaveBeenCalledTimes(1);
		expect(delCalendarEventMock).toHaveBeenCalledWith('!room:example', '$event123');
	});

	test('getCalendarEvents passes through the store response', async () => {
		const loaded = [new CalendarEvent('A', '', '#123456', false, new Date('2026-04-08T15:30:00.000Z'), new Date('2026-04-08T16:00:00.000Z'), '$a')];
		getCalendarEventsMock.mockResolvedValueOnce(loaded);

		const { getCalendarEvents } = useCalendarEvents();
		await expect(getCalendarEvents('!room:example')).resolves.toBe(loaded);
		expect(getCalendarEventsMock).toHaveBeenCalledWith('!room:example');
	});

	describe('validation errors', () => {
		const baseStart = new Date('2026-04-08T15:30:00.000Z');
		const baseEnd = new Date('2026-04-08T16:00:00.000Z');

		test('rejects events with an empty title', async () => {
			const { createCalendarEvent } = useCalendarEvents();
			const event = new CalendarEvent('   ', 'desc', '#123456', false, baseStart, baseEnd);
			await expect(createCalendarEvent('!room:example', event)).rejects.toThrow('title is required');
			expect(addCalendarEventMock).not.toHaveBeenCalled();
		});

		test('rejects events with an invalid hex colour', async () => {
			const { createCalendarEvent } = useCalendarEvents();
			const event = new CalendarEvent('Ok', 'desc', 'not-a-colour', false, baseStart, baseEnd);
			await expect(createCalendarEvent('!room:example', event)).rejects.toThrow('hexadecimal');
			expect(addCalendarEventMock).not.toHaveBeenCalled();
		});

		test('rejects events whose end is not after the start', async () => {
			const { createCalendarEvent } = useCalendarEvents();
			const event = new CalendarEvent('Ok', 'desc', '#123456', false, baseEnd, baseStart);
			await expect(createCalendarEvent('!room:example', event)).rejects.toThrow('end time must be after start time');
			expect(addCalendarEventMock).not.toHaveBeenCalled();
		});
	});
});
=======
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('createCalendarEvent validates and forwards event to store', async () => {
        const { createCalendarEvent } = useCalendarEvents();

        const startTime = new Date('2026-04-08T15:30:00.000Z');
        const endTime = new Date('2026-04-08T18:00:00.000Z');
        const event = new CalendarEvent('  SWE Meeting  ', '  Weekly planning  ', '   #bf5cd8 ', '  Conference Room  ', false, startTime, endTime);

        await createCalendarEvent('!room:example', event);

        expect(addCalendarEventMock).toHaveBeenCalledTimes(1);
        expect(addCalendarEventMock).toHaveBeenCalledWith(
            '!room:example',
            expect.objectContaining({
                title: 'SWE Meeting',
                description: 'Weekly planning',
                color: '#bf5cd8',
                location: 'The Launch',
                isAllDay: false,
                startTime,
                endTime,
            })
        );
    });

    test('updateCalendarEvent validates and forwards event to store', async () => {
        const { updateCalendarEvent } = useCalendarEvents();

        const startTime = new Date('2026-04-08T15:30:00.000Z');
        const endTime = new Date('2026-04-08T18:00:00.000Z');
        const event = new CalendarEvent('  Updated Event  ', '  Updated description  ', '#5cd0d8', ' New location', false, startTime, endTime);

        await updateCalendarEvent('!room:example', '$event123', event);

        expect(updateCalendarEventMock).toHaveBeenCalledTimes(1);
        expect(updateCalendarEventMock).toHaveBeenCalledWith(
            '!room:example',
            '$event123',
            expect.objectContaining({
                title: 'Updated Event',
                description: 'Updated description',
                color: '#5cd0d8',
                isAllDay: false,
                startTime,
                endTime,
            })
        );
    });

    test('removeCalendarEvent calls store delete action', async () => {
        const { removeCalendarEvent } = useCalendarEvents();

        await removeCalendarEvent('!room:example', '$event123');

        expect(delCalendarEventMock).toHaveBeenCalledTimes(1);
        expect(delCalendarEventMock).toHaveBeenCalledWith('!room:example', '$event123');
    });
});
>>>>>>> matrix-composable-sendevent
