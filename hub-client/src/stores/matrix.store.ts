// Packages
import { defineStore } from 'pinia';

// Services
import { useMatrixService } from '@hub-client/services/matrix.service';
import { PubHubsMgType } from '@hub-client/logic/core/events';

const useMatrixStore = defineStore('matrix', {
	state: () => ({
		hasActiveSync: false,
		subscribedRooms: {} as Record<string, string>,
	}),

	actions: {
		// #region Matrix

		async init() {
			const matrixService = useMatrixService();
			if (!matrixService) return;
		},

		// #endregion

		// #region Sliding Sync

		/**
		 * Start the Sliding Sync.
		 */
		async startSync() {
			if (this.hasActiveSync) return;

			try {
				const matrixService = useMatrixService();
				await matrixService.startSync();
			} finally {
				this.hasActiveSync = true;
			}
		},

		/**
		 * Stop the Sliding Sync.
		 */
		async stopSync() {
			try {
				const matrixService = useMatrixService();
				matrixService.stopSync();
			} finally {
				this.hasActiveSync = false;
			}
		},

		/**
		 * Add a subscription to a room to the Sliding Sync.
		 */
		addRoomSubscription(roomId: string) {
			const matrixService = useMatrixService();

			return matrixService.addRoomSubscription(roomId);
		},

		addSubscribedRoom(roomId: string, timelineKey: string) {
			this.subscribedRooms[roomId] = timelineKey;
		},

		removeSubscribedRoom(roomId: string) {
			delete this.subscribedRooms[roomId];
		},

		// #endregion

		// #region Send Events/Messages
		
		/**
		 * Sends a `msgType` event containing `content` to room `roomId`.
		 * @param roomId The roomId as a string
		 * @param msgType The type of event as an enum
		 * @param content The content in an interface, dependent on msgType
		 * @todo Make content paramater more strongly typed than any. 
		 */
		sendEvent(roomId: string, msgType: PubHubsMgType, content: any) {
			const matrixService = useMatrixService();
			matrixService.sendEvent(roomId, msgType, content);
		}

		// #endregion
	},
});

// Exports
export { useMatrixStore };
