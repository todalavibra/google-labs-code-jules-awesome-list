# Stage 1: Build the Vue.js application
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine as production-stage

# Copy built assets from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx config
# Create a default Nginx configuration if one isn't provided.
# For a typical Vue app, you need to ensure Nginx directs all routes to index.html.
# Create iot-frontend/nginx.conf with the following content:
# server {
#    listen 80;
#    server_name localhost;
#    location / {
#        root /usr/share/nginx/html;
#        index index.html;
#        try_files $uri $uri/ /index.html; # Important for SPA routing
#    }
#    # Optional: Add a proxy for API requests if you want Nginx to handle that
#    # location /api/ {
#    #    proxy_pass http://iot-backend:3000/; # Assuming backend service is named iot-backend
#    #    proxy_set_header Host $host;
#    #    proxy_set_header X-Real-IP $remote_addr;
#    #    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#    # }
# }
# Then, copy this file into the image:
COPY nginx.conf /etc/nginx/conf.d/default.conf
# If not creating nginx.conf, the default Nginx config will be used, which might work for basic cases
# but won't support SPA routing properly without try_files.

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
