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

WORKDIR /tmp/app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Move source files
COPY src ./src
COPY prisma ./prisma
COPY tsconfig.json .

# Generate Prisma Client
RUN npm install -g prisma && prisma generate

# Build project
RUN npm run build

# Production runner
FROM base as prod-runner

WORKDIR /app

# Copy package.json and installed dependencies from build-runner
COPY --from=base /tmp/app/package.json /app/package.json
COPY --from=base /tmp/app/node_modules /app/node_modules

# Move build files and Prisma setup
COPY --from=base /tmp/app/build /app/build
COPY --from=base /tmp/app/prisma /app/prisma

# Start bot
CMD [ "npm", "run", "start" ]
