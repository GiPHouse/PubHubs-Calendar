<template>
    <div class="flex shrink-0 items-center justify-between pb-4">
        <div class="flex items-center gap-2">
            <h3 class="text-on-surface text-md font-semibold capitalize">{{ title }}</h3>
            <!-- Optional extra button slot -->
            <slot name="action" />
        </div>
        <button
            class="text-on-surface-dim hover:text-on-surface hover:bg-surface-high rounded-md p-1 transition-colors hover:cursor-pointer"
            :aria-label="t('global.close')"
            @click="sidebar?.close?.()"
        >
            <Icon type="x" size="sm" />
        </button>
    </div>
</template>

<script setup lang="ts">
	// Packages
	import { computed } from 'vue';
	import { useI18n } from 'vue-i18n';

	// Components
	import Icon from '@hub-client/components/elements/Icon.vue';

	// Composables
	import { useSidebar } from '@hub-client/composables/useSidebar';

	// Stores
	import { useSettings } from '@hub-client/stores/settings';

	// Props
	defineProps<{
		title: string;
	}>();

	const { t } = useI18n();
	const sidebar = useSidebar();
	const settings = useSettings();

	const isMobile = computed(() => settings.isMobileState);
</script>