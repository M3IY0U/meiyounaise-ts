# Build runner
FROM node:lts-alpine as base

# Install canvas dependencies and clean up
RUN apk add --no-cache \
  sudo \
  curl \
  build-base \
  g++ \
  libpng \
  libpng-dev \
  jpeg-dev \
  pango-dev \
  cairo-dev \
  giflib-dev \
  python3 \
  && rm -rf /var/cache/apk/*

# Install pnpm
RUN npm install -g pnpm

WORKDIR /tmp/app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml tsconfig.json  ./

# Install dependencies using pnpm
RUN pnpm install

# Move source files
COPY src ./src
COPY prisma ./prisma

# Build project
RUN pnpm run build

# Production runner
FROM base as prod-runner

WORKDIR /app

# Copy package.json, pnpm-lock.yaml, and generated files from base
COPY --from=base /tmp/app/package.json /app/package.json
COPY --from=base /tmp/app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=base /tmp/app/build /app/build
COPY --from=base /tmp/app/prisma /app/prisma

# Generate Prisma Client
RUN pnpm install --prod

# Start bot
ENTRYPOINT ["/bin/sh", "-c", "pnpm prisma db push && pnpm run start"]
