# FairWork Database Schema

## Overview
The FairWork platform uses PostgreSQL for data persistence. This document outlines the core tables and relationships.

## Core Tables

### users
- id (UUID, primary key)
- email (string, unique)
- password_hash (string)
- role (enum: 'homeowner', 'pro')
- first_name (string)
- last_name (string)
- phone (string)
- address (JSONB)
- created_at (timestamp)
- updated_at (timestamp)

### pros
- user_id (UUID, foreign key to users.id, primary key)
- business_name (string)
- license_number (string)
- certificate_of_insurance (string - file path)
- business_registration (string - file path)
- verified (boolean)
- rating (numeric)
- completed_jobs (integer)

### homeowners
- user_id (UUID, foreign key to users.id, primary key)
- preferred_services (jsonb)
- created_at (timestamp)

### services
- id (UUID, primary key)
- name (string, unique)
- description (text)
- category (string)
- estimated_duration (integer - minutes)
- created_at (timestamp)

### jobs
- id (UUID, primary key)
- homeowner_id (UUID, foreign key to homeowners.user_id)
- service_id (UUID, foreign key to services.id)
- title (string)
- description (text)
- budget_min (numeric)
- budget_max (numeric)
- location (jsonb)
- status (enum: 'open', 'in_progress', 'completed', 'cancelled')
- created_at (timestamp)
- updated_at (timestamp)

### quotes
- id (UUID, primary key)
- job_id (UUID, foreign key to jobs.id)
- pro_id (UUID, foreign key to pros.user_id)
- amount (numeric)
- description (text)
- submitted_at (timestamp)

### reviews
- id (UUID, primary key)
- job_id (UUID, foreign key to jobs.id)
- reviewer_id (UUID, foreign key to users.id)
- reviewee_id (UUID, foreign key to users.id)
- rating (integer)
- comment (text)
- created_at (timestamp)