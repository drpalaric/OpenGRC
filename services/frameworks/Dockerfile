FROM node:20-alpine

WORKDIR /app

# Copy package file
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY tsconfig.json ./
COPY nest-cli.json ./

# Build
RUN npm run build

EXPOSE 3002

CMD ["npm", "run", "start:prod"]
