# Real-Time Chat Application

This is a real-time chat application built using Next.js, Strapi, and Socket.io.

## Features
- User Registration and Login via Strapi Local Auth
- Real-time messaging using Socket.io
- Active user list per room
- Chat history preserved in Strapi SQLite database
- Simple, robust UI using Tailwind CSS

## Prerequisites
- Node.js (v18+)

## Setup Instructions

### 1. Backend (Strapi)
```bash
cd backend
npm install
npm run build
npm run develop
```
Note: Ensure you allow public access to `find` and `create` for the `Message` Content-Type in the Strapi admin panel under Settings -> Roles -> Public.

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## QA & Testing Addressed
- **Empty Inputs:** Handled in Auth and Chat inputs (prevents useless network calls).
- **Extremely Long Messages:** Blocked over 500 characters in frontend and on the socket server.
- **Race conditions/Spam:** Checked for empty strings and whitespace.
- **Unauthorized socket connections:** Evaluates `socket.handshake.auth.token` before granting room access.

Enjoy the chat app!

## Railway.app Deployment Guide

This project is prepared for deployment on [Railway.app](https://railway.app/). Because this is a mono-repo (both frontend and backend in one repository), you will create **two separate services** from the same GitHub repository in your Railway project.

### 1. Backend Service (Strapi)
1. In Railway, click **New -> GitHub Repo** and select this repository.
2. In the service settings, set the **Root Directory** to `/backend`.
3. Go to the **Variables** tab and add the following:
   - `NODE_ENV`: `production`
   - `APP_KEYS`: `generate-a-random-secret,generate-a-second-secret`
   - `API_TOKEN_SALT`: `generate-some-random-string`
   - `ADMIN_JWT_SECRET`: `generate-some-random-string`
   - `TRANSFER_TOKEN_SALT`: `generate-some-random-string`
   - `JWT_SECRET`: `generate-some-random-string`
   - `DATABASE_CLIENT`: `sqlite` (See note below if using Postgres)
   - `HOST`: `0.0.0.0`
4. Go to the **Settings** tab and configure a **Volume** mounted at `/app/.tmp`. This ensures your SQLite database (`data.db`) persists across deployments.
5. In **Settings -> Build**, you can leave defaults. (Railway automatically runs `npm install` and `npm run build`).

*(Optional: Postgres)*  
If you prefer a production-ready database, click **New -> Database -> Add PostgreSQL** in Railway. Then update your Backend service variables to:
- `DATABASE_CLIENT: postgres`
- `DATABASE_URL: \${{Postgres.DATABASE_URL}}`

### 2. Frontend Service (Next.js)
1. Add a second service from the same GitHub repo.
2. Under **Settings -> Root Directory**, enter `/frontend`.
3. Once the Backend service receives a Public Domain (e.g., `https://my-backend-production.up.railway.app`), copy it.
4. Go to the Frontend service's **Variables** tab and add:
   - `NEXT_PUBLIC_STRAPI_URL`: Your backend's public domain (no trailing slash).
5. Generate a Public Domain for the Frontend service.

Your application is now live!
- `DATABASE_CLIENT: postgres`
- `DATABASE_URL: ${{Postgres.DATABASE_URL}}`

### 2. Frontend Service (Next.js)
1. Add a second service from the same GitHub repo.
2. Under **Settings -> Root Directory**, enter `/frontend`.
3. Once the Backend service receives a Public Domain (e.g., `https://my-backend-production.up.railway.app`), copy it.
4. Go to the Frontend service's **Variables** tab and add:
   - `NEXT_PUBLIC_STRAPI_URL`: Your backend's public domain (no trailing slash).
5. Generate a Public Domain for the Frontend service.

Your application is now live!
