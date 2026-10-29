# Build from the repository root. Dockerfile.dockerignore is an explicit allowlist.
FROM node:22-bookworm-slim AS dependencies
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/catalogue/package.json packages/catalogue/package.json
RUN pnpm install --frozen-lockfile --filter @skilved/web...
COPY packages/types/src packages/types/src
COPY packages/types/tsconfig.contracts.json packages/types/tsconfig.contracts.json
COPY packages/catalogue/src packages/catalogue/src
COPY deployment/catalogue-staging/runtime deployment/catalogue-staging/runtime
RUN pnpm --filter @skilved/types build:contracts

FROM dependencies AS worker-build
RUN pnpm --filter @skilved/catalogue deploy --prod /worker

FROM dependencies AS web-build
COPY apps/web/src apps/web/src
COPY apps/web/public apps/web/public
COPY apps/web/next.config.js apps/web/tsconfig.json apps/web/next-env.d.ts apps/web/postcss.config.js apps/web/tailwind.config.ts apps/web/eslint.config.mjs apps/web/
# Runtime flags are read by dynamic routes; building never initializes a cloud database.
RUN SKILVED_CATALOGUE_MODE=disabled SKILVED_AI_MODE=disabled NEXT_TELEMETRY_DISABLED=1 pnpm --filter @skilved/web build

FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils util-linux && rm -rf /var/lib/apt/lists/*

FROM runtime AS worker
ENV NODE_ENV=production
WORKDIR /workspace
COPY --from=worker-build --chown=node:node /worker /workspace/packages/catalogue
COPY --from=dependencies --chown=node:node /workspace/deployment/catalogue-staging/runtime /workspace/deployment/catalogue-staging/runtime
USER node
ENTRYPOINT ["node", "deployment/catalogue-staging/runtime/worker.mjs"]

FROM runtime AS web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080
WORKDIR /workspace
COPY --from=web-build --chown=node:node /workspace /workspace
USER node
EXPOSE 8080
ENTRYPOINT ["node", "deployment/catalogue-staging/runtime/web.mjs"]
