// Packages
import { useRooms } from './rooms';
import { Room } from 'matrix-js-sdk';
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
				location: calEvent.location,
				isAllDay: calEvent.isAllDay,
				startTime: calEvent.startTime,
				endTime: calEvent.endTime,
				location: calEvent.location,
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
			await this.delCalendarEvent(roomId, eventId);
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
		async getCalendarEvents(room: Room): Promise<CalendarEvent[]> {
			console.log('>> store#getCalendarEvents');

			if (!room) {
				throw new Error('Room not found');
			}

			const events = room.getLiveTimeline().getEvents();
			// The `.filter` might be redundent?
			const calendarEvents = events
				.filter((e) => e.getType() === PubHubsMgType.CalendarEvent)
				.map((e) => {
					console.log(`>> Found an event: ${e}`);
					const content = e.getContent() as TCalendarEventMessageContent;
					const eventId = e.getId?.() ?? e.event?.event_id ?? undefined;
					return new CalendarEvent(content.title, content.description, content.color, content.isAllDay, new Date(content.startTime), new Date(content.endTime), eventId, content.location, content.room);
				});

			// In the previous iteration of this method, we also sorted and applied
			// pending edits and what not... I've removed thsoe for MVP's sake. The
			// function is already broken as-is for now anyway...

			// In the future, if need be or preferred, we can add i.e. a sort statement
			// to sort the events by their creation date or whatever!

			return calendarEvents;
		},
	},
});

export { useCalendarStore };
