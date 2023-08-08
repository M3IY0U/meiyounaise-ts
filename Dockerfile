# Build runner
FROM node:lts-alpine as base

# Install canvas dependencies and clean up
RUN apk add --no-cache \
  build-base \
  g++ \
  cairo-dev \
  jpeg-dev \
  pango-dev \
  giflib-dev && \
  rm -rf /var/cache/apk/* && \
  npm install -g pnpm

WORKDIR /tmp/app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml tsconfig.json ./assets/Baloo2.ttf ./

# Install dependencies using pnpm
RUN pnpm install

# Move source files
COPY src ./src
COPY prisma ./prisma

RUN mkdir -p /usr/share/fonts/truetype/ && \
  install -m644 Baloo2.ttf /usr/share/fonts/truetype/ && \
  rm ./Baloo2.ttf 

# Build project
RUN pnpm build

# Production runner
FROM base as prod-runner

WORKDIR /app

# Copy package.json, pnpm-lock.yaml, and generated files from base
COPY --from=base /tmp/app/package.json /app/package.json
COPY --from=base /tmp/app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=base /tmp/app/build /app/build
COPY --from=base /tmp/app/prisma /app/prisma

# Generate Prisma Client
RUN pnpm install --prod && rm -rf /tmp/*

# Start bot
ENTRYPOINT ["/bin/sh", "-c", "pnpm prisma db push && pnpm start"]
