import styles from './App.module.css';
import { MapView } from '@/components/widgets/MapView';
import { AppProviders } from './components/providers';
import { MapOverlay } from './components/widgets/MapOverlay';

function App() {
	return (
		<AppProviders>
			<div className={styles['container']}>
				<MapView>
					<MapOverlay />
				</MapView>
			</div>
		</AppProviders>
	);
}

export default App;

