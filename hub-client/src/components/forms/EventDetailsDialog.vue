<template>
	<CustomDialog :title="event.title" :show-delete="canEdit" :show-edit="canEdit" :show-download="canEdit" @close="$emit('close')" @edit="onEdit" @delete="onDelete" @download="onDownload">
		<form class="space-y-4">
			<!-- Date & Time -->
			<div class="flex items-start gap-3">
				<Icon type="calendar" class="mt-1 shrink-0" />

				<div>
					<div class="text-on-surface font-medium">
						{{ formattedDate }}
					</div>

					<div class="text-on-surface/60 text-sm">
						{{ event.allDay ? $t('calendar.isAllDay') : formattedTime }}
					</div>
				</div>
			</div>

			<!-- Location -->
			<div
				v-if="event.extendedProps?.location"
				class="flex items-start gap-3"
			>
				<Icon type="map-pin" class="mt-1 shrink-0" />

				<div>
					<div class="text-xs tracking-wide text-on-surface/60">
						{{ $t('calendar.location') }}
					</div>

					<div class="text-on-surface">
						{{ event.extendedProps.location }}
					</div>
				</div>
			</div>

			<!-- Room -->
			<div
				v-if="event.extendedProps?.room?.length"
				class="flex items-start gap-3"
			>
				<Icon type="users" class="mt-1 shrink-0" />

				<div>
					<div class="text-xs tracking-wide text-on-surface/60">
						{{ $t('calendar.room') }}
					</div>

					<div class="text-on-surface">
						{{
							Array.isArray(event.extendedProps.room)
								? event.extendedProps.room.join(', ')
								: event.extendedProps.room
						}}
					</div>
				</div>
			</div>

			<!-- Description -->
			<div
				v-if="event.extendedProps?.description"
				class="flex items-start gap-3"
			>
				<Icon type="chat-circle-text" class="mt-1 shrink-0" />

				<div class="min-w-0">
					<div class="text-xs tracking-wide text-on-surface/60">
						{{ $t('calendar.description') }}
					</div>

					<div class="text-on-surface whitespace-pre-wrap">
						{{ event.extendedProps.description }}
					</div>
				</div>
			</div>
		</form>
	</CustomDialog>

	<DeleteEventConfirmDialog
        v-if="showDeleteDialog"
        :eventId="event.id"
        @delete="(id) => emit('delete', id)"
        @close="showDeleteDialog = false"
    />
</template>

<script setup lang="ts">
	import CustomDialog from '../ui/CustomDialog.vue';
	import { computed, ref } from 'vue';
	import { useI18n } from 'vue-i18n';

	import { useTimeFormat } from '@hub-client/composables/useTimeFormat';
	import ValidationErrors from '@hub-client/components/forms/ValidationErrors.vue';
	import Dialog from '@hub-client/components/ui/Dialog.vue';
	import DeleteEventConfirmDialog from './DeleteEventConfirmDialog.vue';

	const showDeleteDialog = ref(false);
	const { t, locale } = useI18n();
	const { formatDate } = useTimeFormat();

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
