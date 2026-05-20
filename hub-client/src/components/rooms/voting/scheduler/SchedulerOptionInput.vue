<template>
	<button v-if="option.status === 'empty'" class="bg-background hover:bg-surface-high relative mb-1 flex h-[42px] w-full rounded-lg border text-left">
		<div class="mx-2 flex w-full items-center">
			<VueDatePicker id="schedulerDatePickerInput" class="" offset="20" v-model="date" :six-weeks="'fair'" :is-24="is24HourFormat" :locale="locale" range dark :min-date="new Date()" @update:model-value="updateDateOption">
				<template #trigger>
					<p class="text-label flex-1">{{ $t('message.voting.add_option') }}</p>
				</template>
				<template #action-preview="{ value }">
					<div class="text-left text-balance">{{ filters.getDateStr(value, is24HourFormat, d, true) }}</div>
				</template>
			</VueDatePicker>
		</div>
	</button>

	<div v-else-if="option.status === 'filled'" class="bg-background hover:bg-surface-high mb-1 flex h-[42px] w-full items-center justify-between rounded-lg border">
		<div class="flex w-full items-center overflow-hidden">
			<!-- Date picker trigger -->
			<VueDatePicker
				v-model="date"
				:six-weeks="'fair'"
				:is-24="is24HourFormat"
				:locale="locale"
				range
				dark
				:min-date="new Date()"
				:enable-time-picker="!fullDay"
				class="m-auto min-w-10 flex-1 overflow-hidden"
				@internal-model-change="handleInternal"
				@update:model-value="updateDateOption"
			>
				<template #trigger>
					<div class="mx-2 cursor-pointer text-left">
						<div class="text-label truncate">{{ filters.getDateStr(option.date, is24HourFormat, d) }}</div>
					</div>
				</template>
				<template #action-preview="{ value }">
					<div class="text-left text-balance">{{ filters.getDateStr(value, is24HourFormat, d, true) }}</div>
				</template>
				<!-- Only inject time picker overlay when NOT full day -->
				<template v-if="!fullDay" #time-picker-overlay>
					<div class="time-picker-overlay">
						<div v-if="isRangeComplete">
							<VueDatePicker v-model="time" auto-apply inline dark :range="rangeOptions" :time-picker="true" :time="time" @update:modelValue="updateTime" />
						</div>
						<div v-else>
							<VueDatePicker v-model="time" auto-apply inline dark :time-picker="true" :time="time" @update:modelValue="updateTime" />
						</div>
					</div>
				</template>
			</VueDatePicker>

			<!-- Full day toggle -->
			
			<button
				class="ml-auto flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-xs transition-all"
				:class="fullDay
					? 'text-primary'
					: 'text-label-muted hover:text-label'"
				@click.stop="toggleFullDay"
				:title="fullDay ? $t('message.voting.disable_full_day') : $t('message.voting.full_day')"
			>
				<span class="whitespace-nowrap text-xs">{{ $t('message.voting.full_day') }}</span>
				<!-- Toggle switch -->
				<span
					class="relative inline-flex h-3 w-5 shrink-0 items-center rounded-full transition-colors duration-200"
					:class="fullDay ? 'bg-accent-blue border-accent-blue justify-end' : 'bg-accent-blue border-accent-blue'"
				>
					<span
						class="inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200"
						:class="fullDay ? 'translate-x-3.5' : 'translate-x-0.5'"
					/>
				</span>
			</button>

			<div class="mx-1 h-5 w-px shrink-0 bg-border opacity-50" />

			<Icon type="trash" :as-button="true" size="sm" :icon-color="'text-accent-red'" @click="emit('removeOption')" class="mr-2 shrink-0" />
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue';
	import { useI18n } from 'vue-i18n';
	import Icon from '@hub-client/components/elements/Icon.vue';
	import filters from '@hub-client/logic/core/filters';
	import { SchedulerOption } from '@hub-client/models/events/voting/VotingTypes';
	import { TimeFormat, useSettings } from '@hub-client/stores/settings';
	import { languageLocale } from '@hub-client/i18n';

	const emit = defineEmits(['updateOption', 'removeOption']);
	const settings = useSettings();
	const { d, locale: i18nLocale } = useI18n();

	const locale = languageLocale[i18nLocale.value];

	const date = ref<[Date | null, Date | null]>([null, null]);
	const dateBeforeSaved = ref<[Date | null, Date | null]>([null, null]);
	const time = ref();
	const rangeOptions = ref({ disableTimeRangeValidation: false });
	const fullDay = ref(false); // ← properly initialized below in onMounted

	const is24HourFormat = computed(() => {
		return settings.timeformat === TimeFormat.format24;
	});

	const isRangeComplete = computed(() => {
		return dateBeforeSaved.value?.[1] !== null;
	});

	const props = defineProps<{
		option: SchedulerOption;
	}>();

	function getTime(date: Date) {
		return {
			hours: date.getHours(),
			minutes: date.getMinutes(),
		};
	}

	// ← Key fix: read fullDay from the prop on mount
	onMounted(() => {
		fullDay.value = props.option.fullDay ?? false;

		if (props.option.date.length === 0) {
			const coeff = 1000 * 60 * 5;
			const rounded = new Date(Math.ceil(Date.now() / coeff) * coeff);
			const plusOneHour = new Date(rounded.getTime() + 60 * 60 * 1000);
			date.value = [rounded, plusOneHour];
			time.value = [getTime(rounded), getTime(plusOneHour)];
		} else {
			const startDate = new Date(props.option.date[0]);
			let endDate = null;
			if (props.option.date[1] !== null) {
				endDate = new Date(props.option.date[1]);
				time.value = [getTime(startDate), getTime(endDate)];
			} else {
				time.value = getTime(startDate);
			}
			date.value = [startDate, endDate];
		}
	});

	// ← New: toggle full day on/off
	function toggleFullDay() {
		fullDay.value = !fullDay.value;
		if (fullDay.value) {
			// Strip times to midnight–23:59
			const start = new Date(date.value[0]!);
			start.setHours(0, 0, 0, 0);
			const end = date.value[1] ? new Date(date.value[1]) : null;
			if (end) end.setHours(23, 59, 0, 0);
			date.value = [start, end];
		}
		emit('updateOption', date.value, fullDay.value);
	}

	const handleInternal = (dates: any) => {
		if (dates && dates.length === 1) {
			dateBeforeSaved.value = [dates[0], null];
		} else if (dates) {
			dateBeforeSaved.value = dates;
			time.value = [getTime(dates[0]), getTime(dates[1])];
			if (equalDayMonthYear(dates[0], dates[1])) {
				rangeOptions.value = { disableTimeRangeValidation: false };
			} else {
				rangeOptions.value = { disableTimeRangeValidation: true };
			}
		}
	};

	function equalDayMonthYear(date1: Date, date2: Date) {
		const normalizedDate1 = new Date(date1);
		const normalizedDate2 = new Date(date2);
		normalizedDate1.setHours(0, 0, 0, 0);
		normalizedDate2.setHours(0, 0, 0, 0);
		return normalizedDate1.getTime() === normalizedDate2.getTime();
	}

	const updateTime = (time: { hours: number; minutes: number } | Array<{ hours: number; minutes: number }>) => {
		if (!Array.isArray(time)) {
			time = [time];
		}
		const updatedStartDate = new Date(dateBeforeSaved.value[0]!);
		updatedStartDate.setHours(time[0].hours, time[0].minutes);
		let updatedEndDate = null;
		if (dateBeforeSaved.value[1] !== null) {
			updatedEndDate = new Date(dateBeforeSaved.value[1]!);
			updatedEndDate.setHours(time[1].hours, time[1].minutes);
		}
		date.value = [updatedStartDate, updatedEndDate];
	};

	function updateDateOption() {
		emit('updateOption', date.value, fullDay.value);
	}
</script>