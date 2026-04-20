FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --production

COPY backend/src ./src

ENV PORT=3001
ENV GLM_API_KEY=eb5e8a54aeff453dba9d501f67356eeb.dIZcHbDwfETJxqM7
ENV GLM_BASE_URL=https://open.bigmodel.cn/api/anthropic

EXPOSE 3001

CMD ["node", "src/index.js"]
