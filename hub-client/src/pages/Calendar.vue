<template>
	<HeaderFooter>
		<template #header>
			<div class="flex h-full items-center" :class="isMobile ? 'pl-4' : 'pl-0'">
				<div class="flex w-fit items-center gap-3 overflow-hidden">
					<Icon type="calendar" />
					<H3 class="font-headings text-h3 text-on-surface font-semibold">{{ $t('menu.calendar') }}</H3>
				</div>
			</div>
		</template>

		<!-- FullCalendar Component -->
		<div class="calendar-wrapper p-4 md:p-6">
			<FullCalendar ref="fullCalendar" :options="calendarOptions" />
		</div>
		<EventCreationDialog v-if="showEventCreationDialog" :start="selectedRange.startStr" :end="selectedRange.endStr" @close="showEventCreationDialog = false" @submit="addEvent" />
		<EventDetailsDialog v-if="showEventDetailsDialog && selectedEvent" :event="selectedEvent" @close="showEventDetailsDialog = false" />
	</HeaderFooter>
</template>

<script setup>
	import EventCreationDialog from '../components/forms/EventCreationDialog.vue';
	import EventDetailsDialog from '../components/forms/EventDetailsDialog.vue';
	import dayGridPlugin from '@fullcalendar/daygrid';
	import interactionPlugin from '@fullcalendar/interaction';
	import timeGridPlugin from '@fullcalendar/timegrid';
	import FullCalendar from '@fullcalendar/vue3';
	import { computed, ref, watch } from 'vue';
	import { useI18n } from 'vue-i18n';

	// Emits - must be declared before use in handleEventDrop/handleEventResize
	const emit = defineEmits(['dateSelected', 'eventSelected', 'eventAdded', 'eventUpdated']);

	// Event creation
	const showEventCreationDialog = ref(false);
	const selectedRange = ref({ startStr: '', endStr: '' });

	const showEventDetailsDialog = ref(false);
	const selectedEvent = ref(null);

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
	]);

	const getCalendarLocale = () => {
		return {
			code: locale.value,
			buttonText: {
				today: t('time.today'),
				month: t('time.month'),
				week: t('time.week'),
				day: t('time.day'),
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

			monthNamesShort: [
				t('months.1'), // Jan
				t('months.2'), // Feb
				t('months.3'), // Mar
				t('months.4'), // Mar
				t('months.5'), // Mar
				t('months.6'), // Mar
				t('months.7'), // Mar
				t('months.8'), // Mar
				t('months.9'), // Mar
				t('months.10'), // Mar
				t('months.11'), // Mar
				t('months.12'), // Mar
			],
		};
	};

	// Calendar options
	const calendarOptions = ref({
		plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
		initialView: isMobile.value ? 'listWeek' : 'dayGridMonth',
		selectable: true,

		firstDay: 1, // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
		headerToolbar: {
			left: 'prev,next today',
			center: 'title',
			right: isMobile.value ? 'dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay',
		},

		dayCellDidMount: function (info) {
			// Check if this is the current day
			if (info.date.toDateString() === new Date().toDateString()) {
				// Get the day number element
				const dayNumberEl = info.el.querySelector('.fc-daygrid-day-number');

				if (dayNumberEl) {
					// Wrap the day number in a circle
					const dayNumber = dayNumberEl.innerText;
					dayNumberEl.innerHTML = `<span class="today-circle">${dayNumber}</span>`;
				}
			}
		},

		views: {
			// Month view - just day names (Mon, Tue, etc.)
			dayGridMonth: {
				dayHeaderFormat: { weekday: 'short' },
			},

			// Week view - day name + date (Mon 3)
			timeGridWeek: {
				dayHeaderFormat: { weekday: 'short', day: 'numeric' },
			},

			// Day view - day name + date (Monday 3)
			timeGridDay: {
				dayHeaderFormat: { weekday: 'long', day: 'numeric' }, // Changed from just 'long'
			},
		},

		// Customize the title format
		titleFormat: {
			year: 'numeric',
			month: 'long',
		},

		weekends: true,
		editable: true,
		selectable: true,
		selectMirror: true,
		dayMaxEvents: true,
		events: calendarEvents,

		// Event handlers
		dateClick: handleDateClick,
		eventClick: handleEventClick,
		select: handleSelect,
		eventDrop: handleEventDrop,
		eventResize: handleEventResize,

		// Event colors
		eventColor: '#3788d8',

		// Responsive settings
		aspectRatio: isMobile.value ? 0.8 : 1.35,

		// Locale (adjust based on your needs)
		locales: [getCalendarLocale()], // Add this
		locale: locale.value,

		// Loading state
		loading: handleLoading,

		// Event rendering
		eventContent: renderEventContent,
	});

	watch(locale, () => {
		if (fullCalendar.value) {
			// Update the calendar with new locale
			fullCalendar.value.getApi().setOption('locales', [getCalendarLocale()]);
			fullCalendar.value.getApi().setOption('locale', locale.value);
		}
	});

	function addEvent(newEvent) {
		calendarEvents.value.push({
			title: newEvent.title,
			start: newEvent.start,
			end: newEvent.end,
			extendedProps: {
				location: newEvent.location,
				room: newEvent.room,
				description: newEvent.description,
			},
		});
		showEventCreationDialog.value = false;
	}

	// Event handlers
	function handleDateClick(info) {
		const clickedDate = new Date(info.date); // Already has time in day/week, midnight in month

		// Determine if clicked time is midnight (month view)
		const isMonthViewClick = clickedDate.getHours() === 0 && clickedDate.getMinutes() === 0;

		// Set start time
		const start = new Date(clickedDate);
		if (isMonthViewClick) {
			start.setHours(8, 0, 0, 0); // default 09:00
		}

		// Set end time: 30 min after start
		const end = new Date(start);
		end.setMinutes(start.getMinutes() + 30);

		selectedRange.value = {
			startStr: start.toISOString(),
			endStr: end.toISOString(),
		};

		showEventCreation.value = true;
	}

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

	function handleSelect(info) {
		selectedRange.value = { startStr: info.startStr, endStr: info.endStr };
		showEventCreationDialog.value = true;
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

	/* FullCalendar styles */
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
		font-size: 16px;
		font-weight: 600;
		color: var(--on-surface);
		text-transform: capitalize;
	}

	:deep(.fc-button) {
		font-weight: 500;
		font-size: 14px;
		border-radius: 0.7rem;
	}

	:deep(.fc-toolbar-chunk:last-child .fc-button) {
		min-width: 70px; /* Adjust this value as needed */
		text-align: center;
		white-space: nowrap;
	}

	:deep(.fc-button-primary:not(:disabled):active:focus),
	:deep(.fc-button-primary:not(:disabled).fc-button-active:focus),
	:deep(.fc-button-primary:focus) {
		box-shadow: none;
	}

	:deep(.fc-event) {
		border-radius: 0.375rem;
		padding: 0.25rem 0.5rem;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:deep(.fc-event:hover) {
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:deep(.fc-timegrid-axis) {
		width: 70px; /* Adjust time column width */
	}

	:deep(.fc-timegrid-slot) {
		height: 30px; /* Adjust height of each time slot */
	}

	:deep(.fc-timegrid-slot-label) {
		font-size: 12px; /* Adjust time text size */
		color: var(--on-surface-dim); /* Time text color */
	}

	:deep(.fc-timegrid-slot-label-frame) {
		color: var(--on-surface-dim);
	}

	/* Day headers (day/week/month views) */
	:deep(.fc-col-header-cell) {
		padding: 0.75rem 0;
		background-color: var(--surface-low);
		font-weight: 600;
		font-size: 14px;
		color: var(--on-surface);
	}

	:deep(.fc-col-header-cell-cushion) {
		color: var(--on-surface);
		text-decoration: none;
		font-size: 14px;
	}

	/* Day numbers */
	:deep(.fc-daygrid-day-number) {
		font-weight: 500;
		font-size: 14px;
		color: var(--on-surface);
		padding: 0.5rem;
		text-decoration: none;
	}

	:deep(.fc-daygrid-day-frame) {
		min-height: 100px;
	}

	:deep(.fc-timegrid-axis-frame) {
		font-size: 12px;
	}

	/* Day header in day/week view */
	:deep(.fc-day-header) {
		color: var(--on-surface);
		font-size: 14px;
	}

	/* Today circle styling */
	:deep(.fc-day-today .fc-daygrid-day-number .today-circle) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background-color: var(--accent-blue);
		color: white;
		border-radius: 50%;
		font-weight: 600;
	}

	:deep(.fc-col-header-cell-cushion) {
		text-transform: capitalize; /* Capitalizes first letter of each word */
	}

	:deep(.fc-timegrid-axis) {
		font-size: 12px;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		:deep(.fc-toolbar-chunk:last-child .fc-button) {
			min-width: 60px;
			font-size: 0.875rem;
			padding: 0.25rem 0.5rem;
		}

		:deep(.fc-toolbar) {
			flex-direction: column;
			gap: 1rem;
		}

		:deep(.fc-toolbar-title) {
			font-size: 1rem;
		}

		:deep(.fc-button) {
			padding: 0.25rem 0.5rem;
			font-size: 0.875rem;
		}

		:deep(.fc-daygrid-day-frame) {
			min-height: 60px;
		}

		/* Adjust time column for mobile */
		:deep(.fc-timegrid-axis) {
			width: 50px;
		}

		:deep(.fc-timegrid-slot-label) {
			font-size: 10px;
		}
	}
</style>
