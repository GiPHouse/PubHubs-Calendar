<template>
	<div class="flex h-full flex-col p-4">
		<SidebarHeader :title="$t('menu.calendar')" />

		<!-- Scrollable event list -->
		<div class="flex-1 overflow-y-auto px-4 pb-4">
			<!-- No events -->
			<p v-if="groupedEvents.length === 0" class="text-on-surface-dim mt-4 text-sm">
				{{ t('calendar.noEvents') || 'No events' }}
			</p>

			<!-- Date groups -->
			<div v-for="group in groupedEvents" :key="group.dateKey" class="mb-4">
				<!-- Date header -->
				<div class="text-on-surface-dim mb-2 flex items-center gap-2">
					<span class="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold" :class="group.isToday ? 'bg-accent-blue text-on-button-blue' : 'text-on-surface'">
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
					@click="emit('eventSelected', event)"
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
</template>

<script setup>
	import EventCreationDialog from '../components/forms/EventCreationDialog.vue';
	import EventDetailsDialog from '../components/forms/EventDetailsDialog.vue';
	import Icon from '../elements/Icon.vue';
	import { computed, ref } from 'vue';
	import { useI18n } from 'vue-i18n';

	import { useSettings } from '@hub-client/stores/settings';

	const { t, locale } = useI18n();
	const settings = useSettings();

	const searchTerm = ref('');

	// Emits
	const emit = defineEmits(['dateSelected', 'eventSelected', 'eventAdded', 'eventUpdated']);

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
				groups[key] = {
					dateKey: key,
					dayNumber: d.getDate(),
					dayLabel: d.toLocaleDateString(locale.value, { weekday: 'long', month: 'long', day: 'numeric' }),
					isToday: dayDate.getTime() === today.getTime(),
					events: [],
				};
			}
			groups[key].events.push(event);
		}

		return Object.values(groups);
	});

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
