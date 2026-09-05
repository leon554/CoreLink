# CoreLink Architecture & Deployment

CoreLink is a full-stack MERN web application containerised with Docker and deployed to
AWS using ECS on Fargate, behind an Application Load Balancer.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), served as static files via nginx |
| Backend | Node.js, Express, JWT auth (access + refresh tokens), bcrypt |
| Database | MongoDB Atlas |
| Containerization | Docker, multi-stage builds |
| Orchestration | AWS ECS (Fargate launch type) |
| Image registry | Amazon ECR |
| Secrets | AWS Secrets Manager |
| Networking | Application Load Balancer, path-based routing |

## Architecture

```
                         ┌─────────────────────┐
                         │   User's Browser    │
                         └──────────┬──────────┘
                                    │ HTTP
                                    ▼
                    ┌───────────────────────────────┐
                    │   Application Load Balancer   │
                    │        (corelink-alb)         │
                    │   Listener: HTTP :80          │
                    └───────────────┬───────────────┘
                                    │
              ┌─────────────────────┴────────────┐
              │ Path: /auth/*, /api/*            │ Default (everything else)
              ▼                                  ▼
    ┌──────────────────────┐           ┌───────────────────┐
    │  Backend service     │           │  Frontend service │
    │  ECS Fargate task    │           │  ECS Fargate task │
    │  Express, port 8080  │           │  nginx, port 80   │
    └─────────┬────────────┘           └───────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │  MongoDB Atlas       │
    │  (external, managed) │
    └──────────────────────┘
```

Both services pull their images from **ECR** and read runtime configuration from
**AWS Secrets Manager** via the ECS task execution role. Security groups restrict
inbound traffic so that only the ALB can reach the ECS tasks, neither service is
directly exposed to the public internet.

## AWS resources

- **ECR repositories:** `corelink-backend`, `corelink-frontend`
- **Secrets Manager secret:** `corelink_backend-secrets` (`MONGO_URI`,
  `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`)
- **IAM role:** `ecsTaskExecutionRole` `AmazonECSTaskExecutionRolePolicy` +
  an inline policy granting `secretsmanager:GetSecretValue` scoped to the
  CoreLink secret
- **Security groups:**
  - `corelink-alb-sg` allows inbound HTTP (80) from `0.0.0.0/0`
  - `corelink-frontend-sg` allows inbound HTTP (80) from `corelink-alb-sg` only
  - `corelink-backend-sg` allows inbound TCP (8080) from `corelink-alb-sg` only
- **ECS cluster:** `corelink-cluster` (Fargate)
- **Task definitions:** `corelink-backend` (0.5 vCPU / 1GB), `corelink-frontend`
  (0.25 vCPU / 0.5GB)
- **Target groups:** `corelink-backend-tg` (port 8080, health check `/health`),
  `corelink-frontend-tg` (port 80, health check `/`)
- **ALB:** `corelink-alb`, internet-facing, one HTTP:80 listener with a
  path-based rule forwarding `/auth/*` and `/api/*` to the backend target
  group, default action forwarding everything else to the frontend


## Notable issues hit during setup (and fixes)

- **`CannotPullContainerError: image Manifest does not contain descriptor
  matching platform 'linux/amd64'`** — caused by building on Apple Silicon
  without specifying `--platform linux/amd64`. Fixed by using
  `docker buildx build --platform linux/amd64`.
- **`VITE_*` environment variables must be supplied at build time** (as a
  Docker `--build-arg`), not at container runtime — Vite bakes them into the
  static bundle during `npm run build`, so setting them under `environment:`
  in ECS/Compose has no effect on the frontend.
