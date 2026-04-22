// Packages
import { defineStore } from 'pinia';

// Composables

// Logic
import { PubHubsMgType } from '@hub-client/logic/core/events';

// Models
import { CalendarEvent, TCalendarEventMessageContent } from '@hub-client/models/events/calendar/TCalendarEvent';

// Services
import { useMatrixService } from '@hub-client/services/matrix.service';

// Stores
import { usePubhubsStore } from '@hub-client/stores/pubhubs';

/**
 * @todo Add other calendar event types, e.g. edit, delete, etc.
 * @see `src/logic/core/events.ts`
 * @see Commit `1a1766`
 */
const useCalendarStore = defineStore('calendar', {
	actions: {
		/**
		 * Adds a calendar event using `sendEvent`.
		 *
		 * NOTE: This should only be called by the calendar composable.
		 * @see `src/composables/calendar.composable.ts`
		 * @param roomId RoomID to send the event in.
		 * @param calEvent
		 */
		async addCalendarEvent(roomId: string, calEvent: CalendarEvent) {
			const service = useMatrixService();

			const content: TCalendarEventMessageContent = {
				msgtype: PubHubsMgType.CalendarEvent,
				body: calEvent.title,
				title: calEvent.title,
				description: calEvent.description,
				color: calEvent.color,
				isAllDay: calEvent.isAllDay,
				startTime: calEvent.startTime,
				endTime: calEvent.endTime,
			};
			// @ts-ignore similar implementations in pubhubs ignore this error
			await service.sendEvent(roomId, PubHubsMgType.CalendarEvent, content);
		},

		async editCalendarEvent(roomId: string, eventId: string, calEvent: CalendarEvent) {
			const service = useMatrixService();

			const content: TCalendarEventMessageContent = {
				msgtype: PubHubsMgType.CalenderEventEdit,
				body: calEvent.title,
				title: calEvent.title,
				description: calEvent.description,
				color: calEvent.color,
				location: calEvent.location ?? '',
				isAllDay: calEvent.isAllDay,
				startTime: calEvent.startTime,
				endTime: calEvent.endTime,
				'm.relates_to': {
					event_id: eventId,
					rel_type: PubHubsMgType.CalenderEventEdit,
				},
			};

			// @ts-ignore similar implementations in pubhubs ignore this error
			await service.sendEvent(roomId, PubHubsMgType.CalenderEventModify, content);
		},

		/**
		 * Deletes a calendar event.
		 * Effectively an alias for deleteMessage, since I expect it to work the same.
		 * @param roomId
		 * @param eventId
		 */
		async delCalendarEvent(roomId: string, eventId: string): Promise<void> {
			const pubhubs_store = usePubhubsStore();
			await pubhubs_store.deleteMessage(roomId, eventId);
		},

		/**
		 * Get all calendar events in a room. This also checks for replacements, thus
		 * editing events if they still have pending changes.
		 * @param roomId Room to fetch events for.
		 * @returns List of calendar events, formatted to `CalendarEvent`
		 */
		async getCalendarEvents(roomId: string): Promise<CalendarEvent[]> {
			const pubhubs_store = usePubhubsStore();
			const room = pubhubs_store.getRoom(roomId);
			if (!room) {
				throw new Error('Room not found');
			}

			const events = room.getLiveTimeline().getEvents();

			type Original = {
				id: string;
				ts: number;
				content: TCalendarEventMessageContent;
			};
			const originals: Original[] = [];
			const latestReplacements = new Map<string, { ts: number; content: TCalendarEventMessageContent }>();

			for (const ev of events) {
				if (ev.getType() !== PubHubsMgType.CalendarEvent) continue;
				if (isRedactedEvent(ev)) continue;

				const content = ev.getContent() as TCalendarEventMessageContent;
				if (!content || !content.title) continue;

				const ts = ev.getTs() ?? 0;
				const relatesTo = content['m.relates_to'];

				// Resolve possible pending edit
				if (relatesTo && (relatesTo.rel_type as unknown as string) === RelationType.Replace) {
					const newContent = content['m.new_content'] as TCalendarEventMessageContent | undefined;
					if (!newContent) continue;

					const existing = latestReplacements.get(relatesTo.event_id);
					if (!existing || ts > existing.ts) {
						// todo: multiple replacements might break?
						latestReplacements.set(relatesTo.event_id, { ts, content: newContent });
					}
					continue;
				}

				const id = typeof ev.getId === 'function' ? (ev.getId() ?? '') : '';
				originals.push({ id, ts, content });
			}

			return originals
				.map(({ id, content }) => {
					const replacement = id ? latestReplacements.get(id) : undefined;
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
				})
				.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
		},
	},
});

export { useCalendarStore };
