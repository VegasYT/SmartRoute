import { useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Map, Placemark, TrafficControl, ZoomControl } from '@pbe/react-yandex-maps';
import styles from './MapView.module.css';

import { Spinner } from '@/components/ui/spinner';
import { ErrorInfo } from './components/ErrorInfo';

import type { ICoordinates } from '@/lib/types';
import { useYandexMultiRoute } from '@/lib/hooks/useYandexMultiRoute';
import { useMapsStore } from '@/stores/maps';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useTasksStore } from '@/stores/tasks';

const setUserPosition = useMapsStore.getState().setUserPosition;

const MapView = ({ children }: PropsWithChildren) => {
	const mapRef = useRef<ymaps.Map | null>(null);
	const [ymapsApi, setYmapsApi] = useState<typeof window.ymaps | null>(null);

	const tasks = useTasksStore((state) => state.tasks);
	const userPosition = useMapsStore((state) => state.userPosition);
	const [defaultUserPosition, setDefaultUserPosition] = useState<ICoordinates | null>(null);

	const tasksCoords = useMemo(() => tasks.map((task) => task.coords), [tasks]);
	const multiRouteData = useMemo(() => {
		if (userPosition === null) return tasksCoords;
		return [userPosition, ...tasksCoords];
	}, [tasksCoords, userPosition]);

	const { error: geolocationError } = useGeolocation({
		onSuccess: (coords) => {
			if (!defaultUserPosition) setDefaultUserPosition(coords);
			if (userPosition === null) {
				console.log(coords);
				setUserPosition(coords);
			}
		},
	});

	useYandexMultiRoute(ymapsApi, mapRef.current, multiRouteData, {
		routingMode: 'auto',
		avoidTrafficJams: true,
		boundsAutoApply: true,
		alternatives: 1,
	});

	if (!defaultUserPosition && !geolocationError)
		return (
			<div className={styles['info-container']}>
				<Spinner className='size-16' />
			</div>
		);

	if (geolocationError)
		return (
			<div className={styles['info-container']}>
				<ErrorInfo geolocationError={geolocationError} />
			</div>
		);

	return (
		<>
			<Map
				instanceRef={(ref) => {
					mapRef.current = ref;
				}}
				onLoad={(ym) => setYmapsApi(ym)}
				defaultState={{ center: [defaultUserPosition!.lat, defaultUserPosition!.lon], zoom: 14 }}
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
				<Placemark geometry={[userPosition!.lat, userPosition!.lon]} options={{ preset: 'islands#redPocketIcon' }} />
			</Map>
			{children}
		</>
	);
};

export default MapView;

