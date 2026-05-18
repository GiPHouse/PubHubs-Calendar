import { useCalendarStore } from '@hub-client/stores/calendar.stores';

import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { TCalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';
import { PubHubsMgType } from '@hub-client/logic/core/events';
import { initMatrixService } from '@hub-client/services/matrix.service';
import { usePubhubsStore } from '@hub-client/stores/pubhubs';

describe("Calendar Store", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns a store object in the default situation', () => {
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

		const event: TCalendarEvent = {
			msgtype: PubHubsMgType.CalendarEvent,
			body: 'Some Event',
			title: 'Some Event',
			description: 'Some cool description',
			color: '#3788d8',
			startTime,
			endTime,
			isAllDay: false,
		};

		await calendarStore.addCalendarEvent('!room:example', event);

		expect(sendEventMock).toHaveBeenCalledTimes(1);
		expect(sendEventMock).toHaveBeenCalledWith('!room:example', PubHubsMgType.CalendarEvent, {
			msgtype: PubHubsMgType.CalendarEvent,
			body: 'Some Event',
			title: 'Some Event',
			description: 'Some cool description',
			color: '#3788d8',
			location: undefined,
			startTime,
			endTime,
			isAllDay: false,
		});
	});

	test('editCalendarEvent sends modify event and deletes the original calendar event', async () => {
		const sendEventMock = vi.fn(async () => ({}));
		const matrixServiceStub = initMatrixService({} as any);
		(matrixServiceStub as any).sendEvent = sendEventMock;

		const pubhubs = usePubhubsStore() as any;
		const deleteMessageMock = vi.spyOn(pubhubs, 'deleteMessage').mockResolvedValue(undefined as any);

		const calendarStore = useCalendarStore();
		const startTime = new Date('2026-03-29T12:00:00.000Z');
		const endTime = new Date('2026-03-29T13:00:00.000Z');
		// const event = new CalendarEvent('Some Event', 'Some cool description', '#3788d8', false, startTime, endTime);
		const event: TCalendarEvent = {
			msgtype: PubHubsMgType.CalendarEvent,
			body: 'Some Event',
			title: 'Some Event',
			description: 'Some cool description',
			color: '#3788d8',
			startTime,
			endTime,
			isAllDay: false,
		};

		await calendarStore.editCalendarEvent('!room:example', '$event123', event);

		expect(sendEventMock).toHaveBeenCalledTimes(1);
		expect(sendEventMock).toHaveBeenCalledWith('!room:example', PubHubsMgType.CalenderEventModify, {
			msgtype: PubHubsMgType.CalenderEventEdit,
			body: 'Some Event',
			title: 'Some Event',
			description: 'Some cool description',
			color: '#3788d8',
			location: '',
			isAllDay: false,
			startTime,
			endTime,
			'm.relates_to': {
				event_id: '$event123',
				rel_type: PubHubsMgType.CalenderEventEdit,
			},
		});
		expect(deleteMessageMock).toHaveBeenCalledTimes(1);
		expect(deleteMessageMock).toHaveBeenCalledWith('!room:example', '$event123');
	});

	test('delCalendarEvent redacts the event via the pubhubs store', async () => {
		const pubhubs = usePubhubsStore() as any;
		const delMessageMock = vi.spyOn(pubhubs, 'deleteMessage').mockResolvedValue(undefined as any);

		const calendarStore = useCalendarStore();
		await calendarStore.delCalendarEvent('!room:example', '$event123');

		expect(delMessageMock).toHaveBeenCalledTimes(1);
		expect(delMessageMock).toHaveBeenCalledWith('!room:example', '$event123');
	});

	test('getCalendarEvents returns only calendar events from the room timeline', async () => {
		const pubhubs = usePubhubsStore() as any;
		const mockCalendarEvent = {
			getType: () => PubHubsMgType.CalendarEvent,
			getId: () => '$event123',
			getContent: () => ({
				msgtype: PubHubsMgType.CalendarEvent,
				title: 'Some Event',
				description: 'Some cool description',
				color: '#4c6b1f',
				isAllDay: false,
				startTime: '2026-03-29T12:00:00.000Z',
				endTime: '2026-03-29T13:00:00.000Z',
			}),
		}

		const mockRoom = {
			getLiveTimeline: () => ({
				getEvents: () => [mockCalendarEvent],
			}),
		}

		// Have getRoom return the mock room so that we don't need to run a "real" hub
		vi.spyOn(pubhubs, 'getRoom').mockReturnValue(mockRoom as any);

		const calendarStore = useCalendarStore();
		const events = await calendarStore.getCalendarEvents(mockRoom as any);

		expect(events).toHaveLength(1);
		expect(events[0]).toEqual(
			expect.objectContaining({
				title: 'Some Event',
				description: 'Some cool description',
				color: '#4c6b1f',
				isAllDay: false,
				id: '$event123',
			}),
		);
		expect(events[0].startTime.toISOString()).toBe('2026-03-29T12:00:00.000Z');
		expect(events[0].endTime.toISOString()).toBe('2026-03-29T13:00:00.000Z');
	});

	test('getCalendarEvents throws when the target room is not found', async () => {
		const pubhubs = usePubhubsStore() as any;
		vi.spyOn(pubhubs, 'getRoom').mockReturnValue(undefined as any);

		const calendarStore = useCalendarStore();
		await expect(calendarStore.getCalendarEvents(undefined as any)).rejects.toThrow('Room not found');
	});
});
