<template>
	<Dialog :title="event.title" :buttons="dialogButtons" @close="$emit('close')">
		<form @submit.prevent class="space-y-4">
			<!-- Date row -->
			<div class="flex flex-col md:flex-row">
				<div class="md:w-4/6">
					<div class="text-body text-on-surface rounded-xs border-0 p-1">
						{{ formattedDate }}
					</div>
					<div v-if="!event.allDay" class="text-body text-on-surface/60 p-1">
						{{ formattedTime }}
					</div>
				</div>
			</div>

			<!-- Location -->
			<div v-if="event.extendedProps?.location" class="flex flex-col md:flex-row">
				<label class="text-on-surface/70 w-full font-semibold md:w-2/6">
					{{ $t('calendar.location') }}
				</label>
				<div class="text-body text-on-surface rounded-xs border-0 p-1 md:w-4/6">
					{{ event.extendedProps.location }}
				</div>
			</div>

			<!-- Rooms -->
			<div v-if="event.extendedProps?.room?.length" class="flex flex-col md:flex-row">
				<label class="text-on-surface/70 w-full font-semibold md:w-2/6">
					{{ $t('calendar.room') }}
				</label>
				<div class="text-body text-on-surface rounded-xs border-0 p-1 md:w-4/6">
					{{ Array.isArray(event.extendedProps.room) ? event.extendedProps.room.join(', ') : event.extendedProps.room }}
				</div>
			</div>

			<!-- Description/Comments -->
			<div v-if="event.extendedProps?.description" class="flex flex-col md:flex-row">
				<label class="text-on-surface/70 w-full font-semibold md:w-2/6">
					{{ $t('calendar.description') }}
				</label>
				<div class="text-body text-on-surface rounded-xs border-0 p-1 whitespace-pre-wrap md:w-4/6">
					{{ event.extendedProps.description }}
				</div>
			</div>
		</form>

		<!-- Footer content - this will be passed to Dialog's footer slot -->
		<template #footer>
			<div class="flex items-center gap-2">
				<button v-if="canEdit" @click="deleteEvent" class="cursor-pointer rounded-md border border-red-500 bg-transparent px-5 py-2 text-sm font-medium text-red-500 shadow-sm transition hover:bg-red-500 hover:text-white">
					{{ $t('actions.delete') }}
				</button>
				<button v-if="canEdit" @click="editEvent" class="border-primary text-on-surface hover:bg-surface-high cursor-pointer rounded-md border bg-transparent px-5 py-2 text-sm font-medium shadow-sm transition">
					{{ $t('actions.edit') }}
				</button>
				<button @click="$emit('close')" class="border-primary bg-accent-blue hover:bg-accent-blue/90 text-primary hover:text-on-primary cursor-pointer rounded-md border px-5 py-2 text-sm font-medium shadow-sm transition">
					{{ $t('notifications.info') }}
				</button>
			</div>
		</template>

		<ValidationErrors v-if="validationErrors.length" :errors="validationErrors" />
	</Dialog>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue';
	import { useI18n } from 'vue-i18n';

	import Icon from '@hub-client/components/elements/Icon.vue';
	import ValidationErrors from '@hub-client/components/forms/ValidationErrors.vue';
	import Dialog from '@hub-client/components/ui/Dialog.vue';

	const { t, locale } = useI18n();

	interface Props {
		event: any;
		canEdit?: boolean;
	}

	const props = withDefaults(defineProps<Props>(), {
		canEdit: false,
	});

	const emit = defineEmits(['close', 'edit', 'delete']);

	// Dialog buttons configuration matching SettingsDialog pattern
	const dialogButtons = computed(() => {
		return [
			{
				label: t('close'),
				action: () => emit('close'),
				enabled: true,
			},
		];
	});

	// Validation errors (if needed)
	const validationErrors = ref<string[]>([]);

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

		// Capitalize each word for Dutch locale
		if (locale.value === 'nl' || locale.value === 'nl-NL') {
			dateString = dateString.replace(/\b\w/g, (l) => l.toUpperCase());
		}

		return dateString;
	});

	const formattedTime = computed(() => {
		if (props.event.allDay) return '';

		const start = new Date(props.event.start);
		const end = props.event.end ? new Date(props.event.end) : null;

		const timeOptions: Intl.DateTimeFormatOptions = {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		};

		if (end) {
			return `${start.toLocaleTimeString(locale.value || 'en', timeOptions)} – ${end.toLocaleTimeString(locale.value || 'en', timeOptions)}`;
		}
		return start.toLocaleTimeString(locale.value || 'en', timeOptions);
	});

	function editEvent() {
		// Emit the event data for editing
		emit('edit', {
			id: props.event.id,
			title: props.event.title,
			start: props.event.start,
			end: props.event.end,
			allDay: props.event.allDay,
			color: props.event.backgroundColor,
			extendedProps: props.event.extendedProps,
		});
	}

	function deleteEvent() {
		if (confirm(t('calendar.confirm_delete'))) {
			emit('delete', props.event.id);
		}
	}
</script>
