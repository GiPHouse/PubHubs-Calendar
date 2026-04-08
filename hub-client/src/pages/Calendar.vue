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
	import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
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
			allDayText: 'all-day',
			moreLinkText: 'more',
			noEventsText: 'No events',

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

			// Month names
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
		const rgb = bgColor.match(/\d+/g)?.map(Number);
		if (!rgb) return 'white';

		const [r, g, b] = rgb;
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness > 150 ? 'black' : 'white';
	}

	// Track if we've already processed the current view to prevent duplicates
	let lastProcessedDate = null;

	// Calendar options
	const calendarOptions = ref({
		plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
		initialView: isMobile.value ? 'listWeek' : 'dayGridMonth',
		selectable: true,

		eventDidMount(info) {
			const bg = window.getComputedStyle(info.el).backgroundColor;
			const textColor = getContrastTextColor(bg);
			info.el.style.color = textColor;
		},

		firstDay: 1,
		headerToolbar: {
			left: 'prev,next today',
			center: 'title',
			right: isMobile.value ? 'dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay',
		},

		// Today circle in month view day cells - with duplicate prevention
		dayCellDidMount: function (info) {
			const today = new Date().toDateString();
			const cellDate = info.date.toDateString();

			if (cellDate === today) {
				const dayNumberEl = info.el.querySelector('.fc-daygrid-day-number');
				if (dayNumberEl) {
					// Check if already has the today circle wrapper to prevent duplication
					if (!dayNumberEl.querySelector('.today-circle-wrapper')) {
						const dayNumber = dayNumberEl.innerText.trim();
						dayNumberEl.innerHTML = `<span class="today-circle-wrapper"><span class="today-circle">${dayNumber}</span></span>`;
					}
				}
			}
		},

		// Clean up when view changes to prevent duplicates
		datesSet: function (info) {
			// Reset processed date tracker
			lastProcessedDate = null;
		},

		views: {
			dayGridMonth: {
				dayHeaderFormat: { weekday: 'short' },
				dayHeaderClassNames: 'month-day-header',
			},
			timeGridWeek: {
				dayHeaderFormat: { weekday: 'short' },
			},
			timeGridDay: {
				dayHeaderFormat: { weekday: 'long' },
				dayHeaderClassNames: 'day-view-header',
			},
		},

		titleFormat: {
			year: 'numeric',
			month: 'long',
		},

		dayHeaderContent: function (arg) {
			const viewType = arg.view.type;

			// Month view — short weekday names only
			if (viewType === 'dayGridMonth') {
				const weekdayShort = arg.date.toLocaleDateString(locale.value, { weekday: 'short' });
				return { html: `<span class="month-day-name">${weekdayShort}</span>` };
			}

			// Day view — full weekday name
			if (viewType === 'timeGridDay') {
				const weekdayLong = arg.date.toLocaleDateString(locale.value, { weekday: 'long' });
				return { html: `<span class="day-view-name">${weekdayLong}</span>` };
			}

			// Week view — consistent styling for both day name and number
			const date = arg.date;
			const weekday = date.toLocaleDateString(locale.value, { weekday: 'short' });
			const day = date.getDate();
			const isToday = date.toDateString() === new Date().toDateString();

			// Use same styling for both name and number
			const dayNumHtml = isToday ? `<span class="fc-day-number fc-day-number--today">${day}</span>` : `<span class="fc-day-number">${day}</span>`;

			return {
				html: `<span class="fc-day-name">${weekday}</span>${dayNumHtml}`,
			};
		},

		weekends: true,
		editable: true,
		selectable: true,
		selectMirror: true,
		dayMaxEvents: true,
		events: calendarEvents,

		dateClick: handleDateClick,
		eventClick: handleEventClick,
		select: handleSelect,
		eventDrop: handleEventDrop,
		eventResize: handleEventResize,

		eventColor: '#3788d8',
		aspectRatio: isMobile.value ? 0.8 : 1.35,
		contentHeight: 'auto',
		locales: [getCalendarLocale()],
		locale: locale.value,
		loading: handleLoading,
	});

	watch(locale, () => {
		if (fullCalendar.value) {
			fullCalendar.value.getApi().setOption('locales', [getCalendarLocale()]);
			fullCalendar.value.getApi().setOption('locale', locale.value);
			fullCalendar.value.getApi().render();
		}
	});

	function addEvent(newEvent) {
		calendarEvents.value.push({
			id: Date.now().toString(),
			title: newEvent.title,
			start: newEvent.start,
			end: newEvent.end,
			backgroundColor: newEvent.color,
			borderColor: newEvent.color,
			extendedProps: {
				location: newEvent.location,
				room: newEvent.room,
				description: newEvent.description,
			},
		});
		showEventCreationDialog.value = false;
	}

	function handleDateClick(info) {
		const clickedDate = new Date(info.date);
		const isMonthViewClick = clickedDate.getHours() === 0 && clickedDate.getMinutes() === 0;

		const start = new Date(clickedDate);
		if (isMonthViewClick) {
			start.setHours(8, 0, 0, 0);
		}

		const end = new Date(start);
		end.setMinutes(start.getMinutes() + 30);

		selectedRange.value = {
			startStr: start.toISOString(),
			endStr: end.toISOString(),
		};

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

	function handleSelect(info) {
		selectedRange.value = { startStr: info.startStr, endStr: info.endStr };
		showEventCreationDialog.value = true;
	}

	function handleEventDrop(info) {
		console.log('Event dropped:', info.event);
		emit('eventUpdated', info.event);
	}

	function handleEventResize(info) {
		console.log('Event resized:', info.event);
		emit('eventUpdated', info.event);
	}

	function handleLoading(isLoading) {
		console.log('Loading:', isLoading);
	}

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

	defineExpose({
		goToToday,
		nextMonth,
		previousMonth,
		changeView,
	});
</script>

<style scoped>
	.calendar-wrapper {
		width: 100%;
	}

	@media (max-width: 768px) {
		.calendar-wrapper {
			width: 100%;
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
		min-width: 70px;
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

	/* Month view events — dark text */
	:deep(.fc-daygrid-event .fc-event-title),
	:deep(.fc-daygrid-event .fc-event-time) {
		color: var(--on-surface) !important;
	}

	/* Week / day view events — white text */
	:deep(.fc-timegrid-event .fc-event-title),
	:deep(.fc-timegrid-event .fc-event-time) {
		color: white !important;
	}

	:deep(.fc-event:hover) {
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:deep(.fc-timegrid-axis) {
		width: 70px;
	}

	:deep(.fc-timegrid-slot) {
		height: 30px;
	}

	:deep(.fc-timegrid-slot-label) {
		font-size: 12px;
		color: var(--on-surface-dim);
	}

	:deep(.fc-timegrid-slot-label-frame) {
		color: var(--on-surface-dim);
	}

	/* Unified header styling - consistent height for all views */
	:deep(.fc-col-header-cell) {
		padding: 0;
		background-color: var(--surface-low);
		font-weight: 600;
		font-size: 14px;
		color: var(--on-surface);
		height: 56px;
		box-sizing: border-box;
		vertical-align: middle;
	}

	:deep(.fc-col-header-cell-cushion) {
		color: var(--on-surface);
		text-decoration: none;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		height: 56px;
		box-sizing: border-box;
		line-height: 1.4;
	}

	/* Month view header styling */
	:deep(.month-day-header) {
		height: 56px;
	}

	:deep(.month-day-name) {
		font-weight: 600;
		font-size: 14px;
		color: var(--on-surface);
		display: inline-block;
		line-height: 1.4;
	}

	/* Day view header styling */
	:deep(.day-view-header) {
		height: 56px;
	}

	:deep(.day-view-name) {
		font-weight: 600;
		font-size: 14px;
		color: var(--on-surface);
		display: inline-block;
		line-height: 1.4;
	}

	/* Day numbers */
	:deep(.fc-daygrid-day-number) {
		font-weight: 500;
		font-size: 14px;
		color: var(--on-surface);
		padding: 0.5rem;
		text-decoration: none;
		display: inline-block;
	}

	:deep(.fc-daygrid-day-frame) {
		min-height: 100px;
	}

	:deep(.fc-timegrid-axis-frame) {
		font-size: 12px;
	}

	:deep(.fc-day-header) {
		color: var(--on-surface);
		font-size: 14px;
	}

	/* Month view today circle */
	:deep(.fc-day-today .fc-daygrid-day-number) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
	}

	:deep(.today-circle-wrapper) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
	}

	:deep(.today-circle) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background-color: var(--today-button);
		color: white;
		border-radius: 50%;
		font-weight: 600;
		font-size: 13px;
		line-height: 1;
	}

	/* Week view header styling - consistent font and size for both day name and number */
	:deep(.fc-timegrid .fc-col-header-cell-cushion) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		flex-wrap: nowrap;
		font-size: 14px;
		font-weight: 500;
	}

	/* Week view: day name styling - same as day number */
	:deep(.fc-day-name) {
		font-size: 14px;
		font-weight: 500;
		display: inline-block;
		line-height: 1.4;
	}

	/* Week view: day number styling - same as day name */
	:deep(.fc-day-number) {
		font-size: 14px;
		font-weight: 500;
		display: inline-block;
		line-height: 1.4;
		min-width: 28px;
		text-align: center;
	}

	/* Week view: day number wrapper */
	:deep(.fc-day-number-wrapper) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
		height: 28px;
	}

	/* Week view: today's day number circle - consistent styling */
	:deep(.fc-day-number--today) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background-color: var(--today-button);
		color: white;
		border-radius: 50%;
		font-weight: 600;
		font-size: 14px;
		line-height: 1;
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

		:deep(.fc-timegrid-axis) {
			width: 50px;
		}

		:deep(.fc-timegrid-slot-label) {
			font-size: 10px;
		}

		/* Mobile header heights - consistent */
		:deep(.fc-col-header-cell) {
			height: 48px;
		}

		:deep(.fc-col-header-cell-cushion) {
			height: 48px;
		}

		:deep(.month-day-header),
		:deep(.day-view-header) {
			height: 48px;
		}

		:deep(.fc-day-number--today),
		:deep(.today-circle) {
			width: 24px;
			height: 24px;
			font-size: 12px;
		}

		:deep(.today-circle-wrapper) {
			width: 24px;
			height: 24px;
		}

		:deep(.fc-day-number-wrapper) {
			min-width: 24px;
			height: 24px;
		}

		/* Ensure consistent font sizes on mobile */
		:deep(.fc-day-name),
		:deep(.fc-day-number) {
			font-size: 12px;
		}

		:deep(.fc-day-number--today) {
			font-size: 12px;
		}
	}
</style>
