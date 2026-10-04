FROM ubuntu:22.04 AS builder

WORKDIR /src

RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential ca-certificates cmake git && \
    rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 https://github.com/ggml-org/whisper.cpp.git .

RUN cmake -B build \
    -DCMAKE_BUILD_TYPE=Release \
    -DGGML_NATIVE=OFF \
    -DBUILD_SHARED_LIBS=OFF \
    -DWHISPER_BUILD_EXAMPLES=ON \
    -DWHISPER_BUILD_TESTS=OFF \
    -DWHISPER_BUILD_SERVER=OFF && \
    cmake --build build --target whisper-cli -j"$(nproc)"

FROM ubuntu:22.04

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl ffmpeg libgomp1 libstdc++6 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /src/build/bin/whisper-cli /usr/local/bin/whisper-cli

ENTRYPOINT ["bash", "-c"]
