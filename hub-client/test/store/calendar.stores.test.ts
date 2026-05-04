import { useCalendarStore } from '@hub-client/stores/calendar.stores';

import { usePubhubsStore } from '@hub-client/stores/pubhubs';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';
import { PubHubsMgType } from '@hub-client/logic/core/events';
import { RelationType } from '@hub-client/models/constants';

/**
 * Helpers for building stand-ins for matrix-js-sdk MatrixEvent and Room.
 *
 * We don't need the full MatrixEvent surface — the store only calls
 * getType / getContent / getId / getTs / isRedacted. Keeping the stubs small
 * makes the expected shape of each test obvious.
 */
function makeMatrixEvent(opts: {
	type?: string;
	id?: string;
	ts?: number;
	content?: Record<string, unknown>;
	redacted?: boolean;
	unsigned?: Record<string, unknown>;
}) {
	const { type = PubHubsMgType.CalendarEvent, id = '$event:example', ts = 0, content = {}, redacted = false, unsigned } = opts;
	return {
		getType: () => type,
		getId: () => id,
		getTs: () => ts,
		getContent: () => content,
		isRedacted: () => redacted,
		unsigned,
	};
}

function mockRoomWith(pubhubs: any, events: unknown[]) {
	const roomStub = { getLiveTimeline: () => ({ getEvents: () => events }) };
	return vi.spyOn(pubhubs, 'getRoom').mockReturnValue(roomStub as any);
}

/**
 * The store reaches through `pubhubs_store.client.sendEvent` to Matrix. We
 * don't initialise a real client in tests; instead we stub the store's
 * `client` property with a sendEvent mock and return a handle so each test
 * can assert what was sent.
 */
function stubPubhubsClient() {
	const pubhubs = usePubhubsStore() as any;
	const sendEvent = vi.fn(async () => ({ event_id: '$sent:example' }));
	pubhubs.client = { sendEvent };
	return { pubhubs, sendEvent };
}

describe('CalendarStore', () => {
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

	test('addCalendarEvent sends a Matrix event with the PubHubs calendar msgtype', async () => {
		const { sendEvent } = stubPubhubsClient();

		const startTime = new Date('2026-03-29T12:00:00.000Z');
		const endTime = new Date('2026-03-29T13:00:00.000Z');
		const event = new CalendarEvent('Some Event', 'Some cool description', '#4c6b1f', false, startTime, endTime);

		const calendarStore = useCalendarStore();
		await calendarStore.addCalendarEvent('!room:example', event);

		expect(sendEvent).toHaveBeenCalledTimes(1);
		expect(sendEvent).toHaveBeenCalledWith('!room:example', PubHubsMgType.CalendarEvent, {
			msgtype: PubHubsMgType.CalendarEvent,
			body: 'Some Event',
			title: 'Some Event',
			description: 'Some cool description',
			color: '#4c6b1f',
      location: 'Coolest place',
			isAllDay: false,
			startTime: startTime,
			endTime: endTime,
			room: '',
		});
	});

	test('addCalendarEvent forwards optional location / room metadata', async () => {
		const { sendEvent } = stubPubhubsClient();

		const startTime = new Date('2026-03-29T12:00:00.000Z');
		const endTime = new Date('2026-03-29T13:00:00.000Z');
		const event = new CalendarEvent('Team Standup', 'Daily', '#123456', false, startTime, endTime, undefined, 'Room A2.14', 'Engineering');

		const calendarStore = useCalendarStore();
		await calendarStore.addCalendarEvent('!room:example', event);

		expect(sendEvent).toHaveBeenCalledWith(
			'!room:example',
			PubHubsMgType.CalendarEvent,
			expect.objectContaining({ location: 'Room A2.14', room: 'Engineering' }),
		);
	});

	test('editCalendarEvent sends an m.replace edit pointing at the original event', async () => {
		const { sendEvent } = stubPubhubsClient();

		const startTime = new Date('2026-03-29T12:00:00.000Z');
		const endTime = new Date('2026-03-29T13:00:00.000Z');
		const event = new CalendarEvent('Updated Event', 'Updated description', '#5cd0d8', 'New place', false, startTime, endTime);

		const calendarStore = useCalendarStore();
		await calendarStore.editCalendarEvent('!room:example', '$event123', event);

		expect(sendEvent).toHaveBeenCalledTimes(1);
		const [sentRoomId, sentType, sentContent] = sendEvent.mock.calls[0];
		expect(sentRoomId).toBe('!room:example');
		expect(sentType).toBe(PubHubsMgType.CalendarEvent);

		// Matrix edit convention: outer body is prefixed with '* '; the real
		// payload lives in `m.new_content`; the relation targets the original.
		expect(sentContent).toMatchObject({
			msgtype: PubHubsMgType.CalendarEvent,
			body: '* Updated Event',
			'm.relates_to': {
				rel_type: RelationType.Replace,
				event_id: '$event123',
			},
		});

		// `m.new_content` should carry the full updated event without the
		// relation (so a client applying the replacement gets clean content).
		expect(sentContent['m.new_content']).toEqual({
			msgtype: PubHubsMgType.CalendarEvent,
			body: 'Updated Event',
			title: 'Updated Event',
			description: 'Updated description',
			color: '#4c6b1f',
			isAllDay: false,
			startTime,
			endTime,
			location: '#5cd0d8',
			room: 'New place',
		});
	});

	test('delCalendarEvent redacts the event via pubhubs.deleteMessage', async () => {
		const pubhubs = usePubhubsStore() as any;
		const deleteMessage = vi.spyOn(pubhubs, 'deleteMessage').mockResolvedValue(undefined as any);

		const calendarStore = useCalendarStore();
		await calendarStore.delCalendarEvent('!room:example', '$event123');

		expect(deleteMessage).toHaveBeenCalledTimes(1);
		expect(deleteMessage).toHaveBeenCalledWith('!room:example', '$event123');
	});

	test('getCalendarEvents returns only calendar events from the room timeline', async () => {
		const pubhubs = usePubhubsStore() as any;

		const calendarEvent = makeMatrixEvent({
			id: '$event:1',
			content: {
				msgtype: PubHubsMgType.CalendarEvent,
				title: 'Some Event',
				description: 'Some cool description',
				color: '#4c6b1f',
				isAllDay: false,
				startTime: '2026-03-29T12:00:00.000Z',
				endTime: '2026-03-29T13:00:00.000Z',
			},
		});

		const otherEvent = makeMatrixEvent({
			type: 'pubhubs.other',
			content: { foo: 'bar' },
		});

		mockRoomWith(pubhubs, [calendarEvent, otherEvent]);

		const calendarStore = useCalendarStore();
		const events = await calendarStore.getCalendarEvents('!room:example');

		expect(events).toHaveLength(1);
		expect(events[0]).toEqual(
			expect.objectContaining({
				title: 'Some Event',
				description: 'Some cool description',
				color: '#4c6b1f',
				isAllDay: false,
				id: '$event:1',
			}),
		);
		expect(events[0].startTime.toISOString()).toBe('2026-03-29T12:00:00.000Z');
		expect(events[0].endTime.toISOString()).toBe('2026-03-29T13:00:00.000Z');
	});

	test('getCalendarEvents applies the latest m.replace edit to an original event', async () => {
		const pubhubs = usePubhubsStore() as any;

		const original = makeMatrixEvent({
			id: '$event:1',
			ts: 1000,
			content: {
				msgtype: PubHubsMgType.CalendarEvent,
				title: 'Original title',
				description: 'Original desc',
				color: '#000000',
				isAllDay: false,
				startTime: '2026-03-29T12:00:00.000Z',
				endTime: '2026-03-29T13:00:00.000Z',
			},
		});

		const staleEdit = makeMatrixEvent({
			id: '$edit:1',
			ts: 2000,
			content: {
				msgtype: PubHubsMgType.CalendarEvent,
				title: '* stale',
				'm.relates_to': { rel_type: RelationType.Replace, event_id: '$event:1' },
				'm.new_content': {
					msgtype: PubHubsMgType.CalendarEvent,
					title: 'Stale edit',
					description: 'ignored',
					color: '#111111',
					isAllDay: false,
					startTime: '2026-03-29T12:00:00.000Z',
					endTime: '2026-03-29T13:00:00.000Z',
				},
			},
		});

		const latestEdit = makeMatrixEvent({
			id: '$edit:2',
			ts: 3000,
			content: {
				msgtype: PubHubsMgType.CalendarEvent,
				title: '* latest',
				'm.relates_to': { rel_type: RelationType.Replace, event_id: '$event:1' },
				'm.new_content': {
					msgtype: PubHubsMgType.CalendarEvent,
					title: 'Latest title',
					description: 'Latest desc',
					color: '#abcdef',
					isAllDay: true,
					startTime: '2026-04-01T09:00:00.000Z',
					endTime: '2026-04-02T09:00:00.000Z',
					location: 'New hall',
				},
			},
		});

		// Order deliberately shuffled so the test doesn't accidentally rely on
		// array order instead of the ts comparison.
		mockRoomWith(pubhubs, [latestEdit, original, staleEdit]);

		const calendarStore = useCalendarStore();
		const events = await calendarStore.getCalendarEvents('!room:example');

		expect(events).toHaveLength(1);
		expect(events[0]).toEqual(
			expect.objectContaining({
				id: '$event:1',
				title: 'Latest title',
				description: 'Latest desc',
				color: '#abcdef',
				isAllDay: true,
				location: 'New hall',
			}),
		);
		expect(events[0].startTime.toISOString()).toBe('2026-04-01T09:00:00.000Z');
		expect(events[0].endTime.toISOString()).toBe('2026-04-02T09:00:00.000Z');
	});

	test('getCalendarEvents ignores redacted events (isRedacted = true)', async () => {
		const pubhubs = usePubhubsStore() as any;

		const live = makeMatrixEvent({
			id: '$keep:1',
			content: {
				msgtype: PubHubsMgType.CalendarEvent,
				title: 'Visible',
				description: '',
				color: '#111',
				isAllDay: false,
				startTime: '2026-03-29T12:00:00.000Z',
				endTime: '2026-03-29T13:00:00.000Z',
			},
		});

		// Real matrix-js-sdk behaviour after a redaction: isRedacted() is true
		// and getContent() returns an empty object.
		const redacted = makeMatrixEvent({
			id: '$drop:1',
			redacted: true,
			content: {},
		});

		mockRoomWith(pubhubs, [live, redacted]);

		const calendarStore = useCalendarStore();
		const events = await calendarStore.getCalendarEvents('!room:example');

		expect(events).toHaveLength(1);
		expect(events[0].id).toBe('$keep:1');
	});

	test('getCalendarEvents ignores events with the redacted_because unsigned marker', async () => {
		const pubhubs = usePubhubsStore() as any;

		const live = makeMatrixEvent({
			id: '$keep:2',
			content: {
				msgtype: PubHubsMgType.CalendarEvent,
				title: 'Alive',
				description: '',
				color: '#222',
				isAllDay: false,
				startTime: '2026-03-29T12:00:00.000Z',
				endTime: '2026-03-29T13:00:00.000Z',
			},
		});

		// Some codepaths in the repo read `unsigned.redacted_because` directly
		// instead of calling isRedacted(); make sure our filter respects both.
		const redacted = makeMatrixEvent({
			id: '$drop:2',
			content: {},
			unsigned: { redacted_because: { redacts: '$drop:2' } },
		});

		mockRoomWith(pubhubs, [live, redacted]);

		const calendarStore = useCalendarStore();
		const events = await calendarStore.getCalendarEvents('!room:example');

		expect(events.map((e) => e.id)).toEqual(['$keep:2']);
	});

	test('getCalendarEvents throws when the target room is not found', async () => {
		const pubhubs = usePubhubsStore() as any;
		vi.spyOn(pubhubs, 'getRoom').mockReturnValue(undefined as any);

		const calendarStore = useCalendarStore();

		await expect(calendarStore.getCalendarEvents('!room:missing')).rejects.toThrow('Room not found');
	});
});
