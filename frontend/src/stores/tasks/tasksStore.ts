import { create } from 'zustand';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

import type { ITask, Weekday } from '@/lib/types';
import type { ITasksStore } from './tasksStore.types';

const useTasksStore = create<ITasksStore>((set, get) => ({
	tasks: localStorage.getItem('tasks') ? (JSON.parse(localStorage.getItem('tasks')!) as ITask[]) : [],

	addTask: (task: ITask) => {
		const newTasks = [...get().tasks];
		newTasks.push(task);
		set({ tasks: newTasks });
		localStorage.setItem('tasks', JSON.stringify(newTasks));
	},
	editTask: (index: number, task: ITask) => {
		const newTasks = [...get().tasks];
		newTasks[index] = task;
		set({ tasks: newTasks });
		localStorage.setItem('tasks', JSON.stringify(newTasks));
	},
	deleteTask: (index: number) => {
		const newTasks = [...get().tasks];
		newTasks.splice(index, 1);
		set({ tasks: newTasks });
		localStorage.setItem('tasks', JSON.stringify(newTasks));
	},
	addTasksFromCsv: (file) => {
		Papa.parse<Record<string, string>>(file, {
			header: true,
			skipEmptyLines: true,
			dynamicTyping: false,
			encoding: 'utf-8',
			worker: true,
			complete: (result) => {
				if (result.errors.length) {
					throw new Error('Ошибка при попытке parsing-а CSV файла');
				}
				const newTasks = [...get().tasks];
				const parsed = result.data;

				parsed.forEach((item, index) => {
					const newTask: ITask = {
						uid: uuidv4(),
						name: `Задача ${index + 1} из CSV-файла`,
						address: item['Адрес объекта'],
						coords: {
							lat: Number(item['Географическая широта']),
							lon: Number(item['Географическая долгота']),
						},
						level:
							item['Уровень клиента'].toLocaleLowerCase().trim() === 'standart' ||
							item['Уровень клиента'].toLocaleLowerCase().trim() === 'standard'
								? 'standard'
								: 'vip',
						workStart: item['Время начала рабочего дня'],
						workEnd: item['Время окончания рабочего дня'],
						lunchStart: item['Время начала обеда'],
						lunchEnd: item['Время окончания обеда'],
					};

					newTasks.push(newTask);
				});

				set({ tasks: newTasks });
				localStorage.setItem('tasks', JSON.stringify(newTasks));
			},
			error: () => {
				throw new Error('Ошибка при попытке parsing-а CSV файла');
			},
		});
	},

	sortTasksByOptimized: (optimized) => {
		const newTasks = [...get().tasks];
		const optimizedMap = new Map(optimized.map((item) => [item.address, item.order]));
		newTasks.sort((a, b) => {
			const orderA = optimizedMap.get(a.address) ?? 0;
			const orderB = optimizedMap.get(b.address) ?? 0;
			return orderA - orderB;
		});
		newTasks.forEach((task, index) => {
			task.estimatedArrival = optimized[index].estimated_arrival;
			task.departureTime = optimized[index].departure_time;
			task.travelTime = optimized[index].travel_time;
		});
		set({ tasks: newTasks });
		localStorage.setItem('tasks', JSON.stringify(newTasks));
	},

	startTime: localStorage.getItem('startTime'),
	setStartTime: (time: string) => {
		set({ startTime: time });
		localStorage.setItem('startTime', time);
	},

	startDay: localStorage.getItem('startDay') as Weekday | null,
	setStartDay: (weekday: Weekday) => {
		set({ startDay: weekday });
		localStorage.setItem('startDay', weekday);
	},

	totalDistance: null,
	totalDuration: null,

	setTotalProperties: (distance, duration) => set({ totalDistance: distance, totalDuration: duration }),
}));

export default useTasksStore;

