import { assert } from 'chai';

import { UserAction, UserPowerLevel, UserRole, UserRoleActions } from '@hub-client/models/users/TUser';

import { useRooms } from '@hub-client/stores/rooms';
import { useUser } from '@hub-client/stores/user';

/**
 * This handles user roles and permissions.
 * Given the current or given room and the current user.
 */

function useRoles() {
	const userStore = useUser();
	const roomsStore = useRooms();

	const currentRoomId = (): string | undefined => {
		const room = roomsStore.currentRoom;
		if (!room) return undefined;
		return room.roomId;
	};

	const userPowerLevel = (roomId: string | undefined = undefined): number => {
		const user = userStore.user;
		let room = roomsStore.currentRoom;
		if (roomId) {
			room = roomsStore.room(roomId);
		}
<<<<<<< HEAD
		const powerLevel = room?.getPowerLevel(user.userId) ?? 0;
=======
		const powerLevel = room?.getStateMemberPowerLevel(user.userId) ?? 0;
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		assert(powerLevel in UserPowerLevel, 'Powerlevel not one of the predefined powerlevels');
		return powerLevel;
	};

	const getRoleByPowerLevel = (powerLevel: number): UserRole => {
<<<<<<< HEAD
		if (powerLevel == UserPowerLevel.Admin) return UserRole.Admin;
=======
		if (powerLevel === UserPowerLevel.Admin) return UserRole.Admin;
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		if (powerLevel >= UserPowerLevel.SuperSteward) return UserRole.SuperSteward;
		if (powerLevel >= UserPowerLevel.Steward) return UserRole.Steward;
		if (powerLevel >= UserPowerLevel.Expert) return UserRole.Expert;
		return UserRole.User;
	};

	const userRole = (roomId: string | undefined = undefined): UserRole => {
<<<<<<< HEAD
		if (userIsSuperAdmin()) return UserRole.Admin;
=======
		if (userIsHubAdmin()) return UserRole.Admin;
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		const powerLevel = userPowerLevel(roomId);
		return getRoleByPowerLevel(powerLevel);
	};

<<<<<<< HEAD
=======
	const userHasRoleOrHigher = (role: UserRole, roomId: string | undefined = undefined): boolean => {
		assert(role in UserRole, 'Given role not a defined role');
		const currentPowerLevel = userPowerLevel(roomId);
		const thresholdPowerLevel = UserPowerLevel[role];
		return currentPowerLevel >= thresholdPowerLevel;
	};

	const userIsAdminOrHigher = (roomId?: string) => userHasRoleOrHigher(UserRole.Admin, roomId);
	const userIsSuperStewardOrHigher = (roomId?: string) => userHasRoleOrHigher(UserRole.SuperSteward, roomId);
	const userIsStewardOrHigher = (roomId?: string) => userHasRoleOrHigher(UserRole.Steward, roomId);
	const userIsExpertOrHigher = (roomId?: string) => userHasRoleOrHigher(UserRole.Expert, roomId);

>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
	const userHasRole = (role: UserRole, roomId: string | undefined = undefined): boolean => {
		assert(role in UserRole, 'Given role not a defined role');
		return role === userRole(roomId);
	};

<<<<<<< HEAD
	const userIsSuperAdmin = (): boolean => {
=======
	const userIsHubAdmin = (): boolean => {
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		return userStore.isAdmin;
	};

	const userIsAdmin = (roomId: string | undefined = undefined): boolean => {
		return userHasRole(UserRole.Admin, roomId);
	};

	const userIsSuperSteward = (roomId: string | undefined = undefined): boolean => {
		return userHasRole(UserRole.SuperSteward, roomId);
	};

	const userIsSteward = (roomId: string | undefined = undefined): boolean => {
		return userHasRole(UserRole.Steward, roomId);
	};

	const userIsUser = (roomId: string | undefined = undefined): boolean => {
		return userHasRole(UserRole.User, roomId);
	};

	const userHasAccessForRoles = (roles: Array<UserRole>, roomId: string | undefined = undefined): boolean => {
		return roles.includes(userRole(roomId));
	};

	const userHasPermissionForAction = (action: UserAction, roomId: string | undefined = undefined): boolean => {
		assert(action in UserAction, 'Given action not a defined action');
		const role = userRole(roomId);
		return UserRoleActions[role].includes(action);
	};

	return {
		currentRoomId,
		getRoleByPowerLevel,
<<<<<<< HEAD
		userIsSuperAdmin,
=======
		userIsHubAdmin,
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		userIsAdmin,
		userIsSuperSteward,
		userIsSteward,
		userIsUser,
		userHasAccessForRoles,
		userHasPermissionForAction,
<<<<<<< HEAD
=======
		userIsStewardOrHigher,
		userIsExpertOrHigher,
		userIsSuperStewardOrHigher,
		userIsAdminOrHigher,
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
	};
}
export { useRoles };
