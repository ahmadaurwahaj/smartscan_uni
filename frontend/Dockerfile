# Use Node 24 LTS for the development environment
FROM node:24-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the default Angular dev server port
EXPOSE 4200

# Start the application using 'npm start' and bind to 0.0.0.0
# This allows access from outside the container
CMD ["npm", "start", "--", "--host", "0.0.0.0"]
