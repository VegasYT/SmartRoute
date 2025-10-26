import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { Spinner } from '@/components/ui/spinner';
import {
	DialogHeader,
	DialogTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTrigger,
	DialogFooter,
} from '@/components/ui/dialog';

import { useMapsStore } from '@/stores/maps';
import { getAddressByCoordsHelper, getCoordsByAddressHelper } from '@/lib/services/geocoderHelpers';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

const setUserAddress = useMapsStore.getState().setUserAddress;
const setUserPosition = useMapsStore.getState().setUserPosition;

const UserAddress = () => {
	const [newAddress, setNewAddress] = useState('');
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const currentPosition = useMapsStore((state) => state.userPosition);
	const currentAddress = useMapsStore((state) => state.userAddress);

	const submitNewAddress = () => {
		getCoordsByAddress.mutate(newAddress);
	};

	const getCoordsByAddress = useMutation({
		mutationKey: ['get-coords-by-address'],
		mutationFn: (address: string) => getCoordsByAddressHelper(address),
		onSuccess: (coords) => {
			if (!coords) {
				toast.warning('Не найти позицию на карте по адресу пользователя');
				return;
			}
			setUserPosition(coords);
			setIsDialogOpen(false);
			setNewAddress('');
		},
		onError: (err) => {
			console.error(err);
			toast.error('Ошибка при получении позиции по адресу пользователя');
		},
	});

	const {
		data: foundAddress,
		error: errorAddressByCoords,
		isLoading: isLoadingAddress,
	} = useQuery({
		queryKey: ['get-address-by-coords', currentPosition],
		queryFn: () => currentPosition && getAddressByCoordsHelper(currentPosition),
	});

	useEffect(() => {
		if (foundAddress != null) {
			setUserAddress(foundAddress);
		}

		if (errorAddressByCoords !== null) {
			toast.error('Ошибка при получении текущего адреса пользователя');
		}
	}, [foundAddress, errorAddressByCoords]);

	return (
		<Dialog
			open={isDialogOpen}
			onOpenChange={() => {
				setIsDialogOpen((prev) => !prev);
				setNewAddress('');
			}}
			modal
		>
			<Item variant='muted'>
				<ItemContent>
					<ItemTitle>Ваш изначальный адрес:</ItemTitle>
					<ItemDescription>{currentAddress ?? 'Не задано'}</ItemDescription>
				</ItemContent>

				<ItemActions>
					<DialogTrigger asChild>
						<Button variant='outline' size='sm' disabled={isLoadingAddress}>
							Изменить
							{isLoadingAddress ? <Spinner /> : <MapPin />}
						</Button>
					</DialogTrigger>
				</ItemActions>
			</Item>

			<DialogContent>
				<DialogHeader className='flex-col items-start'>
					<DialogTitle>Новый адрес</DialogTitle>
					<DialogDescription className='text-start'>
						Убедитесь, что введённый Вами адрес правильный и без ошибок
					</DialogDescription>
				</DialogHeader>

				<div>
					<Input
						type='text'
						className={`${getCoordsByAddress.data === null ? 'border-destructive' : ''}`}
						placeholder='Например: пр. Соколова, 62'
						value={newAddress}
						onChange={(e) => setNewAddress(e.target.value)}
						disabled={getCoordsByAddress.isPending}
					/>
				</div>

				<DialogFooter>
					<Button disabled={getCoordsByAddress.isPending || !newAddress} onClick={submitNewAddress}>
						Сохранить
						{getCoordsByAddress.isPending && <Spinner />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default UserAddress;

