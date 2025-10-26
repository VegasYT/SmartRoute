import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from "@tailwindcss/vite"
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
		extensions: ['.js', '.ts', '.tsx'],
	},
	server: {
		port: 3000, // Порт для разработки
		host: '0.0.0.0', // если нужен внешний доступ
		allowedHosts: true // Разрешить доступ с других хостов (для работы в Docker или на сервере)
	},
})
