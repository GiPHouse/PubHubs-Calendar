import Button from '@hub-client/components/elements/Button.vue';

<template>
    <div class="fixed top-0 left-0 z-50 h-full w-full" @keydown.esc="$emit('close')">
        <!-- Scrim -->
        <div class="bg-surface-high absolute h-full w-full opacity-80" @click="$emit('close')" />

        <!-- Dialog -->
        <div class="relative flex h-full w-full items-center"
             :class="isMobile ? 'justify-end px-3' : 'justify-center'">
            <div class="bg-surface-low shadow-surface-high flex max-h-[90dvh] flex-col gap-3 rounded-md p-4 shadow-xl md:m-4"
                 :class="isMobile ? 'w-[calc(47vw+40px)]' : 'w-4/5 md:w-3/5 lg:w-2/5'"
                 @click.stop>
				<!-- HEADER -->
				<div class="flex w-full items-center justify-between">
					<h2 class="text-lg font-semibold">{{ title }}</h2>
					<button class="cursor-pointer hover:opacity-70" @click="$emit('close')">✕</button>
				</div>

				<!-- Divider -->
				<div class="h-px bg-gray-200"></div>

				<!-- CONTENT -->
				<div class="overflow-y-auto pr-2">
					<slot />
				</div>

				<!-- Divider -->
				<div class="h-px bg-gray-200"></div>

				<!-- FOOTER -->
				<div class="w-full">
					<slot name="footer">
						<div class="flex w-full flex-row-reverse justify-start gap-2">
							<!-- Edit -->
							<Button v-if="showEdit" @click="$emit('edit')">{{ $t('dialog.edit') }}</Button>

							<!-- Delete (pushed to the left) -->
							<Button v-if="showDelete" color="red" @click="$emit('delete')" class="mr-auto">{{ $t('dialog.delete') }}</Button>
						</div>
					</slot>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { useSettings } from '@hub-client/stores/settings';

    const settings = useSettings();
    const isMobile = computed(() => settings.isMobileState);

    defineProps<{
        title: string;
        showDelete?: boolean;
        showEdit?: boolean;
    }>();

    defineEmits(['edit', 'delete']);
</script>