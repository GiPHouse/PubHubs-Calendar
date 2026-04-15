<template>
	<CustomDialog :title="event.title" :show-delete="canEdit" :show-edit="canEdit" @close="$emit('close')" @edit="onEdit" @delete="onDelete">
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

	const { locale } = useI18n();

	interface Props {
		event: any;
		canEdit?: boolean;
	}

	const props = withDefaults(defineProps<Props>(), {
		canEdit: false,
	});

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

		const options: Intl.DateTimeFormatOptions = {
			hour: 'numeric',
			minute: '2-digit',
		};

		if (end) {
			return `${start.toLocaleTimeString(locale.value || 'en', options)} – ${end.toLocaleTimeString(locale.value || 'en', options)}`;
		}

		return start.toLocaleTimeString(locale.value || 'en', options);
	});

	function onEdit() {
		emit('edit', props.event);
	}

	function onDelete() {
		emit('delete', props.event.id);
	}
</script>
