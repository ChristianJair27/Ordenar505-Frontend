# ---- Build (Vite) ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copia sólo lo necesario para resolver deps
COPY package.json package-lock.json ./
# Si NO tienes package-lock.json en el repo, cambia a:
# COPY package.json ./
# RUN npm install --no-audit
RUN npm ci --no-audit

# Copia el resto del código
COPY . .

# Si usas variables de build en Vite, deben empezar con VITE_
# (ej: --build-arg VITE_API_URL=...)
RUN npm run build

# ---- Runtime (Nginx) ----
FROM nginx:alpine
ENV NODE_ENV=production

# SPA fallback: React Router → siempre devolver index.html
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Archivos estáticos de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]  