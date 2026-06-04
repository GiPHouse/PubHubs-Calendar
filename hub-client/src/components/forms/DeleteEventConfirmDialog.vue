<template>
    <div class="fixed top-0 left-0 z-50 h-full w-full" @keydown.esc="$emit('close')">
        <!-- Scrim -->
        <div class="bg-surface-high absolute h-full w-full opacity-80" @click="$emit('close')" />

        <!-- Dialog -->
        <div class="relative flex h-full w-full items-center justify-center">
            <div class="bg-surface-low shadow-surface-high flex flex-col gap-4 rounded-md p-6 shadow-xl w-4/5 md:w-3/5 lg:w-2/5" @click.stop>
                <!-- Divider -->
                <div class="h-px bg-gray-200"></div>

                <!-- Content -->
                <div class="text-base">
                    {{ t('calendar.deleteEvent') }}
                </div>

                <!-- Divider -->
                <div class="h-px bg-gray-200"></div>

                <!-- Footer -->
                <div class="flex gap-2">
                    <Button class="mr-auto" color="secondary" @click="$emit('close')">
                        {{ t('dialog.cancel') }}
                    </Button>
                    <Button @click="confirm">
                        {{ t('dialog.yes') }}
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import Button from '@hub-client/components/elements/Button.vue';
    import { useI18n } from 'vue-i18n';

    const props = defineProps<{
        eventId: string;
    }>();

    const emit = defineEmits(['close', 'delete']);

    const { t } = useI18n();

    function confirm() {
        emit('delete', props.eventId);
        emit('close');
    }
</script>