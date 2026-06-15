# ============================================================
#  Smart Finance SaaS — NestJS backend production image
#  multi-stage: builder (compile) → runner (slim runtime)
# ============================================================

# ---- Stage 1: builder ----
FROM node:20-slim AS builder
WORKDIR /app

# prisma engine ต้องใช้ openssl
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# install deps (รวม dev สำหรับ build) — cache layer จาก lockfile
COPY package*.json ./
RUN npm ci

# generate prisma client ก่อน copy source ทั้งหมด (cache)
COPY prisma ./prisma
RUN npx prisma generate

# build NestJS → dist
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: runner ----
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# ติดตั้ง deps ครบก่อน (ต้องมี prisma CLI + ts-node สำหรับ migrate deploy / seed
# ตอน runtime แบบ offline) — ยังไม่ตั้ง NODE_ENV=production จะได้ไม่ถูก omit dev
COPY package*.json ./
RUN npm ci && npm cache clean --force

# prisma schema/migrations + regenerate client ให้ตรง platform runner
COPY prisma ./prisma
RUN npx prisma generate

# artifact ที่ build แล้ว + tsconfig (seed ใช้ ts-node อ้าง tsconfig)
COPY --from=builder /app/dist ./dist
COPY tsconfig*.json ./

# ตั้ง production env หลังติดตั้ง deps เสร็จแล้ว
ENV NODE_ENV=production
EXPOSE 8000

# migrate deploy (idempotent) แล้วค่อย start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
