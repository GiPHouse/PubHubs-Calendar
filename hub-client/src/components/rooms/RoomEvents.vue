<template>
	<div class="flex h-full flex-col p-4">
		<SidebarHeader :title="$t('menu.calendar')">
			<template #action>
				<button
					class="text-on-surface-dim hover:text-on-surface hover:bg-surface-high rounded-md p-1 transition-colors hover:cursor-pointer"
					@click="openCreateDialog"
				>
					<Icon type="plus-circle" size="md" />
				</button>
			</template>
		</SidebarHeader>

		<!-- Scrollable event list -->
		<div class="flex-1 overflow-y-auto px-4 pb-16">
			<!-- No events -->
			<p v-if="groupedEvents.length === 0" class="text-on-surface-dim mt-4 text-sm">
				{{ t('calendar.noEvents') || 'No events' }}
			</p>

			<EventCreationDialog
				v-if="showEventCreationDialog"
				:start="selectedRange.startStr"
				:end="selectedRange.endStr"
				:allDay="selectedRange.allDay"
				:event="selectedEventForEdit"
				:lockedRoom="roomsStore.currentRoom?.name ?? undefined"
				@close="showEventCreationDialog = false; selectedEventForEdit = null;"
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
					:style="{ 
						backgroundColor: event.backgroundColor?.startsWith('#') 
							? event.backgroundColor + '22' 
							: event.backgroundColor + '33',
						borderLeft: `3px solid ${event.backgroundColor}` 
					}"
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
	import EventCreationDialog from '../forms/EventCreationDialog.vue';
	import EventDetailsDialog from '../forms/EventDetailsDialog.vue';
	import Icon from '../elements/Icon.vue';
	import { computed, ref } from 'vue';
	import { useI18n } from 'vue-i18n';

	import { useSettings } from '@hub-client/stores/settings';
	import { useSidebar } from '@hub-client/composables/useSidebar';
	import { useRooms } from '@hub-client/stores/rooms';

	const roomsStore = useRooms();
	
	const sidebar = useSidebar();

	const { t, locale } = useI18n();
	const settings = useSettings();

	const searchTerm = ref('');

	// Emits
	const emit = defineEmits(['dateSelected', 'eventSelected', 'eventAdded', 'eventUpdated']);

    // Event creation
	const showEventCreationDialog = ref(false);
	const selectedRange = ref({ startStr: '', endStr: '', allDay: false });

	const showEventDetailsDialog = ref(false);
	const selectedEventForEdit = ref(null);
	const selectedEvent = ref(null);


	// Calendar events data
	const calendarEvents = ref([
		{
			id: '1',
			title: 'Team Meeting',
			start: new Date(new Date().setHours(10, 0, 0, 0)),
			end: new Date(new Date().setHours(11, 30, 0, 0)),
			backgroundColor: '#3b82f6',
			borderColor: '#3b82f6',
		},
		{
			id: '2',
			title: 'Project Deadline',
			start: new Date(new Date().setDate(new Date().getDate() + 2)),
			allDay: true,
			backgroundColor: '#ef4444',
			borderColor: '#ef4444',
		},
		{
			id: '3',
			title: 'Client Call',
			start: new Date(new Date().setDate(new Date().getDate() + 1)),
			end: new Date(new Date().setDate(new Date().getDate() + 1)),
			backgroundColor: '#10b981',
			borderColor: '#10b981',
		},
		{
			id: '4',
			title: 'Team Meeting',
			start: new Date(new Date().setHours(10, 0, 0, 0)),
			end: new Date(new Date().setHours(11, 30, 0, 0)),
			backgroundColor: '#3b82f6',
			borderColor: '#3b82f6',
		},
		{
			id: '5',
			title: 'Project Deadline',
			start: new Date(new Date().setDate(new Date().getDate() + 2)),
			allDay: true,
			backgroundColor: '#ef4444',
			borderColor: '#ef4444',
		},
		{
			id: '6',
			title: 'Client Call',
			start: new Date(new Date().setDate(new Date().getDate() + 1)),
			end: new Date(new Date().setDate(new Date().getDate() + 1)),
			backgroundColor: '#10b981',
			borderColor: '#10b981',
		},
		{
			id: '7',
			title: 'Team Meeting',
			start: new Date(new Date().setHours(10, 0, 0, 0)),
			end: new Date(new Date().setHours(11, 30, 0, 0)),
			backgroundColor: '#3b82f6',
			borderColor: '#3b82f6',
		},
		{
			id: '8',
			title: 'Project Deadline',
			start: new Date(new Date().setDate(new Date().getDate() + 2)),
			allDay: true,
			backgroundColor: '#ef4444',
			borderColor: '#ef4444',
		},
		{
			id: '9',
			title: 'Client Call',
			start: new Date(new Date().setDate(new Date().getDate() + 1)),
			end: new Date(new Date().setDate(new Date().getDate() + 1)),
			backgroundColor: '#10b981',
			borderColor: '#10b981',
		},
	]);

    
	function addOneDay(dateStr) {
		const d = new Date(dateStr);
		d.setDate(d.getDate() + 1);

		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	}

	function addEvent(newEvent) {
		// remove id once the backend returns a real one
		const tempId = `local-${Date.now()}`;

		calendarEvents.value.push({
			id: tempId,
			title: newEvent.title,
			start: newEvent.start,
			end: newEvent.allDay ? addOneDay(newEvent.end) : newEvent.end,
			allDay: newEvent.allDay,
			backgroundColor: newEvent.color,
			borderColor: newEvent.color,
			extendedProps: {
				location: newEvent.location,
				room: newEvent.room,
				description: newEvent.description,
			},
		});
	}

	function handleAddEvent(newEvent) {
		if (selectedEventForEdit.value) {
			// Update existing event
			const index = calendarEvents.value.findIndex((e) => e.id === selectedEventForEdit.value.id);
			if (index !== -1) {
				calendarEvents.value[index] = {
					...calendarEvents.value[index],
					title: newEvent.title,
					start: newEvent.start,
					end: newEvent.end,
					allDay: newEvent.allDay,
					backgroundColor: newEvent.color,
					borderColor: newEvent.color,
					extendedProps: {
						location: newEvent.location,
						room: newEvent.room,
						description: newEvent.description,
					},
				};
			}
			selectedEventForEdit.value = null;
		} else {
			// Create new event
			addEvent(newEvent);
		}
		showEventCreationDialog.value = false;
	}

	function openEventDetails(event) {
		selectedEvent.value = event;
		showEventDetailsDialog.value = true;
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

	function handleDeleteEvent(eventId) {
		calendarEvents.value = calendarEvents.value.filter((e) => e.id !== eventId);
		showEventDetailsDialog.value = false;
	}

	function openCreateDialog() {
		selectedEventForEdit.value = null;
		const today = new Date();
		today.setHours(12, 0, 0, 0);
		const todayEnd = new Date(today);
		todayEnd.setMinutes(30);
		selectedRange.value = {
			startStr: today.toISOString(),
			endStr: todayEnd.toISOString(),
			allDay: false,
		};
		showEventCreationDialog.value = true;
	}

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
		if (m === 0) return `${hour12} ${period}`;
		return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
	}

	const groupedEvents = computed(() => {
		const sorted = [...calendarEvents.value].sort((a, b) => new Date(a.start) - new Date(b.start));

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const groups = {};
		for (const event of sorted) {
			const d = new Date(event.start);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			if (!groups[key]) {
				const dayDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
				const weekday = d.toLocaleDateString(locale.value, { weekday: 'long' });
				const month = d.toLocaleDateString(locale.value, { month: 'long' });
				groups[key] = {
					dateKey: key,
					dayNumber: d.getDate(),
					dayLabel: `${weekday}, ${month}`,
					isToday: dayDate.getTime() === today.getTime(),
					events: [],
				};
			}
			groups[key].events.push(event);
		}

		return Object.values(groups);
	});

    	function handleEventClick(info) {
		console.log('Event clicked:', info.event);

		selectedEvent.value = {
			id: info.event.id,
			title: info.event.title,
			start: info.event.start,
			end: info.event.end,
			allDay: info.event.allDay,
			extendedProps: info.event.extendedProps,
		};

		showEventDetailsDialog.value = true;
	}


	function clearCalendar() {
		searchTerm.value = '';
	}
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