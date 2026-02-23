FROM node:18-slim
WORKDIR /app
RUN npm init -y && npm install express body-parser
COPY index.js .
EXPOSE 3000
CMD ["node", "index.js"]
