<template>
	<HeaderFooter>
		<template #header>
			<div class="flex h-full flex-col p-4">
				<div class="flex w-fit items-center gap-3 overflow-hidden">
					<H3 class="font-headings text-h3 text-on-surface font-semibold">{{ $t('menu.calendar') }}</H3>
				</div>
			</div>
		</template>

		<!-- FullCalendar Component -->
		<div class="calendar-wrapper p-4 md:p-6">
			<FullCalendar ref="fullCalendar" :options="calendarOptions" />
		</div>
	</HeaderFooter>
</template>

<script setup>
	import dayGridPlugin from '@fullcalendar/daygrid';
	import interactionPlugin from '@fullcalendar/interaction';
	import listPlugin from '@fullcalendar/list';
	import timeGridPlugin from '@fullcalendar/timegrid';
	import FullCalendar from '@fullcalendar/vue3';
	import { computed, ref } from 'vue';

	// Composables
	import { useSidebar } from '@hub-client/composables/useSidebar';

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

	// Calendar options
	const calendarOptions = ref({
		plugins: [listPlugin],
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
			today: 'Today',
			month: 'Month',
			week: 'Week',
			day: 'Day',
			list: 'List',
		},

		// Event colors
		eventColor: '#3788d8',

		// Responsive settings
		aspectRatio: isMobile.value ? 0.8 : 1.35,

		// Locale (adjust based on your needs)
		locale: 'en',

		// Loading state
		loading: handleLoading,

		// Event rendering
		eventContent: renderEventContent,
	});

	// Event handlers
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
		--fc-border-color: #e5e7eb;
		--fc-button-bg-color: #3b82f6;
		--fc-button-border-color: #3b82f6;
		--fc-button-hover-bg-color: #2563eb;
		--fc-button-hover-border-color: #2563eb;
		--fc-button-active-bg-color: #1d4ed8;
		--fc-button-active-border-color: #1d4ed8;
		--fc-event-bg-color: #3b82f6;
		--fc-event-border-color: #3b82f6;
		--fc-today-bg-color: rgba(59, 130, 246, 0.05);
	}

	:deep(.fc-toolbar-title) {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	:deep(.fc-button) {
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		text-transform: capitalize;
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
		color: #374151;
		padding: 0.5rem;
	}

	:deep(.fc-daygrid-day-frame) {
		min-height: 100px;
	}

	:deep(.fc-col-header-cell) {
		padding: 0.75rem 0;
		background-color: #f9fafb;
		font-weight: 600;
		color: #4b5563;
	}

	:deep(.fc-list-event) {
		cursor: pointer;
	}

	:deep(.fc-list-event:hover) {
		background-color: rgba(59, 130, 246, 0.05);
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
	}
</style>
