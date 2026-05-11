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
	//components
	import EventCreationDialog from '../components/forms/EventCreationDialog.vue';
	import EventDetailsDialog from '../components/forms/EventDetailsDialog.vue';

	//composables
	import {useCalendarEvents} from '../composables/calendar.composable.ts';

	//fullCalendar
	import dayGridPlugin from '@fullcalendar/daygrid';
	import interactionPlugin from '@fullcalendar/interaction';
	import timeGridPlugin from '@fullcalendar/timegrid';
	import FullCalendar from '@fullcalendar/vue3';

	//stores
	import { useRooms } from '@hub-client/stores/rooms';
	
	import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';
	import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
	import { useI18n } from 'vue-i18n';
	import { useSettings } from '@hub-client/stores/settings';

	// Emits - must be declared before use in handleEventDrop/handleEventResize
	const emit = defineEmits(['dateSelected', 'eventSelected', 'eventAdded', 'eventUpdated']);

	const { createCalendarEvent, removeCalendarEvent, updateCalendarEvent } = useCalendarEvents();

	// Event creation
	const showEventCreationDialog = ref(false);
	const selectedRange = ref({ startStr: '', endStr: '', allDay: false });

	const showEventDetailsDialog = ref(false);
	const selectedEventForEdit = ref(null);
	const selectedEvent = ref(null);

	const { t, locale } = useI18n();

	const settings = useSettings();

	const is24Hour = computed(() => settings.timeformat === 'format24');

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
			backgroundColor: '#00adee',
			borderColor: '#00adee',
			textColor: getContrastTextColor('#3b82f6'),
		},
		{
			id: '2',
			title: 'Project Deadline',
			start: new Date(new Date().setDate(new Date().getDate() + 2)),
			allDay: true,
			backgroundColor: '#ef4444',
			borderColor: '#ef4444',
			textColor: getContrastTextColor('#ef4444'),
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

	function handleDeleteEvent(eventId) {
		calendarEvents.value = calendarEvents.value.filter((e) => e.id !== eventId);
		showEventDetailsDialog.value = false;
	}

	// Calendar options
	const calendarOptions = ref({
		plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],

		fixedWeekCount: false,

		slotMinTime: "00:00:00",
		slotMaxTime: "24:00:00",
		expandRows: true,

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
		height: "auto",
		contentHeight: "auto",

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

	async function addEvent(newEvent) {
		const textColor = getContrastTextColor(newEvent.color);
		const rooms = useRooms();
		const roomId = rooms.currentRoom?.roomId

		const calendarEvent = new CalendarEvent(
			newEvent.title,
			newEvent.description,
			newEvent.color,
			newEvent.location,
			newEvent.allDay,
			new Date(newEvent.start),
			newEvent.allDay
				? new Date(addOneDay(newEvent.end))
				: new Date(newEvent.end)
		);

		await createCalendarEvent(newEvent.id, calendarEvent);
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
			await addEvent(newEvent);
		}
		showEventCreationDialog.value = false;
	}

	function handleSelect(info) {
		selectedRange.value = { startStr: info.startStr, endStr: info.endStr, allDay: info.allDay };
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