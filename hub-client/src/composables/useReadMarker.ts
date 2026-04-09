// Packages
import { computed, ref } from 'vue';

// Models
import type Room from '@hub-client/models/rooms/Room';

<<<<<<< HEAD
function useReadMarker(room: Room, userId: string) {
=======
function useReadMarker(room: Room, userId: string, threadRootId: string | undefined) {
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
	const displayedReadMarker = ref<string | null>(null);

	function initialize() {
		// In-session cache (survives navigation within same session)
<<<<<<< HEAD
		const inSessionEventId = room.getLastVisibleEventId();
=======
		const inSessionEventId = room.getLastVisibleEventId(threadRootId);
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		if (inSessionEventId) {
			displayedReadMarker.value = inSessionEventId;
			return;
		}

		// Server-synced read receipt
		const serverEventId = room.getEventReadUpTo(userId);
		if (serverEventId) {
			displayedReadMarker.value = serverEventId;
			const event = room.findEventById(serverEventId);
			if (event) {
<<<<<<< HEAD
				room.setLastVisibleEventId(serverEventId);
				room.setLastVisibleTimeStamp(event.localTimestamp || event.getTs());
=======
				room.setLastVisibleEventId(serverEventId, threadRootId);
				room.setLastVisibleTimeStamp(event.localTimestamp || event.getTs(), threadRootId);
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
			}
		}
	}

	function update(eventId: string, timestamp: number) {
<<<<<<< HEAD
		if (timestamp <= room.getLastVisibleTimeStamp()) {
			return;
		}

		room.setLastVisibleEventId(eventId);
		room.setLastVisibleTimeStamp(timestamp);
=======
		if (timestamp <= room.getLastVisibleTimeStamp(threadRootId)) {
			return;
		}

		room.setLastVisibleEventId(eventId, threadRootId);
		room.setLastVisibleTimeStamp(timestamp, threadRootId);
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
	}

	return {
		displayedReadMarker: computed(() => displayedReadMarker.value),
		initialize,
		update,
	};
}

export default useReadMarker;
