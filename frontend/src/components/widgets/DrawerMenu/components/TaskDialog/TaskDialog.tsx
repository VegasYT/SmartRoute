import { useLayoutEffect, useState, type FC } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import type { ITaskDialogFormData, ITaskDialogProps } from './TaskDialog.types';

import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ButtonGroup } from '@/components/ui/button-group';
import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { getCoordsByAddressHelper } from '@/lib/services/geocoderHelpers';
import { useTasksStore } from '@/stores/tasks';
import type { ITask } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner';

const INITIAL_FORM_DATA: ITaskDialogFormData = {
	name: '',
	address: '',
	level: 'standard',
	workStart: '09:00',
	workEnd: '18:00',
	lunchStart: '13:00',
	lunchEnd: '14:00',
};

const addTask = useTasksStore.getState().addTask;
const editTask = useTasksStore.getState().editTask;

const TaskDialog: FC<ITaskDialogProps> = ({ setIsOpen, taskIndex, setTaskIndex }) => {
	const tasks = useTasksStore((state) => state.tasks);
	const [formData, setFormData] = useState<ITaskDialogFormData>(INITIAL_FORM_DATA);

	const handleSubmitForm = () => getCoordsByAddress.mutate();

	const getCoordsByAddress = useMutation({
		mutationKey: ['get-coords-by-address'],
		mutationFn: () => getCoordsByAddressHelper(formData.address),
		onSuccess: (coords) => {
			if (!coords) {
				toast.warning('Не удалось получить координаты по указанному адресу.');
				return;
			}

			const taskData: ITask = {
				...formData,
				uid: uuidv4(),
				coords,
			};

			if (taskIndex) editTask(taskIndex, taskData);
			else addTask(taskData);

			toast.success('Задача успешно сохранена.');

			setIsOpen(false);
			if (taskIndex !== null) setTaskIndex(null);
			setFormData(INITIAL_FORM_DATA);
		},
	});

	const isFormValid = () => {
		const { name, address, level, workStart, workEnd, lunchStart, lunchEnd } = formData;

		const workStartDate = new Date('1970-01-01T' + workStart + ':00Z').getTime();
		const workEndDate = new Date('1970-01-01T' + workEnd + ':00Z').getTime();
		const lunchStartDate = new Date('1970-01-01T' + lunchStart + ':00Z').getTime();
		const lunchEndDate = new Date('1970-01-01T' + lunchEnd + ':00Z').getTime();

		return !!(
			name &&
			address &&
			level &&
			workStart &&
			workEnd &&
			lunchStart &&
			lunchEnd &&
			workStartDate < workEndDate &&
			lunchStartDate < lunchEndDate &&
			workStartDate < lunchStartDate &&
			workEndDate > lunchEndDate
		);
	};

	useLayoutEffect(() => {
		if (taskIndex !== null) {
			const taskToEdit = tasks[taskIndex];
			if (taskToEdit) {
				setFormData({
					name: taskToEdit.name,
					address: taskToEdit.address,
					level: taskToEdit.level,
					workStart: taskToEdit.workStart,
					workEnd: taskToEdit.workEnd,
					lunchStart: taskToEdit.lunchStart,
					lunchEnd: taskToEdit.lunchEnd,
				});
			}
		} else {
			setFormData(INITIAL_FORM_DATA);
		}
	}, [taskIndex, tasks]);

	return (
		<DialogContent>
			<DialogHeader className='items-start'>
				<DialogTitle>{taskIndex === null ? 'Новая задача' : 'Изменить задачу'}</DialogTitle>
				<DialogDescription>
					{taskIndex === null ? 'Создайте новую задачу за день' : 'Вы можете отредактировать выбранную задачу'}
				</DialogDescription>
			</DialogHeader>

			<div className='flex flex-col items-stretch gap-4'>
				<div className='flex flex-col gap-1'>
					<Label htmlFor='name-field'>Название задачи</Label>
					<Input
						id='name-field'
						name='name'
						type='text'
						placeholder='Встреча с клиентом'
						value={formData.name}
						onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
					/>
				</div>

				<div className='flex flex-col gap-1'>
					<Label htmlFor='address-field'>Адрес встречи</Label>
					<Input
						id='address-field'
						name='address'
						type='text'
						placeholder='Например: пр. Соколова, 62'
						className={`${getCoordsByAddress.data === null ? 'border-destructive' : ''}`}
						value={formData.address}
						onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
					/>
				</div>

				<div className='flex flex-col gap-1'>
					<Label htmlFor='level-field'>Уровень клиента</Label>
					<Tabs
						id='level-field'
						value={formData.level}
						onValueChange={(level) => setFormData((prev) => ({ ...prev, level: level as 'standard' | 'vip' }))}
					>
						<TabsList className='flex w-full'>
							<TabsTrigger value='standard'>Стандарт</TabsTrigger>
							<TabsTrigger value='vip'>VIP</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				<div className='flex flex-col gap-1'>
					<Label htmlFor='work-field'>Рабочее время</Label>
					<ButtonGroup id='work-field' className='w-full'>
						<Input
							id='work-start-field'
							name='workStart'
							type='time'
							value={formData.workStart}
							onChange={(e) => setFormData((prev) => ({ ...prev, workStart: e.target.value }))}
						/>
						<Input
							id='work-end-field'
							name='workEnd'
							type='time'
							value={formData.workEnd}
							onChange={(e) => setFormData((prev) => ({ ...prev, workEnd: e.target.value }))}
						/>
					</ButtonGroup>
				</div>

				<div className='flex flex-col gap-1'>
					<Label htmlFor='lunch-field'>Обеденное время</Label>
					<ButtonGroup id='lunch-field' className='w-full'>
						<Input
							id='lunch-start-field'
							name='lunchStart'
							type='time'
							value={formData.lunchStart}
							onChange={(e) => setFormData((prev) => ({ ...prev, lunchStart: e.target.value }))}
						/>
						<Input
							id='lunch-end-field'
							name='lunchEnd'
							type='time'
							value={formData.lunchEnd}
							onChange={(e) => setFormData((prev) => ({ ...prev, lunchEnd: e.target.value }))}
						/>
					</ButtonGroup>
				</div>
			</div>

			<DialogFooter>
				<Button onClick={handleSubmitForm} disabled={!isFormValid() || getCoordsByAddress.isPending}>
					Сохранить
					{getCoordsByAddress.isPending && <Spinner />}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
};

export default TaskDialog;

