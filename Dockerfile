# Builds the site and serves it with Caddy. Used by Railway (see railway.json);
# Vercel ignores this file.

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .

# Vite bakes VITE_* values into the JavaScript at build time. Railway passes a
# service variable to the build only when it is declared here, so every variable
# the app reads is listed. Unset ones fall back to the defaults in src/config.js.
ARG VITE_DEBUG
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_MAINTENANCE_MODE
ARG VITE_MAPBOX_TOKEN
ARG VITE_PHOTON_URL
ARG VITE_PAYSTACK_PUBLIC_KEY
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_DOJAH_PUBLIC_KEY
ARG VITE_DOJAH_DEALER_APP_ID
ARG VITE_DOJAH_DEALER_WIDGET_ID
ARG VITE_DOJAH_MECHANIC_APP_ID
ARG VITE_DOJAH_MECHANIC_WIDGET_ID
RUN npm run build

# ---- serve ----
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/build /srv
EXPOSE 8080
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
