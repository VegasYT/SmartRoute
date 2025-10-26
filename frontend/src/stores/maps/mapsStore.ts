import { create } from 'zustand';
import type { IMapsStore } from './mapsStore.types';
import type { ICoordinates } from '@/lib/types';

const useMapsStore = create<IMapsStore>((set) => ({
	userPosition: localStorage.getItem('userPosition')
		? (JSON.parse(localStorage.getItem('userPosition')!) as unknown as ICoordinates)
		: null,
	setUserPosition: (coords) => {
		set({ userPosition: coords });
		localStorage.setItem('userPosition', JSON.stringify(coords));
	},
	userAddress: localStorage.getItem('userAddress'),
	setUserAddress: (address: string) => {
		set({ userAddress: address });
		localStorage.setItem('userAddress', address);
	},
}));

export default useMapsStore;

