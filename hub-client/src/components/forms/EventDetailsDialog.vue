<template>
	<CustomDialog :title="event.title" :large-title="true" :show-delete="canEdit" :show-edit="canEdit" @close="$emit('close')" @edit="onEdit" @delete="onDelete">
        <div class="space-y-3">

            <!-- Date & Time -->
            <div class="flex items-start gap-2">
                <Icon type="calendar" class="mt-0.5 shrink-0" />
                <div>
                    <div class="text-on-surface">{{ formattedDate }}</div>
                    <div v-if="event.allDay" class="text-on-surface/60 text-sm">{{ $t('calendar.isAllDay') }}</div>
                    <div v-else class="text-on-surface/60 text-sm">{{ formattedTime }}</div>
                </div>
            </div>

            <!-- Location -->
            <div v-if="event.extendedProps?.location" class="flex items-center gap-2">
                <Icon type="map-pin" class="shrink-0" />
                <span class="text-on-surface">{{ event.extendedProps.location }}</span>
            </div>

            <!-- Room -->
            <div v-if="event.extendedProps?.room?.length" class="flex items-center gap-2">
                <Icon type="users" class="shrink-0 text-gray-600" />
                <span class="text-on-surface">
                    {{ Array.isArray(event.extendedProps.room) ? event.extendedProps.room.join(', ') : event.extendedProps.room }}
                </span>
            </div>

            <!-- Description -->
            <div v-if="event.extendedProps?.description" class="flex items-start gap-2">
                <Icon type="chat-circle-text" class="mt-0.5 shrink-0 text-gray-600" />
                <span class="text-on-surface whitespace-pre-wrap">{{ event.extendedProps.description }}</span>
            </div>

        </div>
    </CustomDialog>
</template>

<script setup lang="ts">
	import CustomDialog from '../ui/CustomDialog.vue';
	import { computed } from 'vue';
	import { useI18n } from 'vue-i18n';

	import Icon from '@hub-client/components/elements/Icon.vue';
	import { useTimeFormat } from '@hub-client/composables/useTimeFormat';
	import ValidationErrors from '@hub-client/components/forms/ValidationErrors.vue';
	import Dialog from '@hub-client/components/ui/Dialog.vue';

	const { t, locale } = useI18n();
	const { formatDate } = useTimeFormat();

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
</script>