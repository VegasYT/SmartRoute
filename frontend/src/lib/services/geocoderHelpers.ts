import axios from 'axios';
import { YANDEX_MAPS_API_KEY } from '../constants/environments';
import type { ICoordinates } from '../types';

export const getCoordsByAddressHelper = async (address: string) => {
	const apiUrl = `https://geocode-maps.yandex.ru/v1/?apikey=${YANDEX_MAPS_API_KEY}&geocode=${address}&results=1&kind=house&format=json`;

	const { data } = (await axios.get(apiUrl)) as any;

	const positionString = data?.response.GeoObjectCollection.featureMember[0]?.GeoObject.Point.pos as string;

	if (!positionString) return null;

	const coordsTuple = positionString.split(' ');
	const coords: ICoordinates = {
		lon: Number(coordsTuple[0]),
		lat: Number(coordsTuple[1]),
	};

	return coords;
};

export const getAddressByCoordsHelper = async (coords: ICoordinates) => {
	console.debug(coords);

	const apiUrl = `https://geocode-maps.yandex.ru/v1/?apikey=${YANDEX_MAPS_API_KEY}&geocode=${coords.lon} ${coords.lat}&results=1&kind=house&format=json`;

	const { data } = (await axios.get(apiUrl)) as any;

	const foundPosition = data?.response.GeoObjectCollection.featureMember[0]?.GeoObject.metaDataProperty.GeocoderMetaData
		.text as string | undefined;

	if (!foundPosition) return null;

	return foundPosition;
};

