# ---- Build (Vite) ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
# Debug: imprime el name que está viendo el contenedor
RUN node -e "console.log('package name ->', require('./package.json').name)"

RUN if [ -f package-lock.json ]; then npm ci --no-audit; else npm install --no-audit; fi

COPY . .
RUN npm run build

# ---- Runtime (Nginx) ----
FROM nginx:alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
