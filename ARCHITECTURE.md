# FairWork — System Architecture & Stack

## Tech Stack
- **Frontend (`./web`, port 3000):** Next.js (App Router), TypeScript, Tailwind CSS.
- **Backend (`./api`, port 8000):** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pytest.
- **Database (`db`, port 5432):** PostgreSQL 16 (`fairwork` database).
- **Object Storage (`minio`, ports 9000/9001):** MinIO S3-compatible bucket `fairwork-docs` for Pro COI & ID uploads.

## Core Database Entities & Invariants
1. **Users & Roles:** `HOMEOWNER`, `PRO`, `ADMIN`.
2. **Denton County Geo-Fence:** Homeowner job creation must validate that `zip_code` belongs to Denton County, TX (e.g., 76201, 76205, 76207, 76208, 76209, 76210, 75067, 75077, 75022, 75028, 75068, 76226, 76247, 76262).
3. **Pro Verification Gate:** Pros cannot submit a `Bid` unless `pro_profiles.verification_status == 'VERIFIED'` (requires uploaded COI + business registration or government ID).
4. **Zero Lead Fees:** Submitting a `Bid` is free; platform fee is recorded only when a `Job` transitions to `COMPLETED`.
5. **Merit-Based Ranking:** Public Pro listings sort strictly by `merit_score` computed from `completed_jobs_count`, `avg_rating`, and completion reliability.
6. **Verified Reviews Only:** `POST /jobs/{id}/reviews` succeeds only if `job.status == 'COMPLETED'` and no prior review exists for that `job_id`.
