# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app/client

# 프론트 전용 패키지 설치(캐시 최적화)
COPY client/package*.json ./
RUN npm ci

# 프론트 소스 복사 후 빌드
COPY client/ ./
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# 빌드 산출물 복사 (client/dist → nginx 문서 루트)
COPY --from=build /app/client/dist /usr/share/nginx/html

# Nginx 설정 (선택)
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
