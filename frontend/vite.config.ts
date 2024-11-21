import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
//@ts-expect-error no typestubs
import eslint from "vite-plugin-eslint";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [
		react(),
		eslint({
			lintOnStart: true,
			failOnError: mode === "production",
		}),
	],
	server: { proxy: { "/api": "http://127.0.0.1:5000" } },
}));
