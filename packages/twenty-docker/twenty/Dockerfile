# Base image for common dependencies
FROM node:22-alpine as common-deps

WORKDIR /app

# Copy only the necessary files for dependency resolution
COPY ./package.json ./yarn.lock ./.yarnrc.yml ./tsconfig.base.json ./nx.json /app/
COPY ./.yarn/releases /app/.yarn/releases

COPY ./.prettierrc /app/
COPY ./packages/twenty-emails/package.json /app/packages/twenty-emails/
COPY ./packages/twenty-server/package.json /app/packages/twenty-server/
COPY ./packages/twenty-server/patches /app/packages/twenty-server/patches
COPY ./packages/twenty-ui/package.json /app/packages/twenty-ui/
COPY ./packages/twenty-shared/package.json /app/packages/twenty-shared/
COPY ./packages/twenty-front/package.json /app/packages/twenty-front/

# HVAC Modules - "Pasja rodzi profesjonalizm"
COPY ./packages/hvac-core/package.json /app/packages/hvac-core/
COPY ./packages/hvac-dashboard/package.json /app/packages/hvac-dashboard/
COPY ./packages/hvac-analytics/package.json /app/packages/hvac-analytics/
COPY ./packages/hvac-equipment/package.json /app/packages/hvac-equipment/
COPY ./packages/twenty-hvac-server/package.json /app/packages/twenty-hvac-server/

# Install all dependencies
RUN yarn && yarn cache clean && npx nx reset


# Build the back
FROM common-deps as twenty-server-build

# Copy sourcecode after installing dependences to accelerate subsequents builds
COPY ./packages/twenty-emails /app/packages/twenty-emails
COPY ./packages/twenty-shared /app/packages/twenty-shared
COPY ./packages/twenty-server /app/packages/twenty-server

# HVAC Server Module - "Pasja rodzi profesjonalizm"
COPY ./packages/twenty-hvac-server /app/packages/twenty-hvac-server

RUN npx nx run twenty-server:build
RUN mv /app/packages/twenty-server/dist /app/packages/twenty-server/build
RUN npx nx run twenty-server:build:packageJson
RUN mv /app/packages/twenty-server/dist/package.json /app/packages/twenty-server/package.json
RUN rm -rf /app/packages/twenty-server/dist
RUN mv /app/packages/twenty-server/build /app/packages/twenty-server/dist

RUN yarn workspaces focus --production twenty-emails twenty-shared twenty-server twenty-hvac-server hvac-core hvac-dashboard hvac-analytics hvac-equipment


# Build the front
FROM common-deps as twenty-front-build

ARG REACT_APP_SERVER_BASE_URL

COPY ./packages/twenty-front /app/packages/twenty-front
COPY ./packages/twenty-ui /app/packages/twenty-ui
COPY ./packages/twenty-shared /app/packages/twenty-shared

# HVAC Frontend Modules - "Pasja rodzi profesjonalizm"
COPY ./packages/hvac-core /app/packages/hvac-core
COPY ./packages/hvac-dashboard /app/packages/hvac-dashboard
COPY ./packages/hvac-analytics /app/packages/hvac-analytics
COPY ./packages/hvac-equipment /app/packages/hvac-equipment
RUN npx nx build twenty-front


# Final stage: Run the application
FROM node:22-alpine as twenty

# Used to run healthcheck in docker
RUN apk add --no-cache curl jq

RUN npm install -g tsx

RUN apk add --no-cache postgresql-client

COPY ./packages/twenty-docker/twenty/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
WORKDIR /app/packages/twenty-server

ARG REACT_APP_SERVER_BASE_URL
ENV REACT_APP_SERVER_BASE_URL $REACT_APP_SERVER_BASE_URL

ARG APP_VERSION
ENV APP_VERSION $APP_VERSION

# Copy built applications from previous stages
COPY --chown=1000 --from=twenty-server-build /app /app
COPY --chown=1000 --from=twenty-server-build /app/packages/twenty-server /app/packages/twenty-server
COPY --chown=1000 --from=twenty-front-build /app/packages/twenty-front/build /app/packages/twenty-server/dist/front

# Set metadata and labels
LABEL org.opencontainers.image.source=https://github.com/twentyhq/twenty
LABEL org.opencontainers.image.description="This image provides a consistent and reproducible environment for the backend and frontend, ensuring it deploys faster and runs the same way regardless of the deployment environment."

RUN mkdir -p /app/.local-storage /app/packages/twenty-server/.local-storage && \
    chown -R 1000:1000 /app

# Use non root user with uid 1000
USER 1000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
# Note: Adjust the port and /health endpoint if different for the main twenty-server.
# Common alternatives: /api/health, /status, or a specific port if not 3000.

EXPOSE 3000

CMD ["node", "dist/src/main"]
ENTRYPOINT ["/app/entrypoint.sh"]
