FROM node:20-alpine
WORKDIR /app
COPY apps/frontend/package*.json ./
RUN npm ci
COPY apps/frontend ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
