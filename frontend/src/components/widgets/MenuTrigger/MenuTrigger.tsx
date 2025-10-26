import styles from './MenuTrigger.module.css';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DrawerTrigger } from '@/components/ui/drawer';
import { useTasksStore } from '@/stores/tasks';
import { useMemo } from 'react';

const MenuTrigger = () => {
	const totalDistance = useTasksStore((state) => state.totalDistance);
	const totalDuration = useTasksStore((state) => state.totalDuration);

	const durationInHoursAndMinutes = useMemo(() => {
		if (totalDuration == null) return null;

		const hours = Math.floor(totalDuration / 60);
		const minutes = Math.floor(totalDuration % 60);

		return `${hours} ч ${minutes} мин`;
	}, [totalDuration]);

	return (
		<Card className={styles['container']}>
			<CardContent className='flex-1 px-4 min-h-0'>
				<div className={styles['content']}>
					<ul className={styles['tasks-info']}>
						<li className={styles['info-item']}>
							<span className={styles['info-value']}>{totalDistance ? `${totalDistance} км` : '- -'}</span>
							<span className={styles['info-key']}>Расстояние</span>
						</li>

						<li className={styles['info-item']}>
							<span className={styles['info-value']}>{durationInHoursAndMinutes ?? '- -'}</span>
							<span className={styles['info-key']}>Время</span>
						</li>
					</ul>

					<Separator orientation='vertical' className='min-h-9' />

					<DrawerTrigger asChild>
						<Button size='lg' className='text-md'>
							Меню
						</Button>
					</DrawerTrigger>
				</div>
			</CardContent>
		</Card>
	);
};

export default MenuTrigger;

