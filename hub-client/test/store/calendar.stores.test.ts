import { useCalendarStore } from "@hub-client/stores/calendar.stores";

import { usePubhubsStore } from '@hub-client/stores/pubhubs';
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi, afterEach } from "vitest";
import { initMatrixService } from '@hub-client/services/matrix.service';
import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';
import { PubHubsMgType } from '@hub-client/logic/core/events';

describe('CalendarStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('default situation returns a store object', () => {
        const calendarStore = useCalendarStore();
        expect(calendarStore).toBeTypeOf('object');
    });

    test('addCalendarEvent sends correct matrix event content', async () => {
        const sendEventMock = vi.fn(async () => ({}));
        const matrixServiceStub = initMatrixService({} as any);
        (matrixServiceStub as any).sendEvent = sendEventMock;

        const calendarStore = useCalendarStore();
        const startTime = new Date('2026-03-29T12:00:00.000Z');
        const endTime = new Date('2026-03-29T13:00:00.000Z');

        const event = new CalendarEvent('Some Event', 'Some cool description', '#4c6b1f', 'Coolest place', false, startTime, endTime);

        await calendarStore.addCalendarEvent('!room:example', event);

        expect(sendEventMock).toHaveBeenCalledTimes(1);
        expect(sendEventMock).toHaveBeenCalledWith('!room:example', PubHubsMgType.CalendarEvent, {
            msgtype: PubHubsMgType.CalendarEvent,
            body: 'Some Event',
            title: 'Some Event',
            description: 'Some cool description',
            location: 'Coolest place',
            color: '#4c6b1f',
            isAllDay: false,
            startTime: startTime,
            endTime: endTime,
        });
    });

    test('editCalendarEvent sends modify matrix event content with relation', async () => {
        const sendEventMock = vi.fn(async () => ({}));
        const matrixServiceStub = initMatrixService({} as any);
        (matrixServiceStub as any).sendEvent = sendEventMock;

        const calendarStore = useCalendarStore();
        const startTime = new Date('2026-03-29T12:00:00.000Z');
        const endTime = new Date('2026-03-29T13:00:00.000Z');

        const event = new CalendarEvent('Updated Event', 'Updated description', '#5cd0d8', 'New place', false, startTime, endTime);

        await calendarStore.editCalendarEvent('!room:example', '$event123', event);

        expect(sendEventMock).toHaveBeenCalledTimes(1);
        expect(sendEventMock).toHaveBeenCalledWith('!room:example', PubHubsMgType.CalenderEventModify, {
            msgtype: PubHubsMgType.CalenderEventEdit,
            body: 'Updated Event',
            title: 'Updated Event',
            description: 'Updated description',
            color: '#5cd0d8',
            location: 'New place',
            isAllDay: false,
            startTime: startTime,
            endTime: endTime,
            'm.relates_to': {
                event_id: '$event123',
                rel_type: PubHubsMgType.CalenderEventEdit,
            },
        });
    });

    test('delCalendarEvent calls pubhubs.deleteMessage', async () => {
        const pubhubs = usePubhubsStore() as any;
        const deleteMessageMock = vi.spyOn(pubhubs, 'deleteMessage').mockResolvedValue(undefined);

        const calendarStore = useCalendarStore();
        await calendarStore.delCalendarEvent('!room:example', '$event123');

        expect(deleteMessageMock).toHaveBeenCalledTimes(1);
        expect(deleteMessageMock).toHaveBeenCalledWith('!room:example', '$event123');
    });

    test('getCalendarEvents returns only calendar events from room timeline', async () => {
        const pubhubs = usePubhubsStore() as any;

        const mockCalendarMatrixEvent = {
            getType: () => PubHubsMgType.CalendarEvent,
            getContent: () => ({
                title: 'Some Event',
                description: 'Some cool description',
                color: '#4c6b1f',
                location: 'Some cool place',
                isAllDay: false,
                startTime: '2026-03-29T12:00:00.000Z',
                endTime: '2026-03-29T13:00:00.000Z',
            }),
        };

        const mockNonCalendarEvent = {
            getType: () => 'pubhubs.other',
            getContent: () => ({ foo: 'bar' }),
        };

        const roomStub = {
            getLiveTimeline: () => ({
                getEvents: () => [mockCalendarMatrixEvent, mockNonCalendarEvent],
            }),
        };

        vi.spyOn(pubhubs, 'getRoom').mockReturnValue(roomStub);

        const calendarStore = useCalendarStore();
        const events = await calendarStore.getCalendarEvents('!room:example');

        expect(events).toHaveLength(1);
        expect(events[0]).toEqual(expect.objectContaining({
            title: 'Some Event',
            description: 'Some cool description',
            color: '#4c6b1f',
            location: 'Some cool place',
            isAllDay: false,
        }));
        expect(events[0].startTime.toISOString()).toBe('2026-03-29T12:00:00.000Z');
        expect(events[0].endTime.toISOString()).toBe('2026-03-29T13:00:00.000Z');
    });

    test('getCalendarEvents throws when room is not found', async () => {
        const pubhubs = usePubhubsStore() as any;
        vi.spyOn(pubhubs, 'getRoom').mockReturnValue(undefined);

        const calendarStore = useCalendarStore();

        await expect(calendarStore.getCalendarEvents('!room:missing')).rejects.toThrow('Room not found');
    });
});