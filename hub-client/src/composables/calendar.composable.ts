// Packages
// Composables
// Logic
// Stores
// Models
import { TCalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';

import { useCalendarStore } from '@hub-client/stores/calendar.stores';
import { Room } from '@hub-client/stores/rooms';
import { useSettings } from '@hub-client/stores/settings';

import { useRooms } from '@hub-client/stores/rooms';
import { usePubhubsStore } from '@hub-client/stores/pubhubs';
import { RoomType } from '@hub-client/models/rooms/TBaseRoom'

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
export function validateEvent(calEvent: TCalendarEvent): TCalendarEvent {
	const settings = useSettings();
	if (calEvent.title == '') {
		calEvent.title = settings.getActiveLanguage === 'nl' ? 'Naamloos evenement' : 'Untitled event';
	}

	if (calEvent.color == '') {
		throw new Error('Calendar event must have a non-empty color string!');
	}

	// Checks if color is a valid hexadecimal (e.g. #6789ab)
	console.log(calEvent.color);
	if (!/#[0-9A-Fa-f]{6}/.test(calEvent.color)) {
		throw new Error('Color field is not a valid hexadecimal color string.');
	}

	const start = new Date(calEvent.startTime);
	const end = new Date(calEvent.endTime);

	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		throw new Error('Calendar event must have valid start and end times');
	}

	if (calEvent.isAllDay) {
		// if the event is allDay, we ignore the times passed down.
		start.setHours(0, 0, 0);
		end.setHours(23, 59, 59);
	}

	if (end.getTime() <= start.getTime() && !calEvent.isAllDay) {
		throw new Error('Calendar event end date must be after start date');
	}
	console.log('Start time: ' + start.getTime() + ' End time: ' + end.getTime());

	return {
		title: calEvent.title,
		description: calEvent.description,
		color: calEvent.color,
		isAllDay: calEvent.isAllDay,
		startTime: start,
		endTime: end,
		location: calEvent.location,
		room: calEvent.room,
		msgtype: calEvent.msgtype,
	};
	// return new TCalendarEvent(calEvent.title, calEvent.description, calEvent.color, calEvent.isAllDay, start, end, calEvent.id, calEvent.location, calEvent.room);
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
	async function createCalendarEvent(roomId: string, calEvent: TCalendarEvent): Promise<void> {
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

	async function updateCalendarEvent(roomId: string, eventId: string, calEvent: TCalendarEvent): Promise<void> {
		const normalisedEvent = validateEvent(calEvent);
		await calendar_store.editCalendarEvent(roomId, eventId, normalisedEvent);
	}

	async function getCalendarEvents(room: Room): Promise<TCalendarEvent[]> {
		return await calendar_store.getCalendarEvents(room);
	}

	return {
		createCalendarEvent,
		removeCalendarEvent,
		updateCalendarEvent,
		getCalendarEvents,
	};

}

export async function findAndJoinCalendarRoom() {
	// This method should be able to find an existing calendar room if it exists.
	// If it doesn't exist, it should return nothing.
	// If it does exist, it should return the calendar room object.
	const rooms = useRooms();
	const pubhubsStore = usePubhubsStore();
 
	await rooms.waitForInitialRoomsLoaded();
 
	// If the calendar room was already restored, prefer the local Room wrapper
	const existing = Object.values(rooms.rooms).find((r) => r.getType() === RoomType.PH_MESSAGES_CALENDAR);
	if (existing) return existing;
 
	// Otherwise, use the Matrix client cache when roomList has not caught up yet.
	const knownMatrix = pubhubsStore.getAllRooms().find((r) => r.getType() === RoomType.PH_MESSAGES_CALENDAR);
	if (knownMatrix) {
		if (!rooms.rooms[knownMatrix.roomId]) {
			rooms.initRoomsWithMatrixRoom(knownMatrix, knownMatrix.name, RoomType.PH_MESSAGES_CALENDAR, []);
		}
		return rooms.rooms[knownMatrix.roomId];
	}
 
	// 3. Last resort: join via room list
	const roomData = rooms.roomList.find((r) => r.roomType === RoomType.PH_MESSAGES_CALENDAR);
	if (!roomData) {
		console.error('[calendar.composable] No calendar room found in room list.');
		return null;
	}
	if (!rooms.rooms[roomData.roomId]) {
		await rooms.joinRoomListRoom(roomData.roomId);
	}
	return rooms.rooms[roomData.roomId];
}

export async function initCalendarRoom() {
	// This method should create a calendar room if one does not exist and join it.
	// If a calendar room does exist, it should join it (if not already).
	const rooms = useRooms();
	const pubhubsStore = usePubhubsStore();
 
	let room = await findAndJoinCalendarRoom();
 
	if (!room) {
		const result = await pubhubsStore.createRoom({
			name: 'Calendar Room',
			creation_content: { type: RoomType.PH_MESSAGES_CALENDAR },
			topic: 'Room for calendar events',
		});
		if (!result) {
			console.error('[calendar.composable] Failed to create calendar room.');
			return null;
		}
		await rooms.joinRoomListRoom(result.room_id);
		room = rooms.rooms[result.room_id];
	}
 
	room.initTimeline();
	return room;
}
