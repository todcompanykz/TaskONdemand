FROM node:20-alpine AS builder

WORKDIR /app

# 👇 добавили инструменты сборки
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


FROM node:20-alpine

WORKDIR /app

# 👇 снова нужны, потому что bcrypt ставится тут
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/src/main"]