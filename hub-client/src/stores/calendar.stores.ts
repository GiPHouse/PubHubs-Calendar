// Packages
import { defineStore } from 'pinia';

// Composables

// Logic
import { PubHubsMgType } from '@hub-client/logic/core/events';

// Models
import { CalendarEvent, TCalendarEventMessageContent } from '@hub-client/models/events/calendar/TCalendarEvent';

// Stores
import { usePubhubsStore } from '@hub-client/stores/pubhubs';

// Services
import { useMatrixService } from '@hub-client/services/matrix.service';

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
			const service = useMatrixService()
			if (!service) {
				throw new Error('Matrix service not initialised')
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
			await service.sendEvent(roomId, PubHubsMgType.CalendarEvent, content);
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
		 * Get all calendar events for a given room.
		 * 
		 * @param roomId 
		 * @todo Implement an alternative that gets the events hub-wide as opposed to room-wide?
		 */
		async getCalendarEvents(roomId: string): Promise<CalendarEvent[]> {
			const pubhubs_store = usePubhubsStore()

			const room = pubhubs_store.getRoom(roomId);
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