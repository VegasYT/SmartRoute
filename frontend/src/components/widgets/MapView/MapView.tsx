import { useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Map, Placemark, TrafficControl, ZoomControl } from '@pbe/react-yandex-maps';
import styles from './MapView.module.css';

import { useYandexMultiRoute } from '@/lib/hooks/useYandexMultiRoute';
import { useMapsStore } from '@/stores/maps';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useTasksStore } from '@/stores/tasks';
import { toast } from 'sonner';

const DEFAULT_COORDS = [47.228877, 39.720034];
const setUserPosition = useMapsStore.getState().setUserPosition;

const MapView = ({ children }: PropsWithChildren) => {
	const mapRef = useRef<ymaps.Map | null>(null);
	const [ymapsApi, setYmapsApi] = useState<typeof window.ymaps | null>(null);

	const tasks = useTasksStore((state) => state.tasks);
	const userPosition = useMapsStore((state) => state.userPosition);

	const tasksCoords = useMemo(() => tasks.map((task) => task.coords), [tasks]);
	const multiRouteData = useMemo(() => {
		if (userPosition === null) return tasksCoords;
		return [userPosition, ...tasksCoords];
	}, [tasksCoords, userPosition]);

	useGeolocation({
		onSuccess: (coords) => {
			if (userPosition === null) {
				console.log(coords);
				setUserPosition(coords);
			}
		},
		onError: (error) => {
			if (error === 'refused') {
				toast.warning('Для корректной работы приложение рекомендуем дать доступ к Вашей геолокации');
			}
		},
	});

	useYandexMultiRoute(ymapsApi, mapRef.current, multiRouteData, {
		routingMode: 'auto',
		avoidTrafficJams: true,
		boundsAutoApply: true,
		alternatives: 1,
	});

	return (
		<>
			<Map
				instanceRef={(ref) => {
					mapRef.current = ref;
				}}
				onLoad={(ym) => setYmapsApi(ym)}
				state={{
					center: userPosition ? [userPosition.lat, userPosition.lon] : DEFAULT_COORDS,
					zoom: 14,
				}}
				modules={[
					'multiRouter.MultiRoute',
					'geoObject.addon.hint',
					'geoObject.addon.balloon',
					'control.ZoomControl',
					'control.TrafficControl',
				]}
				className={styles['maps']}
			>
				{/* @ts-expect-error Сломанная типизация */}
				<TrafficControl defaultState={{ trafficShown: true }} options={{ float: 'right' }} />
				<ZoomControl options={{ position: { right: 8, bottom: window.innerHeight / 2.5 } }} />
				{!!userPosition && (
					<Placemark geometry={[userPosition.lat, userPosition.lon]} options={{ preset: 'islands#redPocketIcon' }} />
				)}
			</Map>
			{children}
		</>
	);
};

export default MapView;

