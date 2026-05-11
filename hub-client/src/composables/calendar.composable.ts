// Packages
// Composables
// Logic
// Stores
// Models
import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';

import { useCalendarStore } from '@hub-client/stores/calendar.stores';
import { Room } from '@hub-client/stores/rooms';

/* This file is the composable for calendar events.
 * This means that this file should handle use-case and UI-related logic.
 * The functions under useCalendarEvents() should be called when interacting with the API,
 *   e.g. when creating a calendar event.
 */

/**
 * Validates a calendar event. It does this by
 * - removing unecessary whitespace around the title and description,
 * - checking if the title and dates are present,
 * - checking if the end date is after the start date,
 * - returning the calendar event.
 * @param calEvent
 *
 * @returns The original calendar event if it is valid, otherwise throws an error.
 * @throws `Error` if the calendar event is invalid, which indicates the reason for invalidation.
 *
 * @todo Implement checking if the `roomId` is legitimate.
 */
function validateEvent(calEvent: CalendarEvent): CalendarEvent {
	const title = calEvent.title.trim();
	const description = calEvent.description.trim();
	const color = calEvent.color.trim();
	const location = calEvent.location?.trim();

	// Checks if color is a valid hexadecimal (e.g. #6789ab)
	console.log(color);
	if (!/#[0-9A-Fa-f]{6}/.test(color)) {
		throw new Error('Color field is not a valid hexadecimal color string.');
	}

	const start = new Date(calEvent.startTime);
	const end = new Date(calEvent.endTime);

	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		throw new Error('Calendar event must have valid start and end times');
	}

	if (end.getTime() <= start.getTime()) {
		throw new Error('Calendar event end time must be after start time');
	}

	return new CalendarEvent(title, description, color, calEvent.isAllDay, start, end, calEvent.id, location, calEvent.room);
}

/**
 * Composable for calendar events. This should be used to interact with calendar events in the UI.
 * @todo Add other message types, e.g. edit, delete, etc.
 * @see `src/logic/core/events.ts`
 * @see Commit `1a17660`
 */
export function useCalendarEvents() {
	// We export a group of functions to be called by the calendar UI elements.
	const calendar_store = useCalendarStore();

	/**
	 * Creates a new calendar event in the specified room.
	 * @param roomId
	 * @param calEvent
	 *
	 * @example
	 *  // Creates a calendar event in room `a1b2c3`, with the given `CalendarEvent` interface.
	 *  createCalendarEvent("a1b2c3", new CalendarEvent(
	 *       "cool title", "desc", "#005a9e", new Date(), new Date(Date.now() + 60 * 60 * 1000)
	 *  ));
	 */
	async function createCalendarEvent(roomId: string, calEvent: CalendarEvent): Promise<void> {
		const normalisedEvent = validateEvent(calEvent);
		await calendar_store.addCalendarEvent(roomId, normalisedEvent);
	}

	/**
	 * Removes a calendar event given the event ID.
	 * @param roomId
	 * @param eventId
	 */
	async function removeCalendarEvent(roomId: string, eventId: string): Promise<void> {
		await calendar_store.delCalendarEvent(roomId, eventId);
	}

	async function updateCalendarEvent(roomId: string, eventId: string, calEvent: CalendarEvent): Promise<void> {
		const normalisedEvent = validateEvent(calEvent);
		await calendar_store.editCalendarEvent(roomId, eventId, normalisedEvent);
	}

	async function getCalendarEvents(room: Room): Promise<CalendarEvent[]> {
		return await calendar_store.getCalendarEvents(room);
	}

	return {
		createCalendarEvent,
		removeCalendarEvent,
		updateCalendarEvent,
		getCalendarEvents,
	};
}
