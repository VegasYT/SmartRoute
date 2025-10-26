export interface ICoordinates {
	lat: number;
	lon: number;
}

export type GeolocationError = 'unsupported' | 'refused';

export interface ITask {
	uid: string;
	name: string;
	address: string;
	coords: ICoordinates;
	level: 'standard' | 'vip';
	workStart: string;
	workEnd: string;
	lunchStart: string;
	lunchEnd: string;
}

export interface IOptimizeRoute {
	order: number;
	address: string;
	latitude: number;
	longitude: number;
	estimated_arrival: string;
	departure_time: string;
	travel_time: number;
	service_time: number;
}

export const WEEKDAYS = {
	Monday: 'Понедельник',
	Tuesday: 'Вторник',
	Wednesday: 'Среда',
	Thursday: 'Четверг',
	Friday: 'Пятница',
	Saturday: 'Суббота',
	Sunday: 'Воскресенье',
} as const;

export type Weekday = keyof typeof WEEKDAYS;

