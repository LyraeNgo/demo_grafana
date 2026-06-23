# Frontend

Basic React frontend for the HTTPS FastAPI CRUD API.

## Run locally

```bash
cd Frontend
npm install
npm run dev
```

## Configure API

Create a `.env` file for local development:

```bash
VITE_API_BASE_URL=/api
```

The local Vite dev server proxies `/api` to `https://chaters.shop`, so browser calls stay same-origin during development.

In production, the app is served from `https://fe.chaters.shop` and the frontend Nginx proxies `/api` to the backend container over the Docker network.
