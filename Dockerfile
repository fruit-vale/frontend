# ---------- Stage 1: dependências ----------
FROM node:24-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---------- Stage 2: build ----------
FROM node:24-slim AS builder
WORKDIR /app

# Variáveis VITE_* são embutidas no bundle em tempo de build
ARG VITE_API_URL
ARG VITE_MQTT_HOST
ARG VITE_GOOGLE_MAPS_KEY
ARG VITE_WHATSAPP_NUMERO
ARG VITE_CONTROLADOR_NOME
ARG VITE_CONTROLADOR_CNPJ
ARG VITE_CONTATO_PRIVACIDADE

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Stage 3: runtime (nginx) ----------
FROM nginx:1.27-alpine AS runner

# Configuração do nginx com fallback para o React Router (SPA)
RUN printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  gzip on;' \
  '  gzip_types text/css application/javascript application/json image/svg+xml;' \
  '  location /assets/ {' \
  '    expires 1y;' \
  '    add_header Cache-Control "public, immutable";' \
  '  }' \
  '  location / {' \
  '    try_files $uri $uri/ /index.html;' \
  '    add_header Cache-Control "no-cache";' \
  '  }' \
  '}' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
