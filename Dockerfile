# install openssl as runtime needs it too
FROM debian:bookworm-slim as base-core
RUN apt update -y
RUN apt install openssl -y


FROM base-core as base-deps
RUN apt install build-essential curl pkg-config openssl libssl-dev npm python3 nodejs brotli zstd gzip -y

RUN npm install -g pnpm

RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="$PATH:/root/.cargo/bin"


# build backend
FROM base-deps as backend

WORKDIR /backend
# skeleton cargo project
COPY backend/Cargo.toml backend/Cargo.lock /backend/
COPY backend/prisma-cli /backend/prisma-cli
COPY backend/prisma /backend/prisma
COPY backend/.cargo /backend/.cargo
RUN mkdir src && printf "#[allow(warnings, unused)]\nmod prisma;\nfn main() {}\n" > src/main.rs

# build backend skeleton
RUN cargo fetch
RUN cargo prisma generate
RUN cargo build --release --frozen

# build backend
RUN rm src/main.rs
COPY backend /backend/
RUN touch src/main.rs
RUN cargo build --release --frozen

# minimize size
RUN find /root/.cache/prisma/ -iname "*.tmp" -delete


# build frontend
FROM base-deps as frontend

# get frontend deps
WORKDIR /frontend
COPY frontend/pnpm-lock.yaml frontend/package.json /frontend/
RUN pnpm install --frozen-lockfile

# build frontend
COPY frontend /frontend
RUN pnpm build

# build from new base
FROM base-core

COPY --from=backend /root/.cache/prisma /root/.cache/prisma
COPY --from=backend /backend/prisma /blogdrown/backend/prisma
COPY --from=backend /backend/target/release/prisma-cli /backend/target/release/backend /blogdrown/backend/
COPY --from=frontend /frontend/dist /blogdrown/frontend/dist

WORKDIR /blogdrown/backend
CMD ./prisma-cli db push --skip-generate && ./backend
