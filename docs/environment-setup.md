# QA Environment Setup Report for NovaCart

## 1. Purpose

This document describes the QA environment setup for **NovaCart**. Its purpose is to provide a reproducible process for preparing the application, database, test tools, and initial QA assets required for baseline testing.

NovaCart is a FastAPI and PostgreSQL-based commerce demo with a React frontend served by the same application. The repository includes Alembic migrations, a Docker Compose file for PostgreSQL, and a main application entry point. :contentReference[oaicite:8]{index=8}

## 2. Repository Overview

The repository currently contains the following major components:

- `alembic`
- `app`
- `frontend`
- `.env.example`
- `README.md`
- `alembic.ini`
- `docker-compose.yml`
- `main.py`
- `requirements.txt` :contentReference[oaicite:9]{index=9}

These files are sufficient for setting up a local QA environment.

## 3. Local Setup Steps

The setup process follows the run instructions documented in the repository README. :contentReference[oaicite:10]{index=10}

### 3.1 Create and Activate Virtual Environment

```bash
python -m venv .venv
.venv\Scripts\activate