// Packages
import { useRooms } from './rooms';
import { defineStore } from 'pinia';

// Services
import { useMatrix } from '@hub-client/composables/matrix.composable';

// Composables

// Logic
import { PubHubsMgType } from '@hub-client/logic/core/events';

// Models
import { TCalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';
// Models
import Room from '@hub-client/models/rooms/Room';

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
		async addCalendarEvent(roomId: string, calEvent: TCalendarEvent) {
			const { sendEvent } = useMatrix();

			const content: TCalendarEvent = {
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

			await sendEvent(roomId, PubHubsMgType.CalendarEvent, content);
		},

		async editCalendarEvent(roomId: string, eventId: string, calEvent: TCalendarEvent) {
			// (!) useMatrixService is not defined/imported, we should take a look at this
			const service = useMatrixService();

			const content = {
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
					console.log(`>> Found an event: ${e}`);
					const content = e.getContent() as TCalendarEvent;
					const eventId = e.getId?.() ?? e.event?.event_id ?? undefined;
					return {
						...content,
						id: eventId,
						startTime: new Date(content.startTime),
						endTime: new Date(content.endTime),
					};
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
