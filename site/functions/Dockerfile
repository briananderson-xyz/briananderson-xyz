FROM node:22-slim

WORKDIR /app

# Install pnpm — pinned to v9 to match CI (pnpm/action-setup version: 9).
# Unpinned `npm install -g pnpm` pulls the latest major (v10), which under
# CI=true fatally errors on unapproved dependency build scripts (protobufjs).
RUN npm install -g pnpm@9

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
