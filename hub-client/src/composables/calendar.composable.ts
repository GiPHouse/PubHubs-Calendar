// Packages

// Composables

// Logic

// Stores
import { useCalendarStore } from "@hub-client/stores/calendar.stores";

// Models
import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';

/* This file is the composable for calendar events.
 * This means that this file should handle use-case and UI-related logic.
 * The functions under useCalendarEvents() should be called when interacting with the API,
 *   e.g. when creating a calendar event. */


function validateEvent(calEvent: CalendarEvent): CalendarEvent {
    /* This function:
     *  - Removes unecessary whitespace around the title and description
     *  - Checks if the title and dates are present
     *  - Checks if the end date is after the start date 
     *  - Returns the calendar event.
     * TODO:
     *  - Implement checking if the roomId is legitimate */
    const title = calEvent.title.trim();
    const description = calEvent.description.trim();

    if (!title) {
        throw new Error('Calendar event title is required');
    }

    const start = new Date(calEvent.startTime);
    const end = new Date(calEvent.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error('Calendar event must have valid start and end times');
    }
    if (end.getTime() <= start.getTime()) {
        throw new Error('Calendar event end time must be after start time');
    }

    return new CalendarEvent(title, description, start, end);
}


export function useCalendarEvents() {
    // We export a group of functions to be called by the calendar UI elements.
    const calendar = useCalendarStore();

    async function createCalendarEvent(roomId: string, calEvent: CalendarEvent): Promise<void> {
        /* This function posts a calendar event. 
         * Example usage:
         *   createCalendarEvent("test", new CalendarEvent(
         *       "title", "desc", new Date(), new Date(Date.now()+60*60*1000)
         *   )); 
         * This would create a calendar event in roomid 'a1b2c3' named 'title',
         * description 'desc' start date now and end date in an hour. */
        const normalisedEvent = validateEvent(calEvent);
        await calendar.addCalendarEvent(roomId, normalisedEvent);
        createCalendarEvent("a1b2c3", new CalendarEvent("title", "desc", new Date(), new Date(Date.now()+60*60*1000)));
    }

    /* TODO:
     *  - Add other message types -- edit, delete, etc. 
     *  - See src/logic/core/events.ts or commit 1a17660 */

    return {
        createCalendarEvent,
    };
}