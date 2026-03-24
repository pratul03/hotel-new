# Agentic Development README --- Airbnb Replica

This document describes how an AI Agent should plan, build, and track
the development of a full Airbnb-like platform.

## Agent Workflow

1.  Plan
2.  Confirm Plan
3.  Create Strategy
4.  Execute Tasks
5.  Summarize Work
6.  Maintain Task Records

All logs must be saved inside:

agent-logs/

## Technology Stack

Frontend - Next.js - TypeScript - TailwindCSS - shadcn/ui - React
Query - Zustand

Backend - Node.js - Express - TypeScript - Prisma ORM v7 - PostgreSQL

Storage - MinIO (S3 compatible object storage) - Docker

Payments - Razorpay

Caching / Concurrency - Redis (recommended)

## Core Features

-   Geo‑location hotel search
-   Map based discovery
-   Room availability calendar
-   High concurrency booking system
-   Split‑second booking confirmation
-   Razorpay payment integration
-   Booking timers
-   Check‑in / check‑out management
-   Room cleaning status
-   Image blob storage via MinIO

## Repository Structure

airbnb-clone/

apps/ web/ \# Next.js frontend api/ \# Express backend

packages/ ui/ types/ config/

services/ booking-engine/ search-engine/ payment-service/

infra/ docker/ minio/ postgres/

agent-logs/ plans.md strategies.md tasks.md summaries.md

## Planning Phase

The agent must first design:

-   System architecture
-   API structure
-   Database schema
-   Concurrency handling
-   Booking consistency model
-   Image storage flow

Save output to:

agent-logs/plans.md

Then request confirmation before coding.

## Booking Concurrency Strategy

Goal: Prevent double booking.

Approach:

Redis Lock → DB Transaction → Booking Record

## Image Storage

MinIO buckets:

room-images hotel-images user-avatars

Upload flow:

Client → API → Signed URL → MinIO

Database stores only object keys and URLs.

## Payment Flow

Client → Create Order → Razorpay Checkout Webhook → Verify Payment →
Confirm Booking

## Timers

Track:

-   booking expiration
-   check-in time
-   check-out time
-   cleaning window

Use Redis TTL or job workers.

## Task Tracking

agent-logs/tasks.md

Example:

  Task             Status        Notes
  ---------------- ------------- -----------------
  DB schema        Done          Prisma models
  MinIO setup      Done          Buckets created
  Booking engine   In progress   Redis locks

## Deployment

Frontend: Vercel Backend: Docker Database: Managed PostgreSQL Storage:
MinIO cluster

## Agent Rules

-   Never skip planning
-   Confirm plan before coding
-   Track every task
-   Produce summaries

Final output must include:

frontend/ backend/ infra/ agent-logs/ documentation/
