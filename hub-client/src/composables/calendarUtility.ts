export function getContrastTextColor(bgColor: string): 'black' | 'white' {
	let r: number, g: number, b: number;
 
	if (bgColor.startsWith('#')) {
		const hex = bgColor.replace('#', '');
		const bigint = parseInt(hex, 16);
		r = (bigint >> 16) & 255;
		g = (bigint >> 8) & 255;
		b = bigint & 255;
	} else {
		const rgb = bgColor.match(/\d+/g)?.map(Number);
		if (!rgb) return 'white';
		[r, g, b] = rgb;
	}
 
	const brightness = (r * 299 + g * 587 + b * 114) / 1000;
	return brightness > 150 ? 'black' : 'white';
}


export function mapToFullCalendarEvent(event: any) {
	const color = event.color ?? '#00adee';
	return {
		id: event.id ?? `${event.title}-${event.startTime?.getTime?.() ?? event.start}-${Math.random().toString(36).slice(2, 8)}`,
		title: event.title,
		start: event.startTime ?? event.start,
		end: event.endTime ?? event.end,
		allDay: event.isAllDay ?? event.allDay,
		backgroundColor: color,
		borderColor: color,
		textColor: getContrastTextColor(color),
		extendedProps: {
			location: event.location ?? event.extendedProps?.location ?? '',
			room: event.room ?? event.extendedProps?.room ?? [],
			description: event.description ?? event.extendedProps?.description ?? '',
		},
	};
}

export function buildCalendarEventPayload(payload: any, eventId: string | null = null) {
	return {
		title: payload.title,
		description: payload.description ?? '',
		color: payload.color ?? '#00adee',
		isAllDay: payload.allDay ?? false,
		startTime: new Date(payload.start),
		endTime: new Date(payload.end ?? payload.start),
		location: payload.location ?? '',
		room: payload.room ?? [],
		...(eventId && { id: eventId }),
	};
}