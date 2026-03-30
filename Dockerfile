# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Final stage
FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=builder /app/dist .
EXPOSE 3000
ENTRYPOINT ["bun", "run", "index.html"]
