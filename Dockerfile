# Сборка фронтенда
FROM node:18 AS build

WORKDIR /app

COPY client/package*.json ./

RUN npm install

COPY client .

RUN npm run build

# Используем nginx для сервировки
FROM nginx:stable-alpine

# Копируем собранные файлы в nginx
COPY --from=build /app/build /usr/share/nginx/html

# Копируем кастомный конфиг nginx (если нужно)
# COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
