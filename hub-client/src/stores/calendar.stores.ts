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


const useCalendarStore = defineStore('calendar', {
    actions: {
        async addCalendarEvent(roomId: string, calEvent: CalendarEvent) {
			// Adds a calendar event using sendEvent.
			// Should probably only be called by the calendar composable.
			// TODO: Understand how to use the matrix composable as the client instructed instead of the user client.
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
		// TODO: Add more calendar event types, such as edit, delete, etc.
		// See src/logic/core/events.ts or commit 1a1766
    }
})

export { useCalendarStore };