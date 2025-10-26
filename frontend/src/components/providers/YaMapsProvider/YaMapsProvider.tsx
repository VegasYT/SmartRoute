import { type PropsWithChildren } from 'react';
import { YMaps } from '@pbe/react-yandex-maps';
import { YANDEX_MAPS_API_KEY } from '@/lib/constants/environments';

const YaMapsProvider = ({ children }: PropsWithChildren) => {
	return (
		<YMaps
			preload
			query={{
				lang: 'ru_RU',
				apikey: YANDEX_MAPS_API_KEY,
			}}
		>
			{children}
		</YMaps>
	);
};

export default YaMapsProvider;

