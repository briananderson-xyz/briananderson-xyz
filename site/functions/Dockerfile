FROM node:22-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and compiled output
COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm run build

# Cloud Run provides PORT env var
ENV PORT=8080

CMD ["node", "lib/server.js"]
