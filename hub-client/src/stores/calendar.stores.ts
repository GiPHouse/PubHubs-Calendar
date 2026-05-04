// Packages
import { useRooms } from './rooms';
import { Room } from 'matrix-js-sdk';
import { defineStore } from 'pinia';

// Composables

// Logic
import { PubHubsMgType } from '@hub-client/logic/core/events';

// Models
import { CalendarEvent, TCalendarEventMessageContent } from '@hub-client/models/events/calendar/TCalendarEvent';

// Stores
import { usePubhubsStore } from '@hub-client/stores/pubhubs';

// Services
import { useMatrix } from '@hub-client/composables/matrix.composable'

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
			const { sendEvent } = useMatrix();

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
			};
			// @ts-ignore similar implementations in pubhubs ignore this error
<<<<<<< linking-funcs
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
=======
			await sendEvent(roomId, PubHubsMgType.CalendarEvent, content);
>>>>>>> matrix-composable-sendevent
		},

		/**
		 * Deletes a calendar event.
		 * @param roomId 
		 * @param eventId 
		 */
		async delCalendarEvent(roomId: string, eventId: string): Promise<void> {
			const { redactEvent } = useMatrix();
			await redactEvent(roomId, eventId);
		},

		/**
<<<<<<< linking-funcs
		 * Get all calendar events in a room. This also checks for replacements, thus
		 * editing events if they still have pending changes.
		 * @param roomId Room to fetch events for.
		 * @returns List of calendar events, formatted to `CalendarEvent`
=======
		 * Get all calendar events for a given room.
		 * 
		 * @param roomId 
		 * @todo Implement an alternative that gets the events hub-wide as opposed to room-wide?
>>>>>>> matrix-composable-sendevent
		 */
		async getCalendarEvents(room: Room): Promise<CalendarEvent[]> {
			console.log('>> store#getCalendarEvents');

			const events = room.getLiveTimeline().getEvents();
			// The `.filter` might be redundent?
			const calendarEvents = events
<<<<<<< linking-funcs
				.filter((e) => e.getType() === PubHubsMgType.CalendarEvent)
				.map((e) => {
					console.log(`>> Found an event: ${e}`);
					const content = e.getContent() as TCalendarEventMessageContent;
=======
				.filter(event => event.getType() === PubHubsMgType.CalendarEvent)
				.map(event => {
					const content = event.getContent() as TCalendarEventMessageContent;
>>>>>>> matrix-composable-sendevent
					return new CalendarEvent(
						content.title,
						content.description,
						content.color,
						content.location,
						content.isAllDay,
						new Date(content.startTime),
<<<<<<< linking-funcs
						new Date(content.endTime),
						'', // id???
						content.location,
						content.room,
=======
						new Date(content.endTime)
>>>>>>> matrix-composable-sendevent
					);
				});

			// In the previous iteration of this method, we also sorted and applied
			// pending edits and what not... I've removed thsoe for MVP's sake. The
			// function is already broken as-is for now anyway...

			// In the future, if need be or preferred, we can add i.e. a sort statement
			// to sort the events by their creation date or whatever!

			return calendarEvents;
		}
	}
})

export { useCalendarStore };