// Packages
import { ref } from 'vue';

const useKeyStrokes = () => {
<<<<<<< HEAD
	const items = ref([] as Array<any>);
	const cursor = ref(0);
	const selected = ref(undefined as any);

	const setItems = (newItems: Array<any>) => {
=======
	const items = ref([] as Array<unknown>);
	const cursor = ref(0);
	const selected = ref<unknown>(undefined);

	const setItems = (newItems: Array<unknown>) => {
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		items.value = newItems;
		reset();
	};

	const cursorDown = () => {
		if (cursor.value < items.value.length - 1) {
			cursor.value++;
		}
	};

	const cursorUp = () => {
		if (cursor.value > 0) {
			cursor.value--;
		}
	};

<<<<<<< HEAD
	const selectItem = (item: any) => {
=======
	const selectItem = (item: unknown) => {
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		selected.value = item;
		cursor.value = 0;
	};

<<<<<<< HEAD
	const selectItemByEnter = (): any => {
=======
	const selectItemByEnter = (): unknown => {
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
		if (selected.value === undefined) {
			const item = items.value[cursor.value];
			selected.value = item;
			cursor.value = 0;
		}
		return selected.value;
	};

	const reset = () => {
		cursor.value = 0;
		selected.value = undefined;
	};

	return {
		setItems,
		cursor,
		selected,
		cursorDown,
		cursorUp,
		selectItem,
		selectItemByEnter,
		reset,
	};
};

export { useKeyStrokes };
