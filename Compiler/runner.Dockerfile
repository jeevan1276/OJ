FROM debian:stable-slim

ENV DEBIAN_FRONTEND=noninteractive

# Minimal runtime containing only compilers and Java. No developer tooling.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
     ca-certificates \
     openjdk-17-jdk-headless \
     gcc \
     g++ \
     build-essential \
     coreutils \
  && rm -rf /var/lib/apt/lists/*

# Create a non-root user with UID 1000
RUN groupadd -g 1000 runner || true \
  && useradd -m -u 1000 -g 1000 runner || true

WORKDIR /workspace

# Run as non-root by default
USER 1000

ENTRYPOINT ["/bin/sh", "-c"]
