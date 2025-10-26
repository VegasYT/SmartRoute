import styles from './ErrorInfo.module.css';
import type { GeolocationError } from '@/lib/types';
import { BanIcon } from 'lucide-react';

const ErrorInfo = ({ geolocationError }: { geolocationError: GeolocationError }) => {
	return (
		<div className={styles['error']}>
			<BanIcon className='text-destructive' width={64} height={64} />
			<p>
				{geolocationError === 'unsupported' &&
					'Ошибка определения геолокации. Ваш браузер не поддерживает это разрешение. Пожалуйста, поменяйте или обновите браузер и повторите попытку.'}
				{geolocationError === 'refused' &&
					'Вы отклонили разрешение на получение Вашей геопозиции. Для корректной работы приложения, пожалуйста, подтвердите запрос на отслеживание геолокации.'}
			</p>
		</div>
	);
};

export default ErrorInfo;

