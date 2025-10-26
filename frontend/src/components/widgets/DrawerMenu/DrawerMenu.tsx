import { useAutoAnimate } from '@formkit/auto-animate/react';
import styles from './DrawerMenu.module.css';

import { DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { Button } from '@/components/ui/button';

import { ArrowDownToDot, ArrowUpFromDot, Car, CircleX, TrashIcon } from 'lucide-react';
import { UserAddress } from './components/UserAddress';
import { ListActions } from './components/ListActions';
import { useTasksStore } from '@/stores/tasks';
import { toast } from 'sonner';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { analyzeMultiRoutesHelper } from '@/lib/services/analyzeMultiRoutesHelper';
import { useMapsStore } from '@/stores/maps';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

const deleteTask = useTasksStore.getState().deleteTask;
const setStartTime = useTasksStore.getState().setStartTime;

const sortTasksByOptimized = useTasksStore.getState().sortTasksByOptimized;
const setTotalProperties = useTasksStore.getState().setTotalProperties;

const setUserPosition = useMapsStore.getState().setUserPosition;
const setAddressPosition = useMapsStore.getState().setUserAddress;

const DrawerMenu = () => {
	const [chosenTaskIndex, setChosenTaskIndex] = useState<number | null>(null);
	const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
	const [animatedRef] = useAutoAnimate();

	const tasks = useTasksStore((state) => state.tasks);
	const startDay = useTasksStore((state) => state.startDay);
	const startTime = useTasksStore((state) => state.startTime);

	const userAddress = useMapsStore((state) => state.userAddress);
	const userPosition = useMapsStore((state) => state.userPosition);

	const analyzeMultiRoutes = useMutation({
		mutationKey: ['analyze-multi-routes'],
		mutationFn: () =>
			analyzeMultiRoutesHelper({
				clients: [
					...tasks.map((task, index) => ({
						address: task.address,
						latitude: task.coords.lat,
						longitude: task.coords.lon,
						level: task.level,
						work_start: task.workStart,
						work_end: task.workEnd,
						lunch_start: task.lunchStart,
						lunch_end: task.lunchEnd,
						id: String(index + 1),
					})),
				],
				start_point: {
					address: userAddress!,
					latitude: userPosition!.lat,
					longitude: userPosition!.lon,
				},
				start_time: startTime!,
				start_day: startDay!,
			}),
		onSuccess: (data) => {
			sortTasksByOptimized(data.optimized_route);
			setTotalProperties(data.total_distance, data.total_duration);
			toast.success('Анализ мультимаршрута успешно получен, задачи отсортированы');
		},
		onError: (err) => {
			console.error(err);
			toast.error('Не удалось получить анализ мультимаршрута по задачам');
		},
	});

	const handleTaskClick = (index: number) => {
		if (analyzeMultiRoutes.isPending) return;
		setChosenTaskIndex(index);
		setIsTaskDialogOpen(true);
	};

	const handleDoneTask = () => {
		const tasksCopy = [...tasks];
		const currentTask = tasksCopy[0];
		deleteTask(0);
		setUserPosition({
			lat: currentTask.coords.lat,
			lon: currentTask.coords.lon,
		});
		setAddressPosition(currentTask.address);

		const now = new Date();
		const ruTime = now.toLocaleTimeString('ru-RU', {
			timeZone: 'Europe/Moscow',
			hour: '2-digit',
			minute: '2-digit',
		});
		setStartTime(ruTime);
		if (tasksCopy.length > 1) {
			analyzeMultiRoutes.mutate();
		} else {
			setTotalProperties(null, null);
		}
	};

	const canSave = () => !!(userAddress !== null && userPosition && startDay !== null && startTime !== null);

	const hasTask = () => !!useTasksStore.getState().totalDistance && !!useTasksStore.getState().totalDuration;

	return (
		<DrawerContent className='items-center min-h-0'>
			<div className={styles['content']}>
				<DrawerHeader>
					<DrawerTitle>Задачи на день</DrawerTitle>
					<DrawerDescription>Смотрите, добавляйте, выполняйте ваши задачи по встречам в течении дня</DrawerDescription>
				</DrawerHeader>

				<UserAddress isLoading={analyzeMultiRoutes.isPending} />

				<div className={styles['body']}>
					<ListActions
						isLoading={analyzeMultiRoutes.isPending}
						taskIndex={chosenTaskIndex}
						setTaskIndex={setChosenTaskIndex}
						isTaskDialogOpen={isTaskDialogOpen}
						setIsTaskDialogOpen={setIsTaskDialogOpen}
					/>

					<ul ref={animatedRef} className={styles['task-list']}>
						{tasks.map((task, index) => (
							<Item
								key={task.uid}
								onClick={() => handleTaskClick(index)}
								variant='outline'
								className={`${index === 0 && hasTask() ? 'border-green-600' : ''}`}
							>
								<ItemContent>
									<ItemTitle>
										{index + 1}. {task.name}
									</ItemTitle>
									<ItemDescription className='flex flex-col gap-2'>{task.address}</ItemDescription>

									<div className='flex flex-wrap gap-1'>
										{!!task.estimatedArrival && startTime !== task.departureTime && (
											<Badge variant='outline' className='border-lime-600 text-lime-600'>
												<ArrowDownToDot />
												{task.estimatedArrival}
											</Badge>
										)}

										{!!task.departureTime && (
											<Badge variant='outline' className='border-destructive text-destructive'>
												<ArrowUpFromDot />
												{task.departureTime}
											</Badge>
										)}

										{!!task.travelTime && (
											<Badge variant='outline' className='border-primary text-primary'>
												<Car /> {`${Math.floor(task.travelTime)} мин`}
											</Badge>
										)}
									</div>
								</ItemContent>

								<ItemActions>
									<Button
										variant='outline'
										className='border-destructive text-destructive'
										size='icon-sm'
										onClick={(e) => {
											e.stopPropagation();
											deleteTask(index);
											toast.success('Задача успешно удалена');
										}}
										disabled={analyzeMultiRoutes.isPending}
									>
										<TrashIcon />
									</Button>
								</ItemActions>
							</Item>
						))}
						{tasks.length === 0 && (
							<p className='p-16 text-muted-foreground text-sm text-center'>
								Задачи отсутствуют. Добавьте новую задачу
							</p>
						)}
					</ul>
				</div>

				<DrawerFooter className='flex-row px-0'>
					<Button
						disabled={!hasTask()}
						className='bg-destructive'
						size='icon'
						onClick={useTasksStore.getState().clearOptimizedState}
					>
						<CircleX />
					</Button>

					<Button
						className='flex-1'
						disabled={!canSave() || analyzeMultiRoutes.isPending}
						onClick={() => analyzeMultiRoutes.mutate()}
					>
						Рассчитать
						{!!analyzeMultiRoutes.isPending && <Spinner />}
					</Button>

					{hasTask() && (
						<Button
							variant='outline'
							className='flex-1 border-lime-600 text-lime-600'
							disabled={analyzeMultiRoutes.isPending}
							onClick={handleDoneTask}
						>
							Завершить задачу
						</Button>
					)}
				</DrawerFooter>
			</div>
		</DrawerContent>
	);
};

export default DrawerMenu;

