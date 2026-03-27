// Models
import { RoomType, TBaseRoom } from '@hub-client/models/rooms/TBaseRoom';

export interface TCalendarRoom extends TBaseRoom {
    room_type: RoomType.PH_MESSAGES_CALENDAR;
}
