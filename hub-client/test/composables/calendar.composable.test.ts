import { validateEvent, useCalendarEvents } from '@hub-client/composables/calendar.composable';

import { CalendarEvent } from '@hub-client/models/events/calendar/TCalendarEvent';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

/**
 * The composable under test exists to validate input and forward to the
 * calendar store. We replace the store module wholesale so the tests only
 * exercise validation behaviour, not Matrix plumbing.
 */
const { addCalendarEventMock, delCalendarEventMock, updateCalendarEventMock, getCalendarEventsMock } = vi.hoisted(() => ({
	addCalendarEventMock: vi.fn(async () => undefined),
	delCalendarEventMock: vi.fn(async () => undefined),
	updateCalendarEventMock: vi.fn(async () => undefined),
	getCalendarEventsMock: vi.fn(async () => [] as CalendarEvent[]),
}));

vi.mock('@hub-client/stores/calendar.stores', () => ({
	useCalendarStore: vi.fn(() => ({
		addCalendarEvent: addCalendarEventMock,
		delCalendarEvent: delCalendarEventMock,
		editCalendarEvent: updateCalendarEventMock,
		getCalendarEvents: getCalendarEventsMock,
	})),
}));

describe("Calendar Composable", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		addCalendarEventMock.mockClear();
		delCalendarEventMock.mockClear();
		updateCalendarEventMock.mockClear();
		getCalendarEventsMock.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("validateEvent passes/fails accordingly", () => {
		test("throws when title is empty", () => {
			const event = new CalendarEvent(
				"",
				"Some description",
				"#abcdef",
				false,
				new Date("2026-03-29T12:00:00.000Z"),
				new Date("2026-03-29T13:00:00.000Z"),
				"someId",
				"Some location",
				"Some room"
			);

			expect(() => validateEvent(event)).toThrow('Calendar event must have a non-empty title!');
		});

		test("throws when color is empty", () => {
			const event = new CalendarEvent(
				"Some title",
				"Some description",
				"",
				false,
				new Date("2026-03-29T12:00:00.000Z"),
				new Date("2026-03-29T13:00:00.000Z"),
				"someId",
				"Some location",
				"Some room"
			);

			expect(() => validateEvent(event)).toThrow('Calendar event must have a non-empty color string!');
		});

		test("throws when color is non-hex", () => {
			const event = new CalendarEvent(
				"Some title",
				"Some description",
				"Some color",
				false,
				new Date("2026-03-29T12:00:00.000Z"),
				new Date("2026-03-29T13:00:00.000Z"),
				"someId",
				"Some location",
				"Some room"
			);

			expect(() => validateEvent(event)).toThrow('Color field is not a valid hexadecimal color string.');
		});

		test("throws when start date is invalid", () => {
			const event = new CalendarEvent(
				"Some title",
				"Some description",
				"#abcdef",
				false,
				//@ts-ignore
				"",
				new Date("2026-03-29T13:00:00.000Z"),
				"someId",
				"Some location",
				"Some room"
			);

			expect(() => validateEvent(event)).toThrow('Calendar event must have valid start and end times');
		});

		test("throws when end date is invalid", () => {
			const event = new CalendarEvent(
				"Some title",
				"Some description",
				"#abcdef",
				false,
				new Date("2026-03-29T12:00:00.000Z"),
				//@ts-ignore
				"",
				"someId",export function validateEvent(calEvent: CalendarEvent): CalendarEvent {
	if (calEvent.title == '') {
		throw new Error('Calendar event must have a non-empty title!');
	}

	if (calEvent.color == '') {
		throw new Error('Calendar event must have a non-empty color string!');
	}

	// Checks if color is a valid hexadecimal (e.g. #6789ab)
	if (!/^#[0-9A-Fa-f]{6}$/.test(calEvent.color)) {
		throw new Error('Color field is not a valid hexadecimal color string.');
	}

	const start = new Date(calEvent.startTime);
	const end = new Date(calEvent.endTime);

	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		throw new Error('Calendar event must have valid start and end times');
	}

	if (end.getTime() <= start.getTime()) {
		throw new Error('Calendar event end time must be after start time');
	}

	return new CalendarEvent(calEvent.title, calEvent.description, calEvent.color, calEvent.isAllDay, start, end, calEvent.id, calEvent.location, calEvent.room);
}
				"Some location",
				"Some room"
			);

			expect(() => validateEvent(event)).toThrow('Calendar event must have valid start and end times');
		});

		test("throws when end date is before start date", () => {
			const event = new CalendarEvent(
				"Some title",
				"Some description",
				"#abcdef",
				false,
				new Date("2026-03-29T13:00:00.000Z"),
				new Date("2026-03-29T12:00:00.000Z"),
				"someId",
				"Some location",
				"Some room"
			);

			expect(() => validateEvent(event)).toThrow('Calendar event end time must be after start time');
		});

		test("validates when an event is okay", () => {
			const event = new CalendarEvent(
				"Some title",
				"Some description",
				"#abcdef",
				false,
				new Date("2026-03-29T12:00:00.000Z"),
				new Date("2026-03-29T13:00:00.000Z"),
				"someId",
				"Some location",
				"Some room"
			);

			expect(validateEvent(event)).toEqual(event);
		});
	});

	describe("store events get delegated properly", () => {
		test("createCalendarEvent gets delegated properly", async () => {
			const event = new CalendarEvent(
				"Some title",
				"Some description",
				"#abcdef",
				false,
				new Date("2026-03-29T12:00:00.000Z"),
				new Date("2026-03-29T13:00:00.000Z"),
				"someId",
				"Some location",
				"Some room"
			);

			await useCalendarEvents().createCalendarEvent("a1b2c3", event);

			expect(addCalendarEventMock).toHaveBeenCalledWith(
				"a1b2c3",
				expect.objectContaining({
					title: "Some title",
					description: "Some description",
					color: "#abcdef",
					isAllDay: false,
					startTime: new Date("2026-03-29T12:00:00.000Z"),
					endTime: new Date("2026-03-29T13:00:00.000Z"),
					id: "someId",
					location: "Some location",
					room: "Some room"
				})
			);
		});

		test("removeCalendarEvent gets delegated properly", async () => {
			await useCalendarEvents().removeCalendarEvent("a1b2c3", "someId");

			expect(delCalendarEventMock).toHaveBeenCalledWith("a1b2c3", "someId");
		});

		test("getCalendarEvents gets delegated properly", async () => {
			const mockRoom = {
				getLiveTimeline: () => ({
					getEvents: () => [],
				}),
			};

			await useCalendarEvents().getCalendarEvents(mockRoom as any);

			expect(getCalendarEventsMock).toHaveBeenCalledWith(mockRoom);
		});
	});
});