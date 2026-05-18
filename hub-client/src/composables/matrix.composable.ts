// Packages
import { MatrixClient } from 'matrix-js-sdk';
import { computed } from 'vue';

// Services
import { initMatrixService } from '@hub-client/services/matrix.service';

// Stores
import { useMatrixStore } from '@hub-client/stores/matrix.store';
import { PubHubsMgType } from '@hub-client/logic/core/events';

const useMatrix = () => {
	const store = useMatrixStore();

	// #region Getters / Setters

	const hasActiveSync = computed(() => store.hasActiveSync);
	const subscribedRooms = computed(() => store.subscribedRooms);

	// #endregion

	// #region Sliding Sync

	const startSync = () => store.startSync();
	const stopSync = () => store.stopSync();
	const addRoomSubscription = (roomId: string) => store.addRoomSubscription(roomId);

	const init = async (client: MatrixClient) => {
		initMatrixService(client);

		// await store.init(); // TODO: Load persisted matrix store data such as subscribedRooms
	};

	// #endregion

	// #region Handle Events

	/**
	 * Sends a `msgType` event containing `content` to room `roomId`.
	 * @param roomId The id of the room as a string
	 * @param msgType The type of event as an enum
	 * @param content The content in an interface, dependent on msgType
	 * @todo Make content paramater more strongly typed than any. 
	 */
	const sendEvent = (roomId: string, msgType: PubHubsMgType, content: any) => store.sendEvent(roomId, msgType, content);

	/**
	 * Redacts (deletes) event `eventId` in room `roomId`.
	 * @param roomId The id of the room as a string
	 * @param eventId The id of the event as a string
	 * @todo implement optional parameters for redactEvent, useful if method used outside of calendar
	 */
	const redactEvent = (roomId: string, eventId: string) => store.redactEvent(roomId, eventId);

	// #endregion

	return {
		// State
		hasActiveSync,
		subscribedRooms,

		// Sliding Sync
		startSync,
		stopSync,
		addRoomSubscription,
		init,

		// Send Events/Messages
		sendEvent,
		redactEvent,
	};

};

// Exports
export { useMatrix };
