import axios from 'axios';
import { REST_API_URL } from '../constants/environments';
import type { IOptimizeRoute } from '../types';

interface IClients {
	address: string;
	latitude: number;
	longitude: number;
	level: 'standard' | 'vip';
	work_start: string;
	work_end: string;
	lunch_start: string;
	lunch_end: string;
	id: string;
}

export interface IAnalyzeMultiRoutesBody {
	clients: IClients[];
	start_point: {
		address: string;
		latitude: number;
		longitude: number;
	};
	start_time: string;
	start_day: string;
}

interface IAnalyzeMultiRoutesResponseData {
	success: boolean;
	message: string;
	data: {
		total_distance: number;
		total_duration: number;
		optimized_route: IOptimizeRoute[];
	};
}

export const analyzeMultiRoutesHelper = async (body: IAnalyzeMultiRoutesBody) => {
	const apiUrl = `${REST_API_URL}/api/routes/analyze`;
	const { data: responseData } = (await axios.post(apiUrl, body)) as any;

	if (!responseData.success) {
		throw new Error('Не удалось получить анализ мультимаршрута по задачам');
	}

	const { data } = responseData as IAnalyzeMultiRoutesResponseData;

	return data;
};

