import type { ICoordinates } from '@/lib/types';

export interface IMapsStore {
	userPosition: ICoordinates | null;
	setUserPosition: (coords: ICoordinates) => void;
	userAddress: string | null;
	setUserAddress: (address: string) => void;
}

