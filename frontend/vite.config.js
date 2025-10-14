import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const apiUrl =
    env.VITE_API_URL && /^https?:\/\//i.test(env.VITE_API_URL)
      ? env.VITE_API_URL
      : undefined;

  const derivedOrigin = apiUrl ? new URL(apiUrl).origin : undefined;

  const proxyTarget =
    env.VITE_BACKEND_PROXY_TARGET ||
    env.VITE_BACKEND_ORIGIN ||
    derivedOrigin ||
    "http://localhost:8000";

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true
        },
        "/static": {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
