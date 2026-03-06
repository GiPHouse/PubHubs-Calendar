<template>
	<Dialog :title="$t('calendar.event_details')" :buttons="buttonsClose" @close="dialogAction($event)">
		<div class="space-y-4">
			<!-- Event Title -->
			<div class="flex flex-col md:flex-row">
				<label class="text-gray w-2/6 font-semibold">{{ $t('calendar.title') }}</label>
				<div class="text-on-surface text-body p-1 md:w-4/6">
					{{ event.title }}
				</div>
			</div>

			<!-- Date/Time -->
			<div class="flex flex-col md:flex-row">
				<label class="text-gray w-2/6 font-semibold">{{ $t('calendar.date') }}</label>
				<div class="text-on-surface text-body p-1 md:w-4/6">
					<div>{{ formattedDate }}</div>
					<div v-if="!event.allDay" class="text-on-surface-dim text-sm">
						{{ formattedTime }}
					</div>
				</div>
			</div>

			<!-- All Day Indicator -->
			<div v-if="event.allDay" class="flex flex-col md:flex-row">
				<label class="text-gray w-2/6 font-semibold">{{ $t('calendar.all_day') }}</label>
				<div class="text-on-surface text-body p-1 md:w-4/6">
					<Icon type="check-circle" class="text-accent-green h-5 w-5" />
				</div>
			</div>

			<!-- Location (if available) -->
			<div v-if="event.extendedProps?.location" class="flex flex-col md:flex-row">
				<label class="text-gray w-2/6 font-semibold">{{ $t('calendar.location') }}</label>
				<div class="text-on-surface text-body p-1 md:w-4/6">
					<div class="flex items-center gap-2">
						<Icon type="map-pin" size="sm" class="text-on-surface-dim" />
						{{ event.extendedProps.location }}
					</div>
				</div>
			</div>

			<!-- Description (if available) -->
			<div v-if="event.extendedProps?.description" class="flex flex-col md:flex-row">
				<label class="text-gray w-2/6 font-semibold">{{ $t('calendar.description') }}</label>
				<div class="text-on-surface text-body p-1 whitespace-pre-wrap md:w-4/6">
					{{ event.extendedProps.description }}
				</div>
			</div>

			<!-- Participants/Attendees (if available) -->
			<div v-if="event.extendedProps?.attendees?.length" class="flex flex-col md:flex-row">
				<label class="text-gray w-2/6 font-semibold">{{ $t('calendar.attendees') }}</label>
				<div class="text-on-surface text-body p-1 md:w-4/6">
					<div v-for="attendee in event.extendedProps.attendees" :key="attendee" class="flex items-center gap-2">
						<Avatar :avatarUrl="attendee.avatar" :userId="attendee.id" size="sm" />
						<span>{{ attendee.name }}</span>
					</div>
				</div>
			</div>

			<!-- Created by / Organizer -->
			<div v-if="event.extendedProps?.organizer" class="flex flex-col md:flex-row">
				<label class="text-gray w-2/6 font-semibold">{{ $t('calendar.organizer') }}</label>
				<div class="text-on-surface text-body flex items-center gap-2 p-1 md:w-4/6">
					<Avatar :avatarUrl="event.extendedProps.organizer.avatar" :userId="event.extendedProps.organizer.id" size="sm" />
					<span>{{ event.extendedProps.organizer.name }}</span>
				</div>
			</div>

			<!-- Event ID (optional, for debugging) -->
			<div v-if="showEventId" class="flex flex-col md:flex-row">
				<label class="text-gray w-2/6 font-semibold">{{ $t('calendar.event_id') }}</label>
				<div class="text-on-surface-dim text-body truncate p-1 text-sm md:w-4/6">
					{{ event.id }}
				</div>
			</div>
		</div>

		<!-- Edit and Delete buttons (if user has permission) -->
		<div v-if="canEdit" class="mt-6 flex justify-end gap-2 border-t pt-4">
			<Button @click="editEvent" class="bg-accent-blue hover:bg-button-blue text-white">
				<Icon type="pencil-simple" size="sm" class="mr-2" />
				{{ $t('calendar.edit') }}
			</Button>
			<Button @click="deleteEvent" class="bg-accent-red hover:bg-button-red text-white">
				<Icon type="trash" size="sm" class="mr-2" />
				{{ $t('calendar.delete') }}
			</Button>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
	import { computed } from 'vue';
	import { useI18n } from 'vue-i18n';

	import Button from '@hub-client/components/elements/Button.vue';
	import Icon from '@hub-client/components/elements/Icon.vue';
	import Avatar from '@hub-client/components/ui/Avatar.vue';
	import Dialog from '@hub-client/components/ui/Dialog.vue';

	import { DialogButtonAction, DialogSubmit, buttonsClose } from '@hub-client/stores/dialog';

	const { t } = useI18n();

	interface Props {
		event: any; // FullCalendar event object
		canEdit?: boolean;
		showEventId?: boolean;
	}

	const props = withDefaults(defineProps<Props>(), {
		canEdit: false,
		showEventId: false,
	});

	const emit = defineEmits(['close', 'edit', 'delete']);

	// Format date based on event type
	const formattedDate = computed(() => {
		const start = new Date(props.event.start);
		const end = props.event.end ? new Date(props.event.end) : null;

		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		};

		if (props.event.allDay) {
			if (end && end > start) {
				// Multi-day all day event
				return `${start.toLocaleDateString(props.event.locale || 'en', options)} - ${end.toLocaleDateString(props.event.locale || 'en', options)}`;
			}
			return start.toLocaleDateString(props.event.locale || 'en', options);
		} else {
			return start.toLocaleDateString(props.event.locale || 'en', options);
		}
	});

	// Format time for non-all-day events
	const formattedTime = computed(() => {
		if (props.event.allDay) return '';

		const start = new Date(props.event.start);
		const end = props.event.end ? new Date(props.event.end) : null;

		const timeOptions: Intl.DateTimeFormatOptions = {
			hour: '2-digit',
			minute: '2-digit',
		};

		if (end) {
			return `${start.toLocaleTimeString(props.event.locale || 'en', timeOptions)} - ${end.toLocaleTimeString(props.event.locale || 'en', timeOptions)}`;
		}
		return start.toLocaleTimeString(props.event.locale || 'en', timeOptions);
	});

	function dialogAction(action: DialogButtonAction) {
		if (action === DialogSubmit) {
			emit('close');
		}
	}

	function editEvent() {
		emit('edit', props.event);
	}

	function deleteEvent() {
		if (confirm(t('calendar.confirm_delete'))) {
			emit('delete', props.event);
		}
	}
</script>

<style scoped>
	/* Add any custom styles if needed */
</style>
