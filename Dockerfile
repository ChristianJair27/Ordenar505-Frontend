# ---- Build (Vite) ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Si usas variables en build: todas deben ser VITE_*
RUN npm run build

# ---- Runtime (Nginx) ----
FROM nginx:alpine
# SPA fallback: servimos index.html para rutas de React Router
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Archivos estáticos generados por Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
