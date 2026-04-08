<template>
	<!-- Outer wrapper -->
	<div class="fixed top-0 right-0 z-50 h-full w-full">
		<!-- Whitening veil (EXACT same as Dialog.vue) -->
		<div class="bg-surface-high absolute h-full w-full opacity-80" />

		<!-- Dialog container -->
		<div role="dialog" class="text-on-surface relative top-0 left-0 flex h-full w-full items-center justify-center" @click.self="$emit('close')">
			<div class="flex w-full justify-center">
				<div class="bg-surface-low shadow-surface-high flex max-h-full w-4/5 flex-col justify-between gap-1 rounded-md p-4 shadow-xl md:m-4 md:w-3/5 lg:w-2/5" @click.stop>
					<!-- Header -->
					<div class="flex w-full items-center justify-between">
						<div></div>
						<Icon type="x" size="md" class="cursor-pointer hover:opacity-75" @click="$emit('close')" />
					</div>

					<!-- Content -->
					<div class="h-full overflow-y-auto py-1 pr-4 text-left">
						<!-- YOUR FORM -->
						<form @submit.prevent="submit" class="space-y-4">
							<!-- Title -->
							<input v-model="form.title" type="text" required class="mt-1 w-full rounded border p-3 text-[22px] leading-tight font-bold" :placeholder="t('calendar.title')" />

							<!-- Date -->
							<div>
								<div class="flex items-center gap-2">
									<Icon type="calendar" />
									<span class="font-medium">{{ formattedDate }}</span>
								</div>

								<div class="mt-2 ml-6 grid grid-cols-2 gap-2">
									<input type="date" v-model="form.startDate" class="rounded border p-2" />
									<input type="time" v-model="form.startTime" step="900" class="rounded border p-2" />
									<input type="date" v-model="form.endDate" class="rounded border p-2" />
									<input type="time" v-model="form.endTime" step="900" class="rounded border p-2" />
								</div>
							</div>

							<!-- Location -->
							<div class="flex items-center gap-2">
								<Icon type="map-pin" />
								<input v-model="form.location" type="text" :placeholder="t('calendar.location')" class="w-full rounded border p-2" />
							</div>

							<!-- Room Multi-Select Dropdown -->
							<div class="flex items-center gap-2">
								<Icon type="users" class="text-gray-600" />
								<div class="relative w-full">
									<!-- Dropdown button -->
									<div @click="showRoomDropdown = !showRoomDropdown" class="flex cursor-pointer items-center justify-between rounded border p-2">
										<span v-if="form.room.length === 0" class="text-gray-400">
											{{ t('calendar.selectRooms') }}
										</span>
										<span v-else>
											{{ form.room.join(', ') }}
										</span>
										<!-- Down arrow -->
										<svg class="ml-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
										</svg>
									</div>

									<!-- Dropdown menu -->
									<div v-if="showRoomDropdown" class="bg-surface-low absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded border p-2 shadow">
										<label v-for="room in rooms" :key="room" class="flex cursor-pointer items-center gap-2">
											<input type="checkbox" :value="room" v-model="form.room" />
											{{ room }}
										</label>
									</div>
								</div>
							</div>

							<!-- Description -->
							<div class="flex items-start gap-2">
								<Icon type="chat-circle-text" class="mt-2 text-gray-600" />
								<textarea v-model="form.description" :placeholder="t('calendar.description')" class="w-full rounded border p-2" rows="3" />
							</div>
						</form>
					</div>

					<!-- Footer -->
					<div class="mt-2 flex w-full flex-row-reverse justify-start gap-2">
						<button type="button" @click="submit" class="border-primary bg-surface-high/60 hover:bg-surface-high/30 text-primary hover:bg-primary hover:text-on-primary cursor-pointer rounded-md border px-4 py-2 transition">
							{{ t('calendar.save') }}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, reactive, ref, watch } from 'vue';
	import { useI18n } from 'vue-i18n';

	import Icon from '@hub-client/components/elements/Icon.vue';

	const { t, locale } = useI18n();

	const showRoomDropdown = ref(false);

	const props = defineProps<{ start: string; end: string }>();
	const emit = defineEmits(['submit', 'close']);

	const rooms = ['Room A', 'Room B', 'Room C'];

	const startDateObj = new Date(props.start);
	const endDateObj = new Date(props.end);

	const form = reactive({
		title: '',
		location: '',
		room: [] as string[],
		description: '',

		startDate: startDateObj,
		startTime: startDateObj.toTimeString().slice(0, 5),

		endDate: endDateObj,
		endTime: (() => {
			// If same day, 30 min later; else same day 30 min slot
			const end = new Date(startDateObj);
			end.setMinutes(end.getMinutes() + 30);
			return end.toTimeString().slice(0, 5);
		})(),
	});

	watch(
		() => [form.startDate, form.startTime, form.endDate, form.endTime],
		() => {
			const start = new Date(form.startDate);
			const end = new Date(form.endDate);
			const [sh, sm] = form.startTime.split(':').map(Number);
			const [eh, em] = form.endTime.split(':').map(Number);
			start.setHours(sh, sm);
			end.setHours(eh, em);

			// SAME DAY: endTime cannot be before startTime
			if (start.toDateString() === end.toDateString() && end <= start) {
				const newEnd = new Date(start);
				newEnd.setMinutes(start.getMinutes() + 1); // 1 min after start
				form.endTime = newEnd.toTimeString().slice(0, 5);
				form.endDate = new Date(start);
			}

			// DIFFERENT DAY: endDate cannot be before startDate
			if (end < start) {
				form.endDate = new Date(start);
				const newEnd = new Date(start);
				newEnd.setMinutes(start.getMinutes() + 30); // default 30-min slot
				form.endTime = newEnd.toTimeString().slice(0, 5);
			}
		},
	);

	watch(
		() => [props.start, props.end],
		([newStart, newEnd]) => {
			const startDateObj = new Date(newStart);
			const endDateObj = new Date(newEnd);

			// If the prop start has hours/minutes (day/week view click), use them
			// Otherwise (month view click), default to 09:00–09:30
			const hasStartTime = startDateObj.getHours() !== 0 || startDateObj.getMinutes() !== 0;
			const hasEndTime = endDateObj.getHours() !== 0 || endDateObj.getMinutes() !== 0;

			form.startDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
			form.startTime = hasStartTime ? `${String(startDateObj.getHours()).padStart(2, '0')}:${String(startDateObj.getMinutes()).padStart(2, '0')}` : '08:00';

			form.endDate = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
			form.endTime = hasEndTime
				? `${String(endDateObj.getHours()).padStart(2, '0')}:${String(endDateObj.getMinutes()).padStart(2, '0')}`
				: (() => {
						const end = new Date(form.startDate);
						end.setHours(8, 30); // default 8:30
						return end.toTimeString().slice(0, 5);
					})();
		},
		{ immediate: true },
	);

	const formattedDate = computed(() => {
		const start = new Date(form.startDate);
		const end = new Date(form.endDate);
		const [sh, sm] = form.startTime.split(':').map(Number);
		const [eh, em] = form.endTime.split(':').map(Number);
		start.setHours(sh, sm);
		end.setHours(eh, em);

		let startStr = start.toLocaleDateString(locale.value, { weekday: 'long', day: 'numeric', month: 'long' });
		let endStr = end.toLocaleDateString(locale.value, { weekday: 'long', day: 'numeric', month: 'long' });

		startStr = startStr.replace(/\b\w/g, (l) => l.toUpperCase());
		endStr = endStr.replace(/\b\w/g, (l) => l.toUpperCase());

		if (startStr === endStr) {
			return `${startStr}, ${form.startTime}–${form.endTime}`;
		}
		return `${startStr} ${form.startTime}–${endStr} ${form.endTime}`;
	});

	function submit() {
		const start = new Date(form.startDate);
		const end = new Date(form.endDate);
		const [sh, sm] = form.startTime.split(':').map(Number);
		const [eh, em] = form.endTime.split(':').map(Number);

		start.setHours(sh, sm);
		end.setHours(eh, em);

		emit('submit', {
			title: form.title,
			location: form.location,
			room: form.room,
			description: form.description,
			start: start.toISOString(),
			end: end.toISOString(),
		});

		showRoomDropdown.value = false;
	}
</script>
