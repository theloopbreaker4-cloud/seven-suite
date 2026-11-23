# Seven Suite — every app built from source, one stage per runtime image.
#
#   docker build -f docker/app.Dockerfile --target api   -t seven-suite-api .   # API + worker.js
#   docker build -f docker/app.Dockerfile --target web   -t seven-suite-web .   # Next.js storefront
#   docker build -f docker/app.Dockerfile --target admin -t seven-suite-admin . # Angular admin (nginx)
#
# `docker compose -f docker/compose.yml up --build` builds all three and runs the whole stack.
# (The VPS deploy builds the bundles locally and uses docker/api.Dockerfile — smaller upload.)

ARG NODE_IMAGE=node:22-slim

# ---------------------------------------------------------------- dependencies (cached layer)
FROM ${NODE_IMAGE} AS deps
# Prisma needs OpenSSL to pick its engine (node:*-slim ships without it).
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@12.15.0 --activate
# postinstall runs `prisma generate`, which needs the schema and its config.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------- build everything
FROM deps AS build
COPY . .
ENV NX_DAEMON=false \
    NX_NO_CLOUD=true \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT=standalone
ARG ADMIN_BASE_HREF=/
RUN pnpm exec nx run-many -t build -p api worker web --parallel=1 \
 && pnpm exec nx build admin --base-href="${ADMIN_BASE_HREF}" \
 && pnpm exec nx run api:prune \
 # Storefront: the standalone server does not include static assets — put them beside it.
 && cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static \
 && cp -r apps/web/public apps/web/.next/standalone/apps/web/public

# ---------------------------------------------------------------- API production dependencies
# Installed here (pnpm is already set up) and copied over, so the runtime image needs no pnpm.
FROM build AS api-deps
RUN cd dist/apps/api && pnpm install --prod --frozen-lockfile && ./node_modules/.bin/prisma --version > /dev/null

# ---------------------------------------------------------------- API (+ worker)
FROM ${NODE_IMAGE} AS api
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production API_PORT=4000 API_HOST=0.0.0.0
ENV PATH=/app/node_modules/.bin:$PATH
COPY --from=api-deps /repo/dist/apps/api/package.json ./
COPY --from=api-deps /repo/dist/apps/api/node_modules ./node_modules
COPY --from=build /repo/dist/apps/api/main.js /repo/dist/apps/api/main.js.map ./
COPY --from=build /repo/dist/apps/worker/main.js ./worker.js
COPY --from=build /repo/dist/apps/worker/main.js.map ./worker.js.map
COPY --from=build /repo/prisma ./prisma
COPY --from=build /repo/prisma.config.ts ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/api/v1/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--enable-source-maps", "main.js"]

# ---------------------------------------------------------------- storefront
FROM ${NODE_IMAGE} AS web
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]

# ---------------------------------------------------------------- admin (static SPA + /api proxy)
FROM nginx:1.29-alpine AS admin
COPY docker/nginx/admin.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/dist/apps/admin/browser /usr/share/nginx/html
ENV API_UPSTREAM=http://api:4000
EXPOSE 8080
