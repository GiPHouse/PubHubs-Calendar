/**
 * Composable for clipboard operations and URL sharing
 */
import { getHubUrl, getRoomUrl } from '@hub-client/logic/core/urls';
<<<<<<< HEAD
=======
import { createLogger } from '@hub-client/logic/logging/Logger';
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e

import { useHubSettings } from '@hub-client/stores/hub-settings';
import { useRooms } from '@hub-client/stores/rooms';

/**
 * Composable for clipboard operations
 * Handles copying hub and room URLs to clipboard
 * Automatically uses hub settings from the store
 */
export function useClipboard() {
<<<<<<< HEAD
=======
	const logger = createLogger('Clipboard');
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
	const hubSettings = useHubSettings();
	const rooms = useRooms();

	/**
	 * Copies the current hub URL to clipboard
	 * @returns Promise that resolves when URL is copied
	 */
	async function copyHubUrl(): Promise<void> {
		try {
<<<<<<< HEAD
			const fullUrl = getHubUrl(hubSettings.hubName!, hubSettings.parentUrl);
			await navigator.clipboard.writeText(fullUrl);
			console.log('Hub URL copied to clipboard:', fullUrl);
		} catch (err) {
			console.error('Failed to copy hub URL:', err);
=======
			const fullUrl = getHubUrl(hubSettings.hubName ?? '', hubSettings.parentUrl);
			await navigator.clipboard.writeText(fullUrl);
			logger.info('Hub URL copied to clipboard:', fullUrl);
		} catch (err) {
			logger.error('Failed to copy hub URL:', err);
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
			throw err;
		}
	}

	/**
	 * Copies a room URL to clipboard
	 * @param roomId - The Matrix room ID
	 * @returns Promise that resolves when URL is copied
	 */
	async function copyRoomUrl(roomId: string): Promise<void> {
		try {
<<<<<<< HEAD
			const fullUrl = getRoomUrl(roomId, hubSettings.hubName!, hubSettings.parentUrl);
			await navigator.clipboard.writeText(fullUrl);
			console.log('Room URL copied to clipboard:', fullUrl);
		} catch (err) {
			console.error('Failed to copy room URL:', err);
=======
			const fullUrl = getRoomUrl(roomId, hubSettings.hubName ?? '', hubSettings.parentUrl);
			await navigator.clipboard.writeText(fullUrl);
			logger.info('Room URL copied to clipboard:', fullUrl);
		} catch (err) {
			logger.error('Failed to copy room URL:', err);
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
			throw err;
		}
	}

	/**
	 * Copies the current room URL to clipboard
	 * Uses the current room from the rooms store
	 * @returns Promise that resolves when URL is copied
	 */
	async function copyCurrentRoomUrl(): Promise<void> {
		if (!rooms.currentRoom) {
<<<<<<< HEAD
			console.error('No current room to copy URL for');
=======
			logger.error('No current room to copy URL for');
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
			throw new Error('No current room');
		}
		await copyRoomUrl(rooms.currentRoom.roomId);
	}

	return {
		copyHubUrl,
		copyRoomUrl,
		copyCurrentRoomUrl,
	};
}
