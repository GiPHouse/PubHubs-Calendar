// Packages
import { defineStore } from 'pinia';

// Composables
import { useMatrix } from "@hub-client/composables/matrix.composable"

// Logic
import { PubHubsMgType } from '@hub-client/logic/core/events';

// Models
import { CalendarEvent, TCalendarEventMessageContent } from '@hub-client/models/events/calendar/TCalendarEvent';

// Stores
/* At the moment we call our own client with useUser.
 * The client instructed us to use composables/matrix.composable.ts for client methods.
 * However I don't see a sendEvent method or a way to retrieve the client used in matrix composable...
 * This implementation should change when we understand the problem better. */
import { useUser } from '@hub-client/stores/user'

// Types

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
			const user = useUser()
			if (!user.client) {
				throw new Error('User client not initialised')
			}

			const content: TCalendarEventMessageContent = {
				msgtype: PubHubsMgType.CalendarEvent,
				body: calEvent.title,
				title: calEvent.title,
				description: calEvent.description,
				startTime: calEvent.startTime,
				endTime: calEvent.endTime,
			};
			// @ts-ignore similar implementations in pubhubs ignore this error
			await user.client.sendEvent(roomId, PubHubsMgType.CalendarEvent, content);
		},

		/**
		 * Get all calendar events for a given room.
		 * 
		 * @param roomId 
		 * @todo Implement an alternative that gets the events hub-wide as opposed to room-wide?
		 */
		async getCalendarEvents(roomId: string): Promise<CalendarEvent[]> {
			const user = useUser()
			if (!user.client) {
				throw new Error('User client not initialised')
			}

			const room = user.client.getRoom(roomId);
			if (!room) {
				throw new Error('Room not found')
			}

			const events = room.getLiveTimeline().getEvents();
			const calendarEvents = events
				.filter(event => event.getType() === PubHubsMgType.CalendarEvent)
				.map(event => {
					const content = event.getContent() as TCalendarEventMessageContent;
					return new CalendarEvent(
						content.title,
						content.description,
						new Date(content.startTime),
						new Date(content.endTime)
					);
				});

			return calendarEvents;
		}
	}
})

export { useCalendarStore };