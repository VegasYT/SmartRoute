import styles from './ListActions.module.css';
import { toast } from 'sonner';
import type { ChangeEvent, FC } from 'react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TaskDialog } from '../TaskDialog';

import { FileSpreadsheet } from 'lucide-react';

import { WEEKDAYS, type Weekday } from '@/lib/types';
import { useTasksStore } from '@/stores/tasks';

interface IListActionsProps {
	isLoading: boolean;
	taskIndex: number | null;
	setTaskIndex: React.Dispatch<React.SetStateAction<number | null>>;
	isTaskDialogOpen: boolean;
	setIsTaskDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const setChosenWeekday = useTasksStore.getState().setStartDay;
const setStartTime = useTasksStore.getState().setStartTime;
const addTasksFromCsv = useTasksStore.getState().addTasksFromCsv;

const ListActions: FC<IListActionsProps> = ({
	isLoading,
	taskIndex,
	setTaskIndex,
	isTaskDialogOpen,
	setIsTaskDialogOpen,
}) => {
	const startTime = useTasksStore((state) => state.startTime);
	const chosenWeekday = useTasksStore((state) => state.startDay);

	const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const stringifiedFile = await file.text();
		try {
			addTasksFromCsv(stringifiedFile);
		} catch (err: any) {
			console.error(err);
			toast.error('Ошибка при получении списка задач из CSV-файла');
		}
	};

	return (
		<div className={styles['list-actions']}>
			<Select value={chosenWeekday ?? undefined} onValueChange={(value) => setChosenWeekday(value as Weekday)}>
				<SelectTrigger>
					<SelectValue placeholder='День недели' />
				</SelectTrigger>
				<SelectContent>
					{Object.keys(WEEKDAYS).map((key, index) => (
						<SelectItem key={index} value={key}>
							{WEEKDAYS[key as Weekday]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Input
				type='time'
				placeholder='Время старта'
				value={startTime ?? ''}
				onChange={(e) => setStartTime(e.target.value)}
			/>

			<Button disabled={isLoading} className='relative' variant='secondary'>
				<FileSpreadsheet />
				<input
					type='file'
					accept='.csv,text/csv'
					className='z-10 absolute opacity-0 w-full h-full'
					onChange={handleFileUpload}
					disabled={isLoading}
				/>
			</Button>

			<Dialog open={isTaskDialogOpen} onOpenChange={() => setIsTaskDialogOpen((prev) => !prev)} modal>
				<DialogTrigger asChild>
					<Button type='button' className='relative border-primary text-primary' variant='outline' disabled={isLoading}>
						Добавить
					</Button>
				</DialogTrigger>

				<TaskDialog taskIndex={taskIndex} setTaskIndex={setTaskIndex} setIsOpen={setIsTaskDialogOpen} />
			</Dialog>
		</div>
	);
};

export default ListActions;

