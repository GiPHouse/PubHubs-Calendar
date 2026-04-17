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
		<EventDetailsDialog v-if="showEventDetailsDialog && selectedEvent" :event="selectedEvent" :can-edit="true" @close="showEventDetailsDialog = false" @edit="handleEditEvent" @delete="handleDeleteEvent" />
	</HeaderFooter>
</template>

<script setup>
	import EventCreationDialog from '../components/forms/EventCreationDialog.vue';
	import EventDetailsDialog from '../components/forms/EventDetailsDialog.vue';
	import dayGridPlugin from '@fullcalendar/daygrid';
	import interactionPlugin from '@fullcalendar/interaction';
	import timeGridPlugin from '@fullcalendar/timegrid';
	import FullCalendar from '@fullcalendar/vue3';
	import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
	import { useI18n } from 'vue-i18n';

	import { useCalendarEvents } from '@hub-client/composables/calendar.composable';

	import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';

	import { useRooms } from '@hub-client/stores/rooms';
	import { useSettings } from '@hub-client/stores/settings';

	// Emits - must be declared before use in handleEventDrop/handleEventResize
	const emit = defineEmits(['dateSelected', 'eventSelected', 'eventAdded', 'eventUpdated']);

	// Event creation
	const showEventCreationDialog = ref(false);
	const selectedRange = ref({ startStr: '', endStr: '', allDay: false });

	const showEventDetailsDialog = ref(false);
	const selectedEventForEdit = ref(null);
	const selectedEvent = ref(null);

	const { t, locale } = useI18n();

	const settings = useSettings();
	const rooms = useRooms();
	const { createCalendarEvent, removeCalendarEvent, updateCalendarEvent, getCalendarEvents } = useCalendarEvents();
	const currentRoomId = computed(() => rooms.currentRoom?.roomId ?? '');

	const is24Hour = computed(() => settings.timeformat === 'format24');

	// Mobile detection (adjust based on your setup)
	const isMobile = computed(() => {
		return window.innerWidth < 768;
	});

	// Calendar ref
	const fullCalendar = ref(null);

	// Calendar events data
	const calendarEvents = ref([]);

	function mapCalendarEventToFullCalendarEvent(event) {
		return {
			id: event.id ?? `${event.title}-${event.startTime?.getTime?.() ?? event.start}-${Math.random().toString(36).slice(2, 8)}`,
			title: event.title,
			start: event.startTime ?? event.start,
			end: event.endTime ?? event.end,
			allDay: event.isAllDay ?? event.allDay,
			backgroundColor: event.color ?? '#3788d8',
			borderColor: event.color ?? '#3788d8',
			textColor: getContrastTextColor(event.color ?? '#3788d8'),
			extendedProps: {
				location: event.location ?? event.extendedProps?.location ?? '',
				room: event.room ?? event.extendedProps?.room ?? '',
				description: event.description ?? event.extendedProps?.description ?? '',
			},
		};
	}

	function createCalendarEventObject(eventPayload, eventId) {
		return new CalendarEvent(
			eventPayload.title,
			eventPayload.description ?? '',
			eventPayload.color ?? '#3788d8',
			eventPayload.allDay ?? false,
			new Date(eventPayload.start),
			new Date(eventPayload.end ?? eventPayload.start),
			eventId,
			eventPayload.location ?? '',
			eventPayload.room ?? '',
		);
	}

	async function loadCalendarEvents() {
		if (!rooms.currentRoomExists) {
			calendarEvents.value = [];
			return;
		}

		try {
			const events = await getCalendarEvents(currentRoomId.value);
			calendarEvents.value = events.map(mapCalendarEventToFullCalendarEvent);
		} catch (err) {
			console.error('Failed to load calendar events', err);
			calendarEvents.value = [];
		}
	}

	onMounted(loadCalendarEvents);
	watch(() => rooms.currentRoomId, loadCalendarEvents);
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

	function getContrastTextColor(bgColor) {
		let r, g, b;

		// HEX → RGB
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

	async function handleDeleteEvent(eventId) {
		if (!rooms.currentRoomExists) {
			console.error('Cannot delete event without a selected room.');
			return;
		}

		try {
			await removeCalendarEvent(currentRoomId.value, eventId);
			await loadCalendarEvents();
		} catch (err) {
			console.error('Failed to delete calendar event', err);
		}
		showEventDetailsDialog.value = false;
	}

	// Calendar options
	const calendarOptions = ref({
		plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
		initialView: isMobile.value ? 'listWeek' : 'dayGridMonth',
		selectable: true,

		eventClassNames(arg) {
			return arg.event.allDay ? ['all-day-event'] : ['timed-event'];
		},

		firstDay: 1, // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
		headerToolbar: {
			left: 'prev,next today',
			center: 'title',
			right: isMobile.value ? 'dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay',
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

			// Day view - full day name (Monday)
			timeGridDay: {
				dayHeaderFormat: { weekday: 'long' },
			},
		},

		// Customize the title format
		titleFormat: {
			year: 'numeric',
			month: 'long',
		},

		dayHeaderContent: function (arg) {
			const viewType = arg.view.type;

			// Month view -- keep default rendering
			if (viewType === 'dayGridMonth') {
				const weekdayShort = arg.date.toLocaleDateString(locale.value, { weekday: 'short' });
				return { html: `<span class="month-day-name">${weekdayShort}</span>` };
			}

			const date = arg.date;
			const weekday = date.toLocaleDateString(locale.value, { weekday: 'short' });
			const day = date.getDate();

			return {
				html: `<span>${weekday}</span><span class="fc-day-number">${day}</span>`,
			};
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

		// Time format (24h or 12h)
		slotLabelFormat: {
			hour: 'numeric',
			minute: '2-digit',
			hour12: !is24Hour.value,
		},
		eventTimeFormat: {
			hour: 'numeric',
			minute: '2-digit',
			hour12: !is24Hour.value,
		},

		// Loading state
		loading: handleLoading,
	});

	watch(locale, () => {
		if (fullCalendar.value) {
			// Update the calendar with new locale
			fullCalendar.value.getApi().setOption('locales', [getCalendarLocale()]);
			fullCalendar.value.getApi().setOption('locale', locale.value);
		}
	});

	watch(is24Hour, (val) => {
		if (fullCalendar.value) {
			const timeFormat = { hour: 'numeric', minute: '2-digit', hour12: !val };
			fullCalendar.value.getApi().setOption('slotLabelFormat', timeFormat);
			fullCalendar.value.getApi().setOption('eventTimeFormat', timeFormat);
		}
	});

	function addOneDay(dateStr) {
		const d = new Date(dateStr);
		d.setDate(d.getDate() + 1);

		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	}

	function addEvent(newEvent) {
		const textColor = getContrastTextColor(newEvent.color);

		calendarEvents.value.push({
			title: newEvent.title,
			start: newEvent.start,
			end: newEvent.allDay ? addOneDay(newEvent.end) : newEvent.end,
			allDay: newEvent.allDay,
			backgroundColor: newEvent.color,
			borderColor: newEvent.color,
			textColor,
			extendedProps: {
				location: newEvent.location,
				room: newEvent.room,
				description: newEvent.description,
			},
		});
	}

	function handleDateClick(info) {
		const isAllDayClick = info.allDay;

		let start, end;

		if (isAllDayClick) {
			const date = new Date(info.date);

			selectedRange.value = {
				startStr: date.toISOString(),
				endStr: date.toISOString(), // SAME DAY
				allDay: true,
			};
		} else {
			const clickedDate = new Date(info.date);
			// Determine if clicked time is midnight (month view)
			const isMonthViewClick = clickedDate.getHours() === 0 && clickedDate.getMinutes() === 0;

			// Set start time
			start = new Date(clickedDate);

			if (isMonthViewClick) {
				start.setHours(8, 0, 0, 0);
			}

			end = new Date(start);
			end.setMinutes(start.getMinutes() + 30);

			selectedRange.value = {
				startStr: start.toISOString(),
				endStr: end.toISOString(),
				allDay: false,
			};
		}

		showEventCreationDialog.value = true;
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

	async function handleAddEvent(newEvent) {
		if (!rooms.currentRoomExists) {
			console.error('Cannot add event without a selected room.');
			console.error('Calendar debug: currentRoomId=', currentRoomId.value);
			console.error('Calendar debug: rooms.rooms keys=', Object.keys(rooms.rooms));
			console.error('Calendar debug: rooms.roomList=', rooms.roomList);
			return;
		}

		try {
			if (selectedEventForEdit.value) {
				await updateCalendarEvent(currentRoomId.value, selectedEventForEdit.value.id, createCalendarEventObject(newEvent, selectedEventForEdit.value.id));
				selectedEventForEdit.value = null;
			} else {
				await createCalendarEvent(currentRoomId.value, createCalendarEventObject(newEvent));
			}
			await loadCalendarEvents();
		} catch (err) {
			console.error('Failed to save calendar event', err);
		}

		showEventCreationDialog.value = false;
	}

	function handleSelect(info) {
		selectedRange.value = { startStr: info.startStr, endStr: info.endStr, allDay: info.allDay };
		showEventCreationDialog.value = true;
	}

	async function handleEventDrop(info) {
		console.log('Event dropped:', info.event);
		if (!rooms.currentRoomExists) {
			return;
		}

		try {
			await updateCalendarEvent(
				currentRoomId.value,
				info.event.id,
				createCalendarEventObject({
					title: info.event.title,
					description: info.event.extendedProps?.description,
					color: info.event.backgroundColor,
					allDay: info.event.allDay,
					start: info.event.start,
					end: info.event.end ?? info.event.start,
				}),
			);
			await loadCalendarEvents();
		} catch (err) {
			console.error('Failed to update event after drag', err);
		}
		emit('eventUpdated', info.event);
	}

	async function handleEventResize(info) {
		console.log('Event resized:', info.event);
		if (!rooms.currentRoomExists) {
			return;
		}

		try {
			await updateCalendarEvent(
				currentRoomId.value,
				info.event.id,
				createCalendarEventObject({
					title: info.event.title,
					description: info.event.extendedProps?.description,
					color: info.event.backgroundColor,
					allDay: info.event.allDay,
					start: info.event.start,
					end: info.event.end ?? info.event.start,
				}),
			);
			await loadCalendarEvents();
		} catch (err) {
			console.error('Failed to update event after resize', err);
		}
		emit('eventUpdated', info.event);
	}

	function handleLoading(isLoading) {
		console.log('Loading:', isLoading);
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
	:deep(.fc-day-today .fc-daygrid-day-number) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background-color: var(--accent-blue);
		color: var(--on-button-blue);
		border-radius: 50%;
		font-weight: 600;
		line-height: 1;
		font-size: 13px;
		padding: 0;
	}

	/* Today circle in week/day view */
	:deep(.fc-timegrid .fc-day-today .fc-col-header-cell-cushion) {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}

	/* Circle for today in week/day header */
	:deep(.fc-timegrid .fc-day-today .fc-day-number) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		background-color: var(--accent-blue);
		color: var(--on-button-blue);
		border-radius: 50%;
		font-weight: 600;
		font-size: 13px;
	}

	:deep(.fc-col-header-cell-cushion) {
		text-transform: capitalize; /* Capitalizes first letter of each word */
	}

	:deep(.fc-col-header-cell-cushion span:first-child) {
		margin-right: 3px;
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
