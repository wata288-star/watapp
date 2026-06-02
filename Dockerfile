# node:sqlite を使うため Node 22 以上が必須
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# DB(SQLite) は /app/data に作成される。永続化するにはボリュームをマウントすること:
#   docker run -v flyheit-data:/app/data ...
VOLUME ["/app/data"]

CMD ["npm", "start"]
