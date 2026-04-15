import { useCalendarEvents } from '@hub-client/composables/calendar.composable';

import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const { addCalendarEventMock, delCalendarEventMock } = vi.hoisted(() => ({
    addCalendarEventMock: vi.fn(async () => undefined),
    delCalendarEventMock: vi.fn(async () => undefined),
}));

vi.mock('@hub-client/stores/calendar.stores', () => ({
    useCalendarStore: vi.fn(() => ({
        addCalendarEvent: addCalendarEventMock,
        delCalendarEvent: delCalendarEventMock,
    })),
}));

describe('CalendarComposable', () => {
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
                location: 'Conference Room',
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