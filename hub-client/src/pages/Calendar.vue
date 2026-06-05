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

<script setup lang="ts">
	//components
	import EventCreationDialog from '../components/forms/EventCreationDialog.vue';
	import EventDetailsDialog from '../components/forms/EventDetailsDialog.vue';
	
	//fullCalendar
	import dayGridPlugin from '@fullcalendar/daygrid';
	import interactionPlugin from '@fullcalendar/interaction';
	import timeGridPlugin from '@fullcalendar/timegrid';
	import FullCalendar from '@fullcalendar/vue3';
	import { Direction } from 'matrix-js-sdk';
	import { computed, onMounted, ref, watch } from 'vue';
	import { useI18n } from 'vue-i18n';

	//composables
	import { mapToFullCalendarEvent, buildCalendarEventPayload } from '../composables/calendarUtility';
	import { useCalendarEvents, findAndJoinCalendarRoom, initCalendarRoom } from '../composables/calendar.composable.ts';

	import { TCalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';
	import { useRooms } from '@hub-client/stores/rooms';
	import { useSettings } from '@hub-client/stores/settings';

	//emits
	const emit = defineEmits(['dateSelected', 'eventSelected', 'eventAdded', 'eventUpdated']);

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

	const calendarRoomRef = ref(null);
	const calendarTimelineVersion = computed(() => calendarRoomRef.value?.getTimelineVersion?.() ?? 0);
	const is24Hour = computed(() => settings.timeformat === 'format24');
	const isMobile = computed(() => window.innerWidth < 768);

	const fullCalendar = ref(null);
	const calendarEvents = ref([]);

	async function loadCalendarEvents(calendarRoom) {
		const oldestId = calendarRoom.getTimelineOldestMessageId();
		if (oldestId) {
			await calendarRoom.paginate(Direction.Backward, 50, oldestId);
		}
		try {
			const events = await getCalendarEvents(calendarRoom);
			calendarEvents.value = events.map(mapToFullCalendarEvent);
		} catch (err) {
			console.error('Failed to load calendar events', err);
			calendarEvents.value = [];
		}
	}

	onMounted(async () => {
		const calendarRoom = await initCalendarRoom();
		if (calendarRoom) {
			calendarRoomRef.value = calendarRoom;
			await loadCalendarEvents(calendarRoom);
		}
	});

	watch(calendarTimelineVersion, async () => {
		if (calendarRoomRef.value) {
			await loadCalendarEvents(calendarRoomRef.value);
		}
	});

	watch(
		() => rooms.currentRoomId,
		async () => {
			const calendarRoom = await initCalendarRoom();
			if (calendarRoom) {
				calendarRoomRef.value = calendarRoom;
				await loadCalendarEvents(calendarRoom);
			}
		},
	);

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
			allDayText: 'all-day',
			moreLinkText: 'more',
			noEventsText: 'No events',
			dayNames: [
				t('daysfull.7'),
				t('daysfull.1'),
				t('daysfull.2'),
				t('daysfull.3'),
				t('daysfull.4'),
				t('daysfull.5'),
				t('daysfull.6'),
			],
			dayNamesShort: [
				t('days.7'),
				t('days.1'),
				t('days.2'),
				t('days.3'),
				t('days.4'),
				t('days.5'),
				t('days.6'),
			],
			monthNames: [
				t('monthsfull.1'),
				t('monthsfull.2'),
				t('monthsfull.3'),
				t('monthsfull.4'),
				t('monthsfull.5'),
				t('monthsfull.6'),
				t('monthsfull.7'),
				t('monthsfull.8'),
				t('monthsfull.9'),
				t('monthsfull.10'),
				t('monthsfull.11'),
				t('monthsfull.12'),
			],
			monthNamesShort: [
				t('months.1'),
				t('months.2'),
				t('months.3'),
				t('months.4'),
				t('months.5'),
				t('months.6'),
				t('months.7'),
				t('months.8'),
				t('months.9'),
				t('months.10'),
				t('months.11'),
				t('months.12'),
			],
		};
	};

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
		const calendarRoom = await findAndJoinCalendarRoom(); 
		if (!calendarRoom) return;
		await removeCalendarEvent(calendarRoom.roomId, eventId);
		showEventDetailsDialog.value = false;
		await loadCalendarEvents(calendarRoom);
	}

	const calendarOptions = ref({
		plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
		fixedWeekCount: false,
		slotMinTime: '00:00:00',
		slotMaxTime: '24:00:00',
		expandRows: true,
		initialView: isMobile.value ? 'listWeek' : 'dayGridMonth',
		selectable: true,
		eventClassNames(arg) {
			return arg.event.allDay ? ['all-day-event'] : ['timed-event'];
		},
		firstDay: 1,
		headerToolbar: {
			left: 'prev,next today',
			center: 'title',
			right: isMobile.value ? 'dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay',
		},
		views: {
			dayGridMonth: { dayHeaderFormat: { weekday: 'short' } },
			timeGridWeek: { dayHeaderFormat: { weekday: 'short', day: 'numeric' } },
			timeGridDay: { dayHeaderFormat: { weekday: 'long' } },
		},
		titleFormat: { year: 'numeric', month: 'long' },
		dayHeaderContent: function (arg) {
			const viewType = arg.view.type;
			if (viewType === 'dayGridMonth') {
				const weekdayShort = arg.date.toLocaleDateString(locale.value, { weekday: 'short' });
				return { html: `<span class="month-day-name">${weekdayShort}</span>` };
			}
			const date = arg.date;
			const weekday = date.toLocaleDateString(locale.value, { weekday: 'short' });
			const day = date.getDate();
			return { html: `<span>${weekday}</span><span class="fc-day-number">${day}</span>` };
		},
		weekends: true,
		editable: true,
		selectMirror: true,
		dayMaxEvents: true,
		events: calendarEvents,
		dateClick: handleDateClick,
		eventClick: handleEventClick,
		select: handleSelect,
		eventDrop: handleEventDrop,
		eventResize: handleEventResize,
		eventColor: '#00adee',
		height: 'auto',
		contentHeight: 'auto',
		locales: [getCalendarLocale()],
		locale: locale.value,
		slotLabelFormat: { hour: 'numeric', minute: '2-digit', hour12: !is24Hour.value },
		eventTimeFormat: { hour: 'numeric', minute: '2-digit', hour12: !is24Hour.value },
		loading: handleLoading,
	});

	watch(locale, () => {
		if (fullCalendar.value) {
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
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function handleDateClick(info) {
		if (info.allDay) {
			const date = new Date(info.date);
			selectedRange.value = { startStr: date.toISOString(), endStr: date.toISOString(), allDay: true };
		} else {
			const clickedDate = new Date(info.date);
			const isMonthViewClick = clickedDate.getHours() === 0 && clickedDate.getMinutes() === 0;
			const start = new Date(clickedDate);
			if (isMonthViewClick) start.setHours(8, 0, 0, 0);
			const end = new Date(start);
			end.setMinutes(start.getMinutes() + 30);
			selectedRange.value = { startStr: start.toISOString(), endStr: end.toISOString(), allDay: false };
		}
		showEventCreationDialog.value = true;
	}

	function handleEventClick(info) {
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
		const calendarRoom = await findAndJoinCalendarRoom();
		if (!calendarRoom) {
			console.error('[Calendar.vue] Calendar room not found.');
			return;
		}
		try {
			if (selectedEventForEdit.value) {
				await updateCalendarEvent(calendarRoom.roomId, selectedEventForEdit.value.id, buildCalendarEventPayload(newEvent, selectedEventForEdit.value.id));
				selectedEventForEdit.value = null;
			} else {
				await createCalendarEvent(calendarRoom.roomId, buildCalendarEventPayload(newEvent));
			}
			await loadCalendarEvents(calendarRoom);
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
		if (!rooms.currentRoomExists) return;
		try {
			await updateCalendarEvent(
				currentRoomId.value,
				info.event.id,
				buildCalendarEventPayload({ 
					title: info.event.title,
					description: info.event.extendedProps?.description,
					color: info.event.backgroundColor,
					allDay: info.event.allDay,
					start: info.event.start,
					end: info.event.end ?? info.event.start,
				}),
			);
			const calendarRoom = rooms.rooms[currentRoomId.value];
			if (calendarRoom) await loadCalendarEvents(calendarRoom);
		} catch (err) {
			console.error('Failed to update event after drag', err);
		}
		emit('eventUpdated', info.event);
	}

	async function handleEventResize(info) {
		if (!rooms.currentRoomExists) return;
		try {
			await updateCalendarEvent(
				currentRoomId.value,
				info.event.id,
				buildCalendarEventPayload({
					title: info.event.title,
					description: info.event.extendedProps?.description,
					color: info.event.backgroundColor,
					allDay: info.event.allDay,
					start: info.event.start,
					end: info.event.end ?? info.event.start,
				}),
			);
			const calendarRoom = rooms.rooms[currentRoomId.value];
			if (calendarRoom) await loadCalendarEvents(calendarRoom);
		} catch (err) {
			console.error('Failed to update event after resize', err);
		}
		emit('eventUpdated', info.event);
	}

	function handleLoading(isLoading) {
		console.log('Loading:', isLoading);
	}

	function goToToday() { 
		if (fullCalendar.value) 
			fullCalendar.value.getApi().today(); 
	}

	function nextMonth() { 
		if (fullCalendar.value) 
			fullCalendar.value.getApi().next(); 
	}

	function previousMonth() { 
		if (fullCalendar.value) 
		fullCalendar.value.getApi().prev(); 
	}
	
	function changeView(viewName) { 
		if (fullCalendar.value) 
			fullCalendar.value.getApi().changeView(viewName); 
	}

	defineExpose({ goToToday, nextMonth, previousMonth, changeView });
</script>