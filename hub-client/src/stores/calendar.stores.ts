// Packages
import { defineStore } from 'pinia';

// Logic
import { PubHubsMgType } from '@hub-client/logic/core/events';

// Models
import { RelationType } from '@hub-client/models/constants';
import { CalendarEvent, TCalendarEventMessageContent } from '@hub-client/models/events/calendar/TCalendarEvent';

// Stores
import { usePubhubsStore } from '@hub-client/stores/pubhubs';

/**
 * Calendar store — stores and retrieves calendar events as custom Matrix room
 * timeline events (Matrix-native design). See the Matrix-native plan for the
 * rationale and the contract with the UI layer.
 *
 * Wire format: every calendar event uses `PubHubsMgType.CalendarEvent` as
 * msgtype. Edits are sent as a replacement (`m.relates_to.rel_type: m.replace`
 * + `m.new_content`) following the Matrix edit convention so that
 * matrix-js-sdk's edit handling works automatically. Deletions are redactions,
 * handled via `pubhubs_store.deleteMessage`.
 *
 * @see `src/logic/core/events.ts`
 */
const useCalendarStore = defineStore('calendar', {
	actions: {
		/**
		 * Adds a calendar event to the given room by sending a Matrix custom
		 * event with msgtype `pubhubs.calendar_event.event`.
		 *
		 * NOTE: This should only be called by the calendar composable — the
		 * composable is responsible for validating the payload.
		 * @see `src/composables/calendar.composable.ts`
		 */
		async addCalendarEvent(roomId: string, calEvent: CalendarEvent) {
			const pubhubs_store = usePubhubsStore();

			const content: TCalendarEventMessageContent = {
				msgtype: PubHubsMgType.CalendarEvent,
				body: calEvent.title,
				title: calEvent.title,
				description: calEvent.description,
				color: calEvent.color,
				isAllDay: calEvent.isAllDay,
				startTime: calEvent.startTime,
				endTime: calEvent.endTime,
				location: calEvent.location ?? '',
				room: calEvent.room ?? '',
			};

			// @ts-ignore — custom msgtype not in matrix-js-sdk's TimelineEvents union.
			await pubhubs_store.client.sendEvent(roomId, PubHubsMgType.CalendarEvent, content);
		},

		/**
		 * Edits an existing calendar event by sending a Matrix `m.replace`
		 * edit targeting the original event. We reuse `PubHubsMgType.CalendarEvent`
		 * as the outer msgtype so the server-side auth rules treat it uniformly.
		 */
		async editCalendarEvent(roomId: string, eventId: string, calEvent: CalendarEvent) {
			const pubhubs_store = usePubhubsStore();

			const newContent: TCalendarEventMessageContent = {
				msgtype: PubHubsMgType.CalendarEvent,
				body: calEvent.title,
				title: calEvent.title,
				description: calEvent.description,
				color: calEvent.color,
				isAllDay: calEvent.isAllDay,
				startTime: calEvent.startTime,
				endTime: calEvent.endTime,
				location: calEvent.location ?? '',
				room: calEvent.room ?? '',
			};

			// Matrix edit convention: outer body is prefixed with '* ' for
			// clients that don't understand the replacement, and the actual
			// new content goes in `m.new_content`.
			const content: TCalendarEventMessageContent = {
				...newContent,
				body: `* ${calEvent.title}`,
				'm.relates_to': {
					rel_type: RelationType.Replace as unknown as PubHubsMgType,
					event_id: eventId,
				},
				'm.new_content': newContent,
			};

			// @ts-ignore — custom msgtype not in matrix-js-sdk's TimelineEvents union.
			await pubhubs_store.client.sendEvent(roomId, PubHubsMgType.CalendarEvent, content);
		},

		/**
		 * Deletes a calendar event by redacting it. `deleteMessage` sends an
		 * `m.room.redaction`, which strips the content; `getCalendarEvents`
		 * filters redacted events back out.
		 */
		async delCalendarEvent(roomId: string, eventId: string): Promise<void> {
			const pubhubs_store = usePubhubsStore();
			await pubhubs_store.deleteMessage(roomId, eventId);
		},

		/**
		 * Returns all calendar events for `roomId`, with edits collapsed into
		 * the original event and redacted events filtered out.
		 *
		 * Traversal:
		 *  1. Bucket every `PubHubsMgType.CalendarEvent` in the room's live
		 *     timeline by id. Skip events that look redacted (empty content
		 *     or explicit `redacted_because` metadata).
		 *  2. Separate the originals (no `m.relates_to`) from the replacement
		 *     events (`m.relates_to.rel_type === 'm.replace'`).
		 *  3. For each original, find the *latest* replacement targeting it
		 *     (by origin server timestamp), and apply its `m.new_content`.
		 *  4. Hydrate each merged content object into a `CalendarEvent`.
		 */
		async getCalendarEvents(roomId: string): Promise<CalendarEvent[]> {
			const pubhubs_store = usePubhubsStore();

			const room = pubhubs_store.getRoom(roomId);
			if (!room) {
				throw new Error('Room not found');
			}

			const events = room.getLiveTimeline().getEvents();

			// Pass 1: collect originals and replacements keyed by target id.
			type Original = {
				id: string;
				ts: number;
				content: TCalendarEventMessageContent;
			};
			const originals: Original[] = [];
			const latestReplacement = new Map<string, { ts: number; content: TCalendarEventMessageContent }>();

			for (const ev of events) {
				if (ev.getType() !== PubHubsMgType.CalendarEvent) continue;
				if (isRedactedEvent(ev)) continue;

				const content = ev.getContent() as TCalendarEventMessageContent;
				// An event with empty content that wasn't explicitly flagged
				// redacted is still not a usable calendar event — ignore it.
				if (!content || !content.title) continue;

				const ts = typeof ev.getTs === 'function' ? ev.getTs() : 0;
				const relatesTo = content['m.relates_to'];

				if (relatesTo && (relatesTo.rel_type as unknown as string) === RelationType.Replace) {
					const newContent = (content as any)['m.new_content'] as TCalendarEventMessageContent | undefined;
					if (!newContent) continue;
					const existing = latestReplacement.get(relatesTo.event_id);
					if (!existing || ts > existing.ts) {
						latestReplacement.set(relatesTo.event_id, { ts, content: newContent });
					}
					continue;
				}

				const id = typeof ev.getId === 'function' ? (ev.getId() ?? '') : '';
				originals.push({ id, ts, content });
			}

			// Pass 2: apply the latest replacement per original.
			return originals.map(({ id, content }) => {
				const replacement = id ? latestReplacement.get(id) : undefined;
				const finalContent = replacement ? replacement.content : content;

				return new CalendarEvent(
					finalContent.title,
					finalContent.description,
					finalContent.color,
					finalContent.isAllDay,
					new Date(finalContent.startTime),
					new Date(finalContent.endTime),
					id,
					finalContent.location ?? '',
					finalContent.room ?? '',
				);
			});
		},
	},
});

/**
 * Best-effort check that a matrix-js-sdk event has been redacted. We use
 * `isRedacted()` when available (production path) and fall back to checking
 * for the `redacted_because` unsigned marker or empty content so that tests
 * can pass plain objects without stubbing the whole MatrixEvent surface.
 */
function isRedactedEvent(ev: any): boolean {
	if (typeof ev?.isRedacted === 'function' && ev.isRedacted()) return true;
	if (ev?.unsigned?.redacted_because) return true;
	if (typeof ev?.getUnsigned === 'function' && ev.getUnsigned()?.redacted_because) return true;
	return false;
}

export { useCalendarStore };
