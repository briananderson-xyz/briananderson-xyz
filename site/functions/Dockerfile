# Node 22.23.1 slim multi-platform index, resolved from Docker Hub on 2026-07-09.
ARG NODE_IMAGE=node:22.23.1-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf

FROM ${NODE_IMAGE} AS build

WORKDIR /app

# Match the lockfile-generating pnpm release; pnpm never enters the runtime image.
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm run build && pnpm prune --prod

FROM ${NODE_IMAGE} AS runtime

ENV NODE_ENV=production \
	PORT=8080
WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/lib ./lib

USER node

CMD ["node", "lib/server.js"]
