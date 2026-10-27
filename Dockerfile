FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

COPY --chown=node:node package.json server.js index.html dot-matrix.js master-scope-animation.js ./
COPY --chown=node:node fonts/ ./fonts/
COPY --chown=node:node packs/ ./packs/
COPY --chown=node:node presets/ ./presets/

USER node

EXPOSE 3000

CMD ["npm", "start"]
