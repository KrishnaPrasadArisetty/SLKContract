# Use a working Node.js version
FROM node:21.0.0

# Set the working directory (FIXED)

# Update package lists, install required packages, and clean up
RUN apt-get update \
    && apt-get install -y libnghttp2-14 libde265-0 \
    && apt-get clean

# Copy package.json and package-lock.json first
WORKDIR /server.ts
COPY package.json /package.json

# Install dependencies
RUN npm install

RUN npm install --save esm
COPY . /server.ts
# Copy the rest of the application code
#COPY . .

# Install TypeScript globally
#RUN npm install -g typescript

# Compile TypeScript to JavaScript
#RUN npx tsc

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
