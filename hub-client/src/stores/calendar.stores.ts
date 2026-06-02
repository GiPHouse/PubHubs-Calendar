// Packages
import { useRooms } from './rooms';
import { defineStore } from 'pinia';

// Services
import { useMatrix } from '@hub-client/composables/matrix.composable';

// Logic
import { PubHubsMgType } from '@hub-client/logic/core/events';

// Models
import { TCalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';
// Models
import Room from '@hub-client/models/rooms/Room';

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
		async addCalendarEvent(roomId: string, calEvent: TCalendarEvent) {
			const { sendEvent } = useMatrix();
			await sendEvent(roomId, PubHubsMgType.CalendarEvent, calEvent);
		},

		async editCalendarEvent(roomId: string, eventId: string, calEvent: TCalendarEvent) {
			await this.addCalendarEvent(roomId, calEvent);
			await this.delCalendarEvent(roomId, eventId);
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
		 * Get all calendar events in a room. This also checks for replacements, thus
		 * editing events if they still have pending changes.
		 * @param roomId Room to fetch events for.
		 * @returns List of calendar events, formatted to `TCalendarEvent & { id?: string }`
		 */
		async getCalendarEvents(room: Room): Promise<(TCalendarEvent & { id?: string })[]> {
			console.log('>> store#getCalendarEvents');

			if (!useRooms().rooms[room.roomId]) throw 'Room not found';

			const events = room.getLiveTimelineEventsCalendar();
			// The `.filter` might be redundent?
			const calendarEvents = events
				.filter((e) => e.getType() === PubHubsMgType.CalendarEvent)
				.map((e) => {
					const content = e.getContent() as TCalendarEvent;
					const eventId = e.getId?.() ?? e.event?.event_id ?? undefined;
					return {
						...content,
						id: eventId,
						startTime: new Date(content.startTime),
						endTime: new Date(content.endTime),
					};
				});

			return calendarEvents;
		},
	},
});

export { useCalendarStore };
