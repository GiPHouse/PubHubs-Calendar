<<<<<<< HEAD
import { MatrixEvent, Room as MatrixRoom } from 'matrix-js-sdk';
import { ref } from 'vue';

import { api_synapse } from '@hub-client/logic/core/api';
=======
import { MatrixEvent, type Room as MatrixRoom } from 'matrix-js-sdk';
import { ref } from 'vue';

import { api_synapse } from '@hub-client/logic/core/api';
import { createLogger } from '@hub-client/logic/logging/Logger';
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e

import { usePubhubsStore } from '@hub-client/stores/pubhubs';

export class LibraryMatrixEvent extends MatrixEvent {
<<<<<<< HEAD
	public signed: Boolean | undefined;
=======
	public signed: boolean | undefined;
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
	public signedEvents: Array<MatrixEvent> | undefined;
}

const useRoomLibrary = () => {
<<<<<<< HEAD
=======
	const logger = createLogger('RoomLibrary');
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
	const elFileInput = ref<HTMLInputElement | null>(null);
	const fileObject = ref<File>({} as File);
	const uri = ref('');
	const pubhubsStore = usePubhubsStore();

	async function makeHash(accessToken: string | null, url: string, room: MatrixRoom): Promise<string> {
		const roomName = room.name || 'unknown'; //default to unknwon if roomname not specified
		const roomContext = ` This is a pubhubs library for room ${roomName}`;
		const finalContext = roomContext.length + roomContext;
		// Similar to fileDownload.ts but we need the blob
		const options = {
			headers: {
				Authorization: 'Bearer ' + accessToken,
			},
			method: 'GET',
		};
		try {
			const response = await fetch(url, options);
			const blob = await response.blob();
			//Hash the file
			const fileArrayBuffer = await blob.arrayBuffer();
			const fileHashBuffer = await window.crypto.subtle.digest('SHA-256', fileArrayBuffer); // from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
			const fileHashArray = new Uint8Array(fileHashBuffer); // Convert buffer to byte array

			//Hash the context
			const contextUint8 = new TextEncoder().encode(finalContext);
			const contextHashBuffer = await window.crypto.subtle.digest('SHA-256', contextUint8);
			const contextHashArray = new Uint8Array(contextHashBuffer);

			//Combine both hashes by appending
			const combined = new Uint8Array([...contextHashArray, ...fileHashArray]);
			const combinedHashBuffer = await window.crypto.subtle.digest('SHA-256', combined);
			const combinedHashArray = Array.from(new Uint8Array(combinedHashBuffer));

			const combinedHashHex = combinedHashArray.map((byte) => byte.toString(16).padStart(2, '0')).join(''); // Convert bytes to hex

			return combinedHashHex;
		} catch (error) {
<<<<<<< HEAD
			console.error(error);
=======
			logger.error(error);
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
			return '';
		}
	}

	async function deleteMedia(url: string, eventId: string, roomId: string) {
		try {
			await api_synapse.apiDELETE(url);
			await pubhubsStore.deleteMessage(roomId, eventId);
		} catch (error) {
<<<<<<< HEAD
			console.error('Unable to delete the media file ' + error);
=======
			logger.error('Unable to delete the media file ' + error);
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
			return null;
		}
	}

<<<<<<< HEAD
	async function removeFromTimeline(eventId: string, roomId: string, signedEvents: any) {
=======
	async function removeFromTimeline(eventId: string, roomId: string, signedEvents: Array<MatrixEvent>) {
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		try {
			await pubhubsStore.deleteLibraryMessage(roomId, eventId);
			// Remove all the related child events (signed banners) from the timeline
			for (const relatedEvent of signedEvents) {
				if (relatedEvent.event.event_id) {
					await pubhubsStore.deleteLibraryMessage(roomId, relatedEvent.event.event_id);
				}
			}
		} catch (error) {
<<<<<<< HEAD
			console.error('Unable to update the roomlibrary timeline ' + error);
=======
			logger.error('Unable to update the roomlibrary timeline ' + error);
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		}
	}

	// #endregion

	return { makeHash, deleteMedia, removeFromTimeline, elFileInput, fileObject, uri };
};

export { useRoomLibrary };
