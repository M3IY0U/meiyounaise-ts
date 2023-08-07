## build runner
FROM node:lts-alpine as build-runner

# Set temp directory
WORKDIR /tmp/app

# Install canvas dependencies
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
  ;

# Move package.json
COPY package.json .

# Install dependencies
RUN npm install

# Move source files
COPY src ./src
COPY prisma ./prisma
COPY tsconfig.json   .

# Generate Prisma Client
RUN npm install -g prisma
RUN prisma generate

# Build project
RUN npm run build

## production runner
FROM node:lts-alpine as prod-runner

# Set work directory
WORKDIR /app

# Install canvas dependencies
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
  ;

# Copy package.json from build-runner
COPY --from=build-runner /tmp/app/package.json /app/package.json

# Install dependencies
RUN npm install --omit=dev

# Move build files
COPY --from=build-runner /tmp/app/build /app/build
COPY --from=build-runner /tmp/app/prisma /app/prisma

RUN npm install -g prisma
RUN prisma generate

# Start bot
CMD [ "npm", "run", "start" ]

