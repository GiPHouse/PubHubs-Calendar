<template>
	<CustomDialog :title="event.title" :show-delete="canEdit" :show-edit="canEdit" :show-download="canEdit" @close="$emit('close')" @edit="onEdit" @delete="onDelete" @download="onDownload">
		<form class="space-y-4">
			<!-- Date -->
			<div>
				<div class="text-body text-on-surface">
					{{ formattedDate }}
				</div>
				<div v-if="!event.allDay" class="text-body text-on-surface/60">
					{{ formattedTime }}
				</div>
			</div>

			<!-- Location -->
			<div v-if="event.extendedProps?.location">
				<label class="text-on-surface/70 font-semibold">
					{{ $t('calendar.location') }}
				</label>
				<div class="text-body text-on-surface">
					{{ event.extendedProps.location }}
				</div>
			</div>

			<!-- Rooms -->
			<div v-if="event.extendedProps?.room?.length">
				<label class="text-on-surface/70 font-semibold">
					{{ $t('calendar.room') }}
				</label>
				<div class="text-body text-on-surface">
					{{ Array.isArray(event.extendedProps.room) ? event.extendedProps.room.join(', ') : event.extendedProps.room }}
				</div>
			</div>

			<!-- Description -->
			<div v-if="event.extendedProps?.description">
				<label class="text-on-surface/70 font-semibold">
					{{ $t('calendar.description') }}
				</label>
				<div class="text-body text-on-surface whitespace-pre-wrap">
					{{ event.extendedProps.description }}
				</div>
			</div>
		</form>
	</CustomDialog>
</template>

<script setup lang="ts">
	import CustomDialog from '../ui/CustomDialog.vue';
	import { computed } from 'vue';
	import { useI18n } from 'vue-i18n';

	import { useTimeFormat } from '@hub-client/composables/useTimeFormat';

	import { downloadIcsFromEvent } from '@hub-client/logic/calendar.logic';

	import { TCalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';

	interface Props {
		event: any;
		canEdit?: boolean;
	}

	const props = withDefaults(defineProps<Props>(), {
		canEdit: false,
	});

	const { t, locale } = useI18n();
	const { formatDate } = useTimeFormat();

	const emit = defineEmits(['close', 'edit', 'delete']);

	const formattedDate = computed(() => {
		const start = new Date(props.event.start);
		const end = props.event.end ? new Date(props.event.end) : null;

		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
		};

		let dateString;

		if (props.event.allDay) {
			if (end && end > start) {
				dateString = `${start.toLocaleDateString(locale.value || 'en', options)} – ${end.toLocaleDateString(locale.value || 'en', options)}`;
			} else {
				dateString = start.toLocaleDateString(locale.value || 'en', options);
			}
		} else {
			dateString = start.toLocaleDateString(locale.value || 'en', options);
		}

		if (locale.value === 'nl' || locale.value === 'nl-NL') {
			dateString = dateString.replace(/\b\w/g, (l) => l.toUpperCase());
		}

		return dateString;
	});

	const formattedTime = computed(() => {
		if (props.event.allDay) return '';

		const start = new Date(props.event.start);
		const end = props.event.end ? new Date(props.event.end) : null;

		if (end) {
			return `${formatDate(start)} – ${formatDate(end)}`;
		}
		return formatDate(start);
	});

	function onEdit() {
		emit('edit', props.event);
	}

	function onDelete() {
		emit('delete', props.event.id);
	}

	function mapEventToCalendarEvent(event: any): TCalendarEvent {
		return {
			msgtype: event.msgtype,
			title: event.title,
			description: event.extendedProps?.description ?? '',
			color: event.extendedProps?.color ?? event.color ?? '#3788d8',
			location: event.extendedProps?.location ?? '',
			room: event.extendedProps?.room ?? '',
			startTime: event.start instanceof Date ? event.start : new Date(event.start),
			endTime: event.end instanceof Date ? event.end : new Date(event.end ?? event.start),
			isAllDay: event.allDay ?? false,
		} as unknown as TCalendarEvent;
	}

	function onDownload() {
		try {
			downloadIcsFromEvent(mapEventToCalendarEvent(props.event));
		} catch (error) {
			console.error('[EventDetailsDialog] Failed to download iCal', error);
		}
	}
</script>
