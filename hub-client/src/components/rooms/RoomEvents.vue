<template>
	<div class="flex h-full flex-col p-4">
		<SidebarHeader :title="$t('menu.calendar')" />

		<!-- Scrollable event list -->
		<div class="flex-1 overflow-y-auto px-4 pb-4">
			<!-- No events -->
			<p v-if="groupedEvents.length === 0" class="text-on-surface-dim mt-4 text-sm">
				{{ t('calendar.noEvents') || 'No events' }}
			</p>

			<button v-if="!isMobile" class="text-on-surface-dim hover:text-on-surface hover:bg-surface-high rounded-md p-1 transition-colors hover:cursor-pointer" @click="openCreateDialog" aria-label="Create event">
				<Icon type="plus" size="sm" />
			</button>

			<EventCreationDialog
				v-if="showEventCreationDialog"
				:start="selectedRange.startStr"
				:end="selectedRange.endStr"
				:allDay="selectedRange.allDay"
				:event="selectedEventForEdit"
				@close="
					showEventCreationDialog = false;
					selectedEventForEdit = null;
				"
				@submit="handleAddEvent"
			/>

			<!-- Date groups -->
			<div v-for="group in groupedEvents" :key="group.dateKey" class="mb-4">
				<!-- Date header -->
				<div class="text-on-surface-dim mb-2 flex items-center gap-2">
					<span class="flex h-7 w-6 items-center justify-center rounded-full text-sm font-semibold" :class="group.isToday ? 'bg-accent-blue text-on-button-blue' : 'text-on-surface'">
						{{ group.dayNumber }}
					</span>
					<span class="text-sm font-medium capitalize">{{ group.dayLabel }}</span>
				</div>

				<!-- Events for this day -->
				<div
					v-for="event in group.events"
					:key="event.id"
					class="mb-2 flex cursor-pointer items-center gap-3 rounded-lg p-3 transition hover:opacity-80"
					:style="{ backgroundColor: event.backgroundColor + '22', borderLeft: `3px solid ${event.backgroundColor}` }"
					@click="openEventDetails(event)"
				>
					<!-- Color dot -->
					<span class="h-2.5 w-2.5 flex-shrink-0 rounded-full" :style="{ backgroundColor: event.backgroundColor }" />

					<!-- Event info -->
					<div class="min-w-0 flex-1">
						<p class="text-on-surface truncate text-sm font-medium">{{ event.title }}</p>
						<p v-if="!event.allDay" class="text-on-surface-dim text-xs">
							{{ formatTime(event.start) }}
							<span v-if="event.end"> – {{ formatTime(event.end) }}</span>
						</p>
						<p v-else class="text-on-surface-dim text-xs">{{ t('calendar.isAllDay') || 'All day' }}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
	<EventDetailsDialog v-if="showEventDetailsDialog && selectedEvent" :event="selectedEvent" :can-edit="true" @close="showEventDetailsDialog = false" @edit="handleEditEvent" @delete="handleDeleteEvent" />
</template>

<script setup>
	import Icon from '../elements/Icon.vue';
	import EventCreationDialog from '../forms/EventCreationDialog.vue';
	import EventDetailsDialog from '../forms/EventDetailsDialog.vue';
	import { Direction } from 'matrix-js-sdk';
	import { computed, onMounted, ref, watch } from 'vue';
	import { useI18n } from 'vue-i18n';

	import { useCalendarEvents } from '@hub-client/composables/calendar.composable';

	import { RoomType } from '@hub-client/models/rooms/TBaseRoom';

	import { usePubhubsStore } from '@hub-client/stores/pubhubs';
	import { useRooms } from '@hub-client/stores/rooms';
	import { useSettings } from '@hub-client/stores/settings';

	const { t, locale } = useI18n();
	const settings = useSettings();
	const roomsStore = useRooms();
	const pubhubsStore = usePubhubsStore();
	const { getCalendarEvents, createCalendarEvent, updateCalendarEvent, removeCalendarEvent } = useCalendarEvents();

	const calendarRoomRef = ref(null);
	const allEvents = ref([]); // all events from calendar room
	const loading = ref(false);
	const calendarTimelineVersion = ref(0);

	const currentRoomId = computed(() => roomsStore.currentRoom?.roomId ?? null);

	const filteredEvents = computed(() => {
		if (!currentRoomId.value) return [];
		return allEvents.value.filter((event) => {
			const eventRoomIds = event.extendedProps?.room ?? event.room ?? [];
			if (Array.isArray(eventRoomIds)) return eventRoomIds.includes(currentRoomId.value);
			return eventRoomIds === currentRoomId.value;
		});
	});

	async function findAndJoinCalendarRoom() {
		await roomsStore.waitForInitialRoomsLoaded();
		const existing = Object.values(roomsStore.rooms).find((r) => r.getType() === RoomType.PH_MESSAGES_CALENDAR);
		if (existing) return existing;

		const knownMatrix = pubhubsStore.getAllRooms().find((r) => r.getType() === RoomType.PH_MESSAGES_CALENDAR);
		if (knownMatrix) {
			if (!roomsStore.rooms[knownMatrix.roomId]) {
				roomsStore.initRoomsWithMatrixRoom(knownMatrix, knownMatrix.name, RoomType.PH_MESSAGES_CALENDAR, []);
			}
			return roomsStore.rooms[knownMatrix.roomId];
		}

		const roomData = roomsStore.roomList.find((r) => r.roomType === RoomType.PH_MESSAGES_CALENDAR);
		if (!roomData) return null;
		if (!roomsStore.rooms[roomData.roomId]) {
			await roomsStore.joinRoomListRoom(roomData.roomId);
		}
		return roomsStore.rooms[roomData.roomId];
	}

	async function initCalendarRoom() {
		let room = await findAndJoinCalendarRoom();
		if (!room) {
			const result = await pubhubsStore.createRoom({
				name: 'Calendar Room',
				creation_content: { type: RoomType.PH_MESSAGES_CALENDAR },
				topic: 'Room for calendar events',
			});
			if (!result) return null;
			await roomsStore.joinRoomListRoom(result.room_id);
			room = roomsStore.rooms[result.room_id];
		}
		room.initTimeline();
		return room;
	}

	async function loadAllEvents() {
		if (!calendarRoomRef.value) return;
		loading.value = true;
		try {
			// Paginate to ensure all events are fetched
			const oldestId = calendarRoomRef.value.getTimelineOldestMessageId();
			if (oldestId) {
				await calendarRoomRef.value.paginate(Direction.Backward, 50, oldestId);
			}
			const events = await getCalendarEvents(calendarRoomRef.value);
			allEvents.value = events.map(mapToFullCalendarEvent);
		} catch (err) {
			console.error('Failed to load events', err);
		} finally {
			loading.value = false;
		}
	}

	// basically same as in Calendar.vue
	function mapToFullCalendarEvent(event) {
		return {
			id: event.id,
			title: event.title,
			start: event.startTime ?? event.start,
			end: event.endTime ?? event.end,
			allDay: event.isAllDay ?? event.allDay,
			backgroundColor: event.color ?? '#3788d8',
			borderColor: event.color ?? '#3788d8',
			textColor: getContrastTextColor(event.color ?? '#3788d8'),
			extendedProps: {
				location: event.location ?? '',
				room: event.room ?? [],
				description: event.description ?? '',
			},
		};
	}

	function getContrastTextColor(bgColor) {
		// same helper as Calendar.vue
		let r, g, b;
		if (bgColor.startsWith('#')) {
			const hex = bgColor.replace('#', '');
			const bigint = parseInt(hex, 16);
			r = (bigint >> 16) & 255;
			g = (bigint >> 8) & 255;
			b = bigint & 255;
		} else {
			const rgb = bgColor.match(/\d+/g)?.map(Number);
			if (!rgb) return 'white';
			[r, g, b] = rgb;
		}
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness > 150 ? 'black' : 'white';
	}

	// Watch timeline changes (new events, edits, deletions)
	watch(calendarTimelineVersion, () => loadAllEvents());

	// Initialize on mount
	onMounted(async () => {
		const room = await initCalendarRoom();
		if (room) {
			calendarRoomRef.value = room;
			calendarTimelineVersion.value = room.getTimelineVersion?.() ?? 0;
			await loadAllEvents();
		}
	});

	const showEventCreationDialog = ref(false);
	const selectedRange = ref({ startStr: '', endStr: '', allDay: false });
	const showEventDetailsDialog = ref(false);
	const selectedEventForEdit = ref(null);
	const selectedEvent = ref(null);

	function createEventObject(payload, eventId = null) {
		return {
			title: payload.title,
			description: payload.description ?? '',
			color: payload.color ?? '#3788d8',
			isAllDay: payload.allDay ?? false,
			startTime: new Date(payload.start),
			endTime: new Date(payload.end ?? payload.start),
			location: payload.location ?? '',
			room: payload.room ?? [],
			...(eventId && { id: eventId }),
		};
	}

	async function handleAddEvent(newEvent) {
		if (!calendarRoomRef.value) return;
		try {
			if (selectedEventForEdit.value) {
				await updateCalendarEvent(calendarRoomRef.value.roomId, selectedEventForEdit.value.id, createEventObject(newEvent, selectedEventForEdit.value.id));
				selectedEventForEdit.value = null;
			} else {
				await createCalendarEvent(calendarRoomRef.value.roomId, createEventObject(newEvent));
			}
			// Reload events after change
			await loadAllEvents();
		} catch (err) {
			console.error('Failed to save event', err);
		}
		showEventCreationDialog.value = false;
	}

	async function handleDeleteEvent(eventId) {
		if (!calendarRoomRef.value) return;
		try {
			await removeCalendarEvent(calendarRoomRef.value.roomId, eventId);
			await loadAllEvents();
		} catch (err) {
			console.error('Failed to delete event', err);
		}
		showEventDetailsDialog.value = false;
	}

	function handleEditEvent(event) {
		showEventDetailsDialog.value = false;
		selectedEventForEdit.value = event;
		selectedRange.value = {
			startStr: event.start instanceof Date ? event.start.toISOString() : event.start,
			endStr: event.end instanceof Date ? event.end.toISOString() : (event.end ?? event.start),
			allDay: event.allDay,
		};
		showEventCreationDialog.value = true;
	}

	function openEventDetails(event) {
		selectedEvent.value = event;
		showEventDetailsDialog.value = true;
	}

	function openCreateDialog() {
		selectedEventForEdit.value = null;
		const today = new Date();
		today.setHours(12, 0, 0, 0);
		const end = new Date(today);
		end.setMinutes(30);
		selectedRange.value = {
			startStr: today.toISOString(),
			endStr: end.toISOString(),
			allDay: false,
		};
		showEventCreationDialog.value = true;
	}

	// Helper for time formatting (unchanged)
	function formatTime(date) {
		if (!date) return '';
		const d = date instanceof Date ? date : new Date(date);
		const h = d.getHours();
		const m = d.getMinutes();
		const is24 = settings.timeformat === 'format24';
		if (is24) {
			return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
		}
		const period = h >= 12 ? 'PM' : 'AM';
		const hour12 = h % 12 === 0 ? 12 : h % 12;
		return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`;
	}

	// Group events by date (using filteredEvents)
	const groupedEvents = computed(() => {
		const sorted = [...filteredEvents.value].sort((a, b) => new Date(a.start) - new Date(b.start));
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const groups = {};
		for (const event of sorted) {
			const d = new Date(event.start);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			if (!groups[key]) {
				const dayDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
				groups[key] = {
					dateKey: key,
					dayNumber: d.getDate(),
					dayLabel: d.toLocaleDateString(locale.value, { weekday: 'long', month: 'long' }),
					isToday: dayDate.getTime() === today.getTime(),
					events: [],
				};
			}
			groups[key].events.push(event);
		}
		return Object.values(groups);
	});

	// Mobile detection (optional – you already have isMobile in template)
	const isMobile = computed(() => window.innerWidth < 768);
</script>

<style scoped>
	.overflow-y-auto::-webkit-scrollbar {
		width: 4px;
	}
	.overflow-y-auto::-webkit-scrollbar-track {
		background: transparent;
	}
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: var(--on-surface-dim);
		border-radius: 2px;
	}
</style>
