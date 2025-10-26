import { useAutoAnimate } from '@formkit/auto-animate/react';
import styles from './DrawerMenu.module.css';

import { DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { Button } from '@/components/ui/button';

import { TrashIcon } from 'lucide-react';
import { UserAddress } from './components/UserAddress';
import { ListActions } from './components/ListActions';
import { useTasksStore } from '@/stores/tasks';
import { toast } from 'sonner';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { analyzeMultiRoutesHelper } from '@/lib/services/analyzeMultiRoutesHelper';
import { useMapsStore } from '@/stores/maps';
import { Spinner } from '@/components/ui/spinner';

const deleteTask = useTasksStore.getState().deleteTask;
const sortTasksByOptimized = useTasksStore.getState().sortTasksByOptimized;
const setTotalProperties = useTasksStore.getState().setTotalProperties;

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
				clients: tasks.map((task, index) => ({
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
		setChosenTaskIndex(index);
		setIsTaskDialogOpen(true);
	};

	const canSave = () => !!(userAddress !== null && userPosition && startDay !== null && startTime !== null);

	return (
		<DrawerContent className='items-center min-h-0'>
			<div className={styles['content']}>
				<DrawerHeader>
					<DrawerTitle>Задачи на день</DrawerTitle>
					<DrawerDescription>Смотрите, добавляйте, выполняйте ваши задачи по встречам в течении дня</DrawerDescription>
				</DrawerHeader>

				<UserAddress />

				<div className={styles['body']}>
					<ListActions
						taskIndex={chosenTaskIndex}
						setTaskIndex={setChosenTaskIndex}
						isTaskDialogOpen={isTaskDialogOpen}
						setIsTaskDialogOpen={setIsTaskDialogOpen}
					/>

					<ul ref={animatedRef} className={styles['task-list']}>
						{tasks.map((task, index) => (
							<Item key={task.uid} onClick={() => handleTaskClick(index)} variant='outline'>
								<ItemContent>
									<ItemTitle>
										{index + 1}. {task.name}
									</ItemTitle>
									<ItemDescription>{task.address}</ItemDescription>
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
					<Button className='flex-1 bg-destructive' disabled>
						Сбросить
					</Button>
					<Button
						className='flex-1'
						disabled={!canSave() || analyzeMultiRoutes.isPending}
						onClick={() => analyzeMultiRoutes.mutate()}
					>
						Сохранить
						{analyzeMultiRoutes.isPending && <Spinner />}
					</Button>
				</DrawerFooter>
			</div>
		</DrawerContent>
	);
};

export default DrawerMenu;

