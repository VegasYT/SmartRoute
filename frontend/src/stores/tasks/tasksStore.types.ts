import type { IOptimizeRoute, ITask, Weekday } from '@/lib/types';

export interface ITasksStore {
	tasks: ITask[];

	addTask: (task: ITask) => void;
	editTask: (index: number, task: ITask) => void;
	deleteTask: (index: number) => void;
	addTasksFromCsv: (file: string) => void;

	sortTasksByOptimized: (optimized: IOptimizeRoute[]) => void;

	startTime: string | null;
	setStartTime: (time: string) => void;

	startDay: Weekday | null;
	setStartDay: (weekday: Weekday) => void;

	totalDistance: number | null;
	totalDuration: number | null;

	setTotalProperties: (distance: number, duration: number) => void;
}

