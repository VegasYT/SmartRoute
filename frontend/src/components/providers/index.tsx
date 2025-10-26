import { type PropsWithChildren } from 'react';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { YaMapsProvider } from './YaMapsProvider';

const queryClient = new QueryClient();

export const AppProviders = ({ children }: PropsWithChildren) => {
	return (
		<QueryClientProvider client={queryClient}>
			<YaMapsProvider>
				{children}
				<Toaster position='top-center' />
			</YaMapsProvider>
		</QueryClientProvider>
	);
};

