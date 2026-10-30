FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PLAYWRIGHT_BROWSERS_PATH=/data/browsers
RUN npx playwright install-deps chromium
EXPOSE 3000
CMD ["sh","-c","node node_modules/playwright/cli.js install chromium && node node_modules/next/dist/bin/next start --hostname 0.0.0.0"]
