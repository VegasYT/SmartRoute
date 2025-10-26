import { useEffect, useMemo, useRef, useState } from 'react';

export type YCoords = { lat: number; lon: number };

export type UseYandexMultiRouteOptions = {
	routingMode?: 'auto' | 'pedestrian' | 'masstransit';
	avoidTrafficJams?: boolean;
	boundsAutoApply?: boolean;
	alternatives?: number; // кол-во альтернативных маршрутов
};

export type MultiRouteTotals = {
	distance?: { text: string; value: number }; // метры
	duration?: { text: string; value: number }; // секунды (базовые)
};

export type MultiRouteLeg = {
	index: number;
	distanceM?: number;
	durationS?: number; // без пробок
	durationInTrafficS?: number; // с пробками (для auto)
};

export type UseYandexMultiRouteReturn = {
	totals: MultiRouteTotals | null;
	legs: MultiRouteLeg[];
	loading: boolean;
	error: string | null;
	/** Ссылка на созданный мультимаршрут (может пригодиться для кастомизации стилей) */
	route: ymaps.multiRouter.MultiRoute | null;
};

/**
 * Строит мультимаршрут в уже созданной карте.
 * Требует, чтобы модули были загружены (передайте ymaps из onLoad, а карту — из instanceRef).
 */
export function useYandexMultiRoute(
	//@ts-expect-error ругается на UMD global в module
	ymapsApi: typeof ymaps | null,
	map: ymaps.Map | null,
	points: YCoords[],
	{
		routingMode = 'auto',
		avoidTrafficJams = true,
		boundsAutoApply = true,
		alternatives = 1,
	}: UseYandexMultiRouteOptions = {}
): UseYandexMultiRouteReturn {
	const routeRef = useRef<ymaps.multiRouter.MultiRoute | null>(null);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [totals, setTotals] = useState<MultiRouteTotals | null>(null);
	const [legs, setLegs] = useState<MultiRouteLeg[]>([]);

	// Нормализуем входные координаты в формат Яндекс.Карт
	const referencePoints = useMemo(() => points?.map((p) => [p.lat, p.lon]) ?? [], [points]);

	useEffect(() => {
		const ym = ymapsApi;
		if (!ym || !map) return;

		// Нужны минимум 2 точки
		if (!referencePoints || referencePoints.length < 2) {
			// Чистим, если что-то было
			if (routeRef.current) {
				map.geoObjects.remove(routeRef.current);
				routeRef.current = null;
			}
			setTotals(null);
			setLegs([]);
			setLoading(false);
			setError(null);
			return;
		}

		// Удаляем старый маршрут перед созданием нового
		if (routeRef.current) {
			map.geoObjects.remove(routeRef.current);
			routeRef.current = null;
		}

		setLoading(true);
		setError(null);
		setTotals(null);
		setLegs([]);

		const multiRoute = new ym.multiRouter.MultiRoute(
			{
				referencePoints,
				params: {
					routingMode,
					avoidTrafficJams,
					results: Math.max(1, alternatives),
				},
			},
			{
				boundsAutoApply,
			}
		);

		// Успех
		multiRoute.model.events.add('requestsuccess', () => {
			const active = multiRoute.getActiveRoute();
			if (!active) {
				setLoading(false);
				setError('Нет активного маршрута');
				return;
			}

			const distance = active.properties.get('distance', { text: null, value: null }) as MultiRouteTotals['distance'];
			const duration = active.properties.get('duration', { text: null, value: null }) as MultiRouteTotals['duration'];
			setTotals({ distance, duration });

			const legList: MultiRouteLeg[] = [];

			//@ts-expect-error expect
			active.getPaths().each((path: any, idx: number) => {
				const m = path.getModel().getJson?.() ?? {};
				legList.push({
					index: idx,
					distanceM: m?.distance?.value,
					durationS: m?.duration?.value,
					durationInTrafficS: m?.durationInTraffic?.value,
				});
			});
			setLegs(legList);
			setLoading(false);
		});

		// Ошибка
		multiRoute.model.events.add('requestfail', (e: any) => {
			setLoading(false);
			setError('Не удалось построить маршрут');
			console.warn('[multiRoute] requestfail', e);
		});

		map.geoObjects.add(multiRoute);
		routeRef.current = multiRoute;

		return () => {
			if (routeRef.current) {
				map.geoObjects.remove(routeRef.current);
				routeRef.current = null;
			}
		};
	}, [ymapsApi, map, referencePoints, routingMode, avoidTrafficJams, boundsAutoApply, alternatives]);

	return {
		totals,
		legs,
		loading,
		error,
		route: routeRef.current,
	};
}

