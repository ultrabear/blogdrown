FROM debian:bookworm-slim as build
RUN apt update -y
RUN apt install build-essential curl npm python3 nodejs brotli zstd gzip pkg-config tree -y

RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
RUN echo 'source /root/.cargo/env' >> /root/.bashrc
ENV PATH="$PATH:/root/.cargo/bin"

RUN npm install -g pnpm

WORKDIR /blogdrown/backend
# skeleton cargo project
COPY backend/Cargo.toml backend/Cargo.lock /blogdrown/backend/
COPY backend/prisma-cli /blogdrown/backend/prisma-cli
COPY backend/prisma /blogdrown/backend/prisma
COPY backend/.cargo /blogdrown/backend/.cargo
RUN mkdir src && printf "#[allow(warnings, unused)]\nmod prisma;\nfn main() {}\n" > src/main.rs

# build backend skeleton
RUN cargo fetch
RUN cargo prisma generate
RUN cargo build --release --frozen

# get frontend deps
WORKDIR /blogdrown/frontend
COPY frontend/pnpm-lock.yaml frontend/package.json /blogdrown/frontend/
RUN pnpm install --frozen-lockfile
WORKDIR /blogdrown/backend

# build backend
RUN rm src/main.rs
COPY backend /blogdrown/backend/
RUN touch src/main.rs
RUN cargo build --release --frozen

# build frontend
WORKDIR /blogdrown/frontend
COPY frontend /blogdrown/frontend
RUN pnpm build

# minimize size
WORKDIR /blogdrown/backend
RUN cp ./target/release/prisma-cli ./prisma-cli-bin && cp ./target/release/backend ./blogdrown-bin && rm ./target -r
RUN strip prisma-cli-bin && strip blogdrown-bin
RUN find /root/.cache/prisma/ -iname "*.tmp" -delete

# build from new base
FROM debian:bookworm-slim

RUN apt update -y
RUN apt install openssl -y

COPY --from=build /blogdrown/backend/prisma-cli-bin /blogdrown/backend/blogdrown-bin /blogdrown/backend/
COPY --from=build /blogdrown/backend/prisma /blogdrown/backend/prisma
COPY --from=build /blogdrown/frontend/dist /blogdrown/frontend/dist
COPY --from=build /root/.cache/prisma /root/.cache/prisma

WORKDIR /blogdrown/backend
CMD ./prisma-cli-bin db push --skip-generate && ./blogdrown-bin
