<template>
    <div class="fixed top-0 left-0 z-50 h-full w-full" @keydown.esc="$emit('close')">
        <!-- Scrim -->
        <div
            class="bg-surface-high absolute h-full w-full opacity-80"
            @click="$emit('close')"
        />

        <!-- Dialog -->
        <div
            class="relative flex h-full w-full items-center"
            :class="isMobile ? 'justify-end px-3' : 'justify-center'"
        >
            <div
                class="bg-surface-low shadow-surface-high flex flex-col gap-4 rounded-md p-6 shadow-xl"
                :class="isMobile ? 'w-[calc(47vw+40px)]' : 'w-4/5 md:w-3/5 lg:w-2/5'"
                @click.stop
            >

                <!-- Divider -->
                <div class="h-px bg-gray-200"></div>

                <!-- Content -->
                <div class="text-base">
                    {{ t('rooms.addToCalendar') }}
                </div>

                <!-- Divider -->
                <div class="h-px bg-gray-200"></div>

                <!-- Footer -->
                <div class="flex gap-2">
                    <!-- Cancel (left) -->
                    <Button
                        class="mr-auto"
                        color="secondary"
                        @click="$emit('close')"
                    >
                        {{ t('dialog.cancel') }}
                    </Button>

                    <!-- Yes -->
                    <Button @click="confirm">
                        {{ t('dialog.yes') }}
                    </Button>
                </div>
            </div>
        </div>
    </div>

    <EventCreationDialog
        v-if="showEventDialog"
        :event="selectedEvent"
        :start="selectedEvent?.start ?? ''"
        :end="selectedEvent?.end ?? ''"
        :allDay="selectedEvent?.allDay ?? false"
        :lockedRoom="currentRoomName"
        @submit="handleSubmit"
        @close="closeEventDialog"
    />
</template>

<script setup lang="ts">
    import Button from '@hub-client/components/elements/Button.vue';
    import EventCreationDialog from '@hub-client/components/forms/EventCreationDialog.vue';
    import { useI18n } from 'vue-i18n';
    import { ref } from 'vue';
    import { useRooms } from '@hub-client/stores/rooms';
    import { usePubhubsStore } from '@hub-client/stores/pubhubs';
    import { useCalendarEvents } from '@hub-client/composables/calendar.composable';
    import { RoomType } from '@hub-client/models/rooms/TBaseRoom';

    const roomsStore = useRooms();
    const pubhubsStore = usePubhubsStore();
    const { createCalendarEvent } = useCalendarEvents();

    const props = defineProps<{
        isMobile: boolean,
        scheduler: any,
        option: any,
    }>();

    const emit = defineEmits(['close', 'submit']);

    const { t } = useI18n();

    const showEventDialog = ref(false);
    const selectedEvent = ref(null);
    const currentRoomName = ref('');

    // --- This was missing! Copied from Calendar.vue / CalendarSidebar.vue ---
    async function findAndJoinCalendarRoom() {
        await roomsStore.waitForInitialRoomsLoaded();

        const existing = Object.values(roomsStore.rooms).find(
            (r) => r.getType() === RoomType.PH_MESSAGES_CALENDAR
        );
        if (existing) return existing;

        const knownMatrix = pubhubsStore.getAllRooms().find(
            (r) => r.getType() === RoomType.PH_MESSAGES_CALENDAR
        );
        if (knownMatrix) {
            if (!roomsStore.rooms[knownMatrix.roomId]) {
                roomsStore.initRoomsWithMatrixRoom(knownMatrix, knownMatrix.name, RoomType.PH_MESSAGES_CALENDAR, []);
            }
            return roomsStore.rooms[knownMatrix.roomId];
        }

        const roomData = roomsStore.roomList.find(
            (r) => r.roomType === RoomType.PH_MESSAGES_CALENDAR
        );
        if (!roomData) return null;
        if (!roomsStore.rooms[roomData.roomId]) {
            await roomsStore.joinRoomListRoom(roomData.roomId);
        }
        return roomsStore.rooms[roomData.roomId];
    }

    // --- This was also missing! ---
    function createEventObject(payload) {
        return {
            title: payload.title,
            description: payload.description ?? '',
            color: payload.color ?? payload.backgroundColor ?? '#00adee',
            isAllDay: payload.allDay ?? false,
            startTime: new Date(payload.start),
            endTime: new Date(payload.end ?? payload.start),
            location: payload.location ?? '',
            room: payload.room ?? [],
        };
    }

    async function handleSubmit(eventData) {
        try {
            const calendarRoom = await findAndJoinCalendarRoom();
            if (!calendarRoom) {
                console.error('[AddToCalendarDialog] Could not find or join calendar room');
                return;
            }
            await createCalendarEvent(calendarRoom.roomId, createEventObject(eventData));
            emit('submit', eventData); // notify parent (SchedulerOptionItem) so it can react if needed
        } catch (err) {
            console.error('[AddToCalendarDialog] Failed to save event', err);
        }
        closeEventDialog();
    }

    function confirm() {
        const start = props.option?.date?.[0];
        const end = props.option?.date?.[1] ?? props.option?.date?.[0];
        currentRoomName.value = roomsStore.currentRoom?.name ?? '';

        selectedEvent.value = {
            title: props.scheduler?.title ?? '',
            start: start instanceof Date ? start.toISOString() : start,
            end: end instanceof Date ? end.toISOString() : end,
            allDay: props.option?.fullDay ?? false,
            backgroundColor: '#00adee',
            extendedProps: {
                location: props.scheduler?.location ?? '',
                description: props.scheduler?.description ?? '',
                room: currentRoomName.value ? [currentRoomName.value] : [],
            },
        };

        showEventDialog.value = true;
    }

    function closeEventDialog() {
        showEventDialog.value = false;
        emit('close');
    }
</script>