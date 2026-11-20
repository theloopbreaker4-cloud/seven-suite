# Seven Suite API runtime image.
#
# The bundle is built outside the image (`nx run api:prune` → dist/apps/api: main.js plus a
# pruned package.json/pnpm-lock with only what the API needs), so the image holds Node 22,
# production dependencies, the Prisma CLI and migrations — no sources, no dev tooling.
#
#   pnpm exec nx run api:prune
#   docker build -f docker/api.Dockerfile -t seven-suite-api .
#   docker run --rm --env-file .env.prod seven-suite-api pnpm exec prisma migrate deploy
#   docker run -d --env-file .env.prod -p 127.0.0.1:4010:4010 seven-suite-api

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    API_PORT=4010
RUN corepack enable && corepack prepare pnpm@12.15.0 --activate

# Dependencies first so they are cached between releases.
COPY dist/apps/api/package.json dist/apps/api/pnpm-lock.yaml dist/apps/api/pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile && pnpm exec prisma --version > /dev/null

COPY dist/apps/api/main.js dist/apps/api/main.js.map ./
COPY prisma ./prisma
COPY prisma.config.ts ./

USER node
EXPOSE 4010
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||4010)+'/api/v1/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--enable-source-maps", "main.js"]
