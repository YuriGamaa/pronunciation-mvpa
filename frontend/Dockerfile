FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json pnpm-lock.yaml* ./
RUN   if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile;   else npm ci; fi

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN   if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm build;   else npm run build; fi

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]
