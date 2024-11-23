FROM debian:bookworm-slim
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
RUN mkdir src && echo "fn main() {}" > src/main.rs

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

# run command
WORKDIR /blogdrown/backend
CMD cargo prisma db push && ./target/release/backend
