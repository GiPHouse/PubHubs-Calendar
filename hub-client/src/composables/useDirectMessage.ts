// Packages
import { computed } from 'vue';

// Composables
import { useSidebar } from '@hub-client/composables/useSidebar';

// Logic
import { router } from '@hub-client/logic/core/router';

// Stores
import { usePubhubsStore } from '@hub-client/stores/pubhubs';
<<<<<<< HEAD
import { Room, useRooms } from '@hub-client/stores/rooms';
import { useSettings } from '@hub-client/stores/settings';
import { User, useUser } from '@hub-client/stores/user';
=======
import { type Room, useRooms } from '@hub-client/stores/rooms';
import { useSettings } from '@hub-client/stores/settings';
import { useUser } from '@hub-client/stores/user';
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e

export function useDirectMessage() {
	const pubhubs = usePubhubsStore();
	const rooms = useRooms();
	const user = useUser();
	const sidebar = useSidebar();
	const settings = useSettings();

	const isMobile = computed(() => settings.isMobileState);

	// Creates/finds a private room, joins it, and returns the Room from the store.
	async function ensureDMRoom(...args: Parameters<typeof pubhubs.createPrivateRoomWith>): Promise<Room | null> {
		const result = await pubhubs.createPrivateRoomWith(...args);
		if (!result) return null;
		await rooms.joinRoomListRoom(result.room_id);
		return (rooms.rooms[result.room_id] as Room) ?? null;
	}

	function goToRoom(room: Room) {
		sidebar.openDMRoom(room);
		router.push({ name: 'direct-msg' });
	}

	// Opens or creates a 1:1 DM with the given user and navigates to it.
	async function goToUserDM(userId: string): Promise<void> {
<<<<<<< HEAD
		const otherUser = user.client?.getUser(userId);
		if (!otherUser || user.userId === otherUser.userId) return;

		const room = await ensureDMRoom(otherUser as User);
=======
		if (!userId || userId === user.userId) return;

		const room = await ensureDMRoom([userId]);
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		if (room) goToRoom(room);
	}

	// Creates a DM (1:1 or group) and selects it in the sidebar.
<<<<<<< HEAD
	async function createDMWithUsers(users: User | User[]): Promise<Room | null> {
=======
	async function createDMWithUsers(users: string[]): Promise<Room | null> {
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		const room = await ensureDMRoom(users);
		if (room) sidebar.openDMRoom(room);
		return room;
	}

	// Creates a DM and navigates to the DM page.
<<<<<<< HEAD
	async function createAndGoToDM(users: User | User[]): Promise<void> {
=======
	async function createAndGoToDM(users: string[]): Promise<void> {
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		const room = await createDMWithUsers(users);
		if (room) router.push({ name: 'direct-msg' });
	}

	// Creates a DM with the steward
<<<<<<< HEAD
	async function goToStewardRoom(roomId: string, members: User[]): Promise<void> {
		const room = await ensureDMRoom(members, false, true, roomId);
=======
	async function goToStewardRoom(roomId: string, stewardIds: string[]): Promise<void> {
		const room = await ensureDMRoom(stewardIds, false, true, roomId);
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		if (room) goToRoom(room);
	}

	return {
		isMobile,
		goToRoom,
		goToUserDM,
		createDMWithUsers,
		createAndGoToDM,
		goToStewardRoom,
	};
}
