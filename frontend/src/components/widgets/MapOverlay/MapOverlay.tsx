import { MenuTrigger } from '../MenuTrigger';
import { DrawerMenu } from '../DrawerMenu';
import { Drawer } from '@/components/ui/drawer';

const MapOverlay = () => {
	return (
		<Drawer>
			<MenuTrigger />
			<DrawerMenu />
		</Drawer>
	);
};

export default MapOverlay;

