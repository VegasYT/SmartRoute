import { useEffect, useState } from 'react';
import type { GeolocationError, ICoordinates } from '../types';

interface IHookArgs {
	onSuccess?: (position: ICoordinates) => void;
	onError?: (error: GeolocationError) => void;
}

export const useGeolocation = (args?: IHookArgs) => {
	const [position, setPosition] = useState<ICoordinates | null>(null);
	const [error, setError] = useState<GeolocationError | null>(null);

	useEffect(() => {
		if (!navigator.geolocation) {
			setError('unsupported');
			args?.onError?.('unsupported');
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const coords = {
					lat: position.coords.latitude,
					lon: position.coords.longitude,
				};
				setPosition(coords);
				args?.onSuccess?.(coords);
			},
			(error) => {
				console.error('Ошибка определения геолокации пользователя:\n', error);
				setError('refused');
				args?.onError?.('refused');
			},
			{ enableHighAccuracy: true }
		);
	}, [JSON.stringify(args)]);

	return {
		position,
		error,
	};
};

