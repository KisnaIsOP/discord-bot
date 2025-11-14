FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Try `npm ci` (faster, reproducible) and fall back to `npm install`
# if a lockfile isn't present or `npm ci` fails in the build environment.
RUN npm ci --only=production || npm install --only=production

COPY . .

CMD ["npm", "start"]
