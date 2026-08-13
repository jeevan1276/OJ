Compiler microservice sandboxing

This directory runs a compiler microservice which compiles and executes untrusted user code.

Sandboxing model
- The service spawns a disposable container per submission using the local Docker daemon.
- The container image to run submissions is `oj-runner:latest` by default; build it from `runner.Dockerfile`.
- The service requires access to the Docker CLI and Docker daemon (`/var/run/docker.sock`) or an alternative container API. See SECURITY below.

How it works
1. The service writes the submission source (and optional input) to a unique host temp directory.
2. It calls `docker run --rm --network none --memory <MB> --cpus <value> --pids-limit <n> --cap-drop=ALL --security-opt=no-new-privileges --read-only --tmpfs /tmp:size=16m --tmpfs /workspace:size=32m -v <hostdir>:/submission:ro -u 1000 oj-runner:latest /bin/sh -c "compile-and-run"`.
3. The service enforces a hard wall-clock timeout on the `docker run` call (env `SANDBOX_TIMEOUT_MS`).
4. After container exit the service collects stdout/stderr/exit code and removes the host temp directory.

Environment variables
- `SANDBOX_MEMORY_MB` (default: 256)
- `SANDBOX_CPU_LIMIT` (default: 0.5)
- `SANDBOX_PIDS_LIMIT` (default: 64)
- `SANDBOX_TIMEOUT_MS` (default: 25000)
- `SANDBOX_USER_UID` (default: 1000)
- `SANDBOX_RUNNER_IMAGE` (default: oj-runner:latest)
- `SANDBOX_SECCOMP_PROFILE` (optional) — path on the host to a seccomp profile; if set it is passed to `--security-opt seccomp=...`.

Building the runner image
From the `Compiler` directory:

```bash
docker build -f runner.Dockerfile -t oj-runner:latest .
```

Running the compiler service
The Compiler container needs Docker CLI and access to the Docker daemon. A common (insecure) method is to mount `/var/run/docker.sock` into the container:

```bash
docker run -v /var/run/docker.sock:/var/run/docker.sock -p 8000:8000 your-compiler-image
```

Security notes
- Mounting `/var/run/docker.sock` into a container grants effectively root-equivalent control over the host. If the compiler service is compromised, the attacker can escalate to the Docker daemon and control host resources and containers.
- Recommended production approaches:
  - Use rootless Docker or a dedicated sandboxing service (e.g., a runner VM, gVisor, Kata Containers, or Firecracker) instead of mounting the raw socket.
  - Run a restricted proxy that exposes a minimal API for starting containers rather than the full Docker socket.
  - Use an orchestration approach to run one-off runner VMs/containers per job with strong isolation.

Integration tests
See `manual_test.js` for a simple integration script that hits the `/compile` endpoint with several test cases (normal, infinite loop, fork-bomb attempt, file read, outbound network). Run the compiler service locally and then run the script with Node.js.
