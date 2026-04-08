<template>
	<template>
		<div class="flex h-full flex-col p-4">
			<!-- <div class="flex w-fit items-center gap-3 overflow-hidden">
				<Icon type="calendar" />
				<H3 class="font-headings text-h3 text-on-surface font-semibold">{{ $t('menu.calendar') }}</H3>
				<button v-if="searchTerm" @click="clearCalendar()" class="text-on-surface-dim hover:text-on-surface">
					<Icon type="x" size="sm" />
				</button>
			</div> -->

			<H3 class="font-headings text-h3 text-on-surface font-semibold">{{ $t('menu.calendar') }}</H3>
			<button v-if="searchTerm" @click="clearCalendar()" class="text-on-surface-dim hover:text-on-surface">
				<Icon type="x" size="sm" />
			</button>
		</div>
	</template>

	<!-- FullCalendar Component -->
	<div class="calendar-wrapper p-4 md:p-6">
		<FullCalendar ref="fullCalendar" :options="calendarOptions" />
	</div>
</template>

<script setup>
	import Button from '../elements/Button.vue';
	import Icon from '../elements/Icon.vue';
	import IconButton from '../elements/IconButton.vue';
	import SidebarHeader from '../ui/SidebarHeader.vue';
	import dayGridPlugin from '@fullcalendar/daygrid';
	import interactionPlugin from '@fullcalendar/interaction';
	import listPlugin from '@fullcalendar/list';
	import timeGridPlugin from '@fullcalendar/timegrid';
	import FullCalendar from '@fullcalendar/vue3';
	import { computed, ref, watch } from 'vue';
	import { useI18n } from 'vue-i18n';

	// Composables
	import { useSidebar } from '@hub-client/composables/useSidebar';

	const { t, locale } = useI18n();

	// Mobile detection (adjust based on your setup)
	const isMobile = computed(() => {
		return window.innerWidth < 768;
	});

	// Calendar ref
	const fullCalendar = ref(null);

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
	]);

	const getCalendarLocale = () => {
		return {
			code: locale.value,
			buttonText: {
				today: t('time.today'),
				month: t('time.month'),
				week: t('time.week'),
				day: t('time.day'),
				list: t('menu.calendar'), // or add a specific translation for 'list'
			},
			weekText: 'W',
			allDayText: 'all-day', // You might want to add this to your locale files
			moreLinkText: 'more',
			noEventsText: 'No events', // You might want to add this to your locale files

			// Day names - FullCalendar uses 0 = Sunday, 1 = Monday, etc.
			// Your days.7 = Sunday, days.1 = Monday, etc.
			dayNames: [
				t('daysfull.7'), // Sunday (index 0)
				t('daysfull.1'), // Monday (index 1)
				t('daysfull.2'), // Tuesday (index 2)
				t('daysfull.3'), // Wednesday (index 3)
				t('daysfull.4'), // Thursday (index 4)
				t('daysfull.5'), // Friday (index 5)
				t('daysfull.6'), // Saturday (index 6)
			],

			// Short day names
			dayNamesShort: [
				t('days.7'), // Sun
				t('days.1'), // Mon
				t('days.2'), // Tue
				t('days.3'), // Wed
				t('days.4'), // Thu
				t('days.5'), // Fri
				t('days.6'), // Sat
			],

			// Month names - FullCalendar uses 0 = January, 1 = February, etc.
			monthNames: [
				t('monthsfull.1'), // January (index 0)
				t('monthsfull.2'), // February (index 1)
				t('monthsfull.3'), // March (index 2)
				t('monthsfull.4'), // April (index 3)
				t('monthsfull.5'), // May (index 4)
				t('monthsfull.6'), // June (index 5)
				t('monthsfull.7'), // July (index 6)
				t('monthsfull.8'), // August (index 7)
				t('monthsfull.9'), // September (index 8)
				t('monthsfull.10'), // October (index 9)
				t('monthsfull.11'), // November (index 10)
				t('monthsfull.12'), // December (index 11)
			],

			// Short month names
			monthNamesShort: [
				t('months.1'), // Jan
				t('months.2'), // Feb
				t('months.3'), // Mar
				t('months.4'), // Apr
				t('months.5'), // May
				t('months.6'), // Jun
				t('months.7'), // Jul
				t('months.8'), // Aug
				t('months.9'), // Sep
				t('months.10'), // Oct
				t('months.11'), // Nov
				t('months.12'), // Dec
			],
		};
	};

	// Calendar options
	const calendarOptions = ref({
		plugins: [listPlugin, dayGridPlugin, timeGridPlugin, interactionPlugin],
		initialView: isMobile.value ? 'listWeek' : 'listWeek',
		weekends: true,
		editable: true,
		selectable: true,
		selectMirror: true,
		dayMaxEvents: true,
		events: calendarEvents.value,

		// Event handlers
		dateClick: handleDateClick,
		eventClick: handleEventClick,
		select: handleSelect,
		eventDrop: handleEventDrop,
		eventResize: handleEventResize,

		// Custom button text
		buttonText: {
			today: t('time.today'),
			month: t('time.month'),
			week: t('time.week'),
			day: t('time.day'),
			list: t('menu.calendar'),
		},

		// Event colors
		eventColor: '#3788d8',

		// Responsive settings
		aspectRatio: isMobile.value ? 0.8 : 1.35,

		// Locale settings
		locales: [getCalendarLocale()],
		locale: locale.value,

		// Loading state
		loading: handleLoading,

		// Event rendering
		eventContent: renderEventContent,
	});

	// Watch for locale changes
	watch(locale, () => {
		if (fullCalendar.value) {
			// Update the calendar with new locale
			fullCalendar.value.getApi().setOption('locales', [getCalendarLocale()]);
			fullCalendar.value.getApi().setOption('locale', locale.value);

			// Update button text
			fullCalendar.value.getApi().setOption('buttonText', {
				today: t('time.today'),
				month: t('time.month'),
				week: t('time.week'),
				day: t('time.day'),
				list: t('menu.calendar'),
			});
		}
	});

	// Event handlers
	function clearCalendar() {
		sidebar.close();
	}

	function handleDateClick(info) {
		console.log('Date clicked:', info.dateStr);
		// Emit event or handle date click
		emit('dateSelected', info.date);
	}

	function handleEventClick(info) {
		console.log('Event clicked:', info.event);
		// Emit event or handle event click
		emit('eventSelected', info.event);
	}

	function handleSelect(info) {
		console.log('Selected range:', info.startStr, info.endStr);
		// Handle date range selection
		const title = prompt('Enter event title:');
		if (title) {
			const newEvent = {
				title: title,
				start: info.startStr,
				end: info.endStr,
				allDay: info.allDay,
			};
			calendarEvents.value.push(newEvent);
			emit('eventAdded', newEvent);
		}
	}

	function handleEventDrop(info) {
		console.log('Event dropped:', info.event);
		// Handle event drag & drop
		emit('eventUpdated', info.event);
	}

	function handleEventResize(info) {
		console.log('Event resized:', info.event);
		// Handle event resize
		emit('eventUpdated', info.event);
	}

	function handleLoading(isLoading) {
		console.log('Loading:', isLoading);
	}

	// Custom event rendering
	function renderEventContent(eventInfo) {
		return {
			html: `
      <div class="fc-event-custom p-1">
        <b>${eventInfo.timeText}</b>
        <span>${eventInfo.event.title}</span>
      </div>
    `,
		};
	}

	// Navigation methods
	function goToToday() {
		if (fullCalendar.value) {
			fullCalendar.value.getApi().today();
		}
	}

	function nextMonth() {
		if (fullCalendar.value) {
			fullCalendar.value.getApi().next();
		}
	}

	function previousMonth() {
		if (fullCalendar.value) {
			fullCalendar.value.getApi().prev();
		}
	}

	function changeView(viewName) {
		if (fullCalendar.value) {
			fullCalendar.value.getApi().changeView(viewName);
		}
	}

	// Expose methods to parent if needed
	defineExpose({
		goToToday,
		nextMonth,
		previousMonth,
		changeView,
	});

	// Emits
	const emit = defineEmits(['dateSelected', 'eventSelected', 'eventAdded', 'eventUpdated']);
</script>

<style scoped>
	.calendar-wrapper {
		height: calc(100vh - 120px);
		min-height: 600px;
	}

	@media (max-width: 768px) {
		.calendar-wrapper {
			height: calc(100vh - 100px);
			min-height: 500px;
		}
	}

	/* Custom FullCalendar styles */
	:deep(.fc) {
		--fc-border-color: var(--calendar-grid);
		--fc-button-bg-color: var(--accent-primary);
		--fc-button-border-color: var(--accent-primary);
		--fc-button-hover-bg-color: var(--on-accent-button-blue);
		--fc-button-hover-border-color: var(--on-accent-button-blue);
		--fc-button-active-bg-color: var(--on-blue);
		--fc-button-active-border-color: var(--on-blue);
		--fc-event-bg-color: var(--accent-primary);
		--fc-event-border-color: var(--accent-primary);
		--fc-today-bg-color: transparent;
	}

	:deep(.fc-toolbar-title) {
		font-size: 1.3rem;
		font-weight: 600;
		color: var(--on-surface);
	}

	:deep(.fc-button) {
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		text-transform: capitalize;
		font-sixe: 8px;
	}

	:deep(.fc-button-primary:not(:disabled):active:focus),
	:deep(.fc-button-primary:not(:disabled).fc-button-active:focus),
	:deep(.fc-button-primary:focus) {
		box-shadow: none;
	}

	:deep(.fc-day-today) {
		background-color: rgba(59, 130, 246, 0.05) !important;
	}

	:deep(.fc-event) {
		border-radius: 0.375rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:deep(.fc-event:hover) {
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:deep(.fc-daygrid-day-number) {
		font-weight: 500;
		color: var(--on-surface);
		padding: 0.5rem;
		font-size: 14px;
	}

	:deep(.fc-daygrid-day-frame) {
		min-height: 100px;
	}

	:deep(.fc-col-header-cell) {
		padding: 0.75rem 0;
		background-color: var(--calendar-grid);
		font-weight: 600;
		color: var(--on-surface);
		font-size: 14px;
	}

	:deep(.fc-col-header-cell-cushion) {
		font-size: 14px;
		text-transform: capitalize;
	}

	:deep(.fc-list-event) {
		cursor: pointer;
	}

	:deep(.fc-list-event:hover) {
		background-color: rgba(59, 130, 246, 0.05);
	}

	/* List view specific styles */
	:deep(.fc-list-day-text) {
		font-size: 14px;
	}

	:deep(.fc-list-day-side-text) {
		font-size: 14px;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		:deep(.fc-toolbar) {
			flex-direction: column;
			gap: 1rem;
		}

		:deep(.fc-toolbar-title) {
			font-size: 1.25rem;
		}

		:deep(.fc-button) {
			padding: 0.25rem 0.5rem;
			font-size: 0.875rem;
		}

		:deep(.fc-daygrid-day-frame) {
			min-height: 60px;
		}

		:deep(.fc-daygrid-day-number) {
			font-size: 12px;
		}

		:deep(.fc-col-header-cell) {
			font-size: 12px;
		}

		:deep(.fc-col-header-cell-cushion) {
			font-size: 12px;
		}
	}
</style>
