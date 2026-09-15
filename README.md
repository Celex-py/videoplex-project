# Videoplex

A multi-channel video platform: Express + Prisma + Mux backend, with a
frontend client (`web/App.jsx`) that talks to it directly.

## Structure

```
videoplex/
├── api/                  Express + Prisma + Mux backend
│   ├── src/
│   │   ├── index.ts          server entry point
│   │   ├── lib/prisma.ts     shared Prisma client
│   │   ├── middleware/auth.ts
│   │   ├── routes/           auth, channels, videos, playlists, live, admin, webhooks
│   │   └── api-client.ts     typed fetch client (reference for building your own frontend)
│   ├── prisma/schema.prisma
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example       copy to .env and fill in real values
└── web/
    └── App.jsx            React app that talks to the live API
```

## 1. Push this to GitHub

```bash
cd videoplex
git init
git add .
git commit -m "Initial commit: Videoplex backend + frontend"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 2. Run the backend

```bash
cd api
npm install
cp .env.example .env
# fill in DATABASE_URL, JWT_SECRET, MUX_ACCESS_TOKEN, MUX_SECRET_KEY
npx prisma migrate dev --name init
npm run dev
```

Server runs on `http://localhost:4000` by default.

## 3. Deploy the backend so it's publicly reachable

The frontend runs in a browser and needs a **public** API URL — `localhost`
won't work unless you're testing on the same machine. Options:

- **Render / Railway / Fly.io** — connect your GitHub repo, set the same env
  vars from `.env.example` in their dashboard, deploy.
- **ngrok** (for quick local testing) — `ngrok http 4000`, then use the
  `https://*.ngrok-free.app` URL it gives you.

Whichever you use, set `FRONTEND_URL` in the backend's env to the exact
origin your frontend runs from, so CORS allows the requests.

## 4. Set up Mux webhooks

In the [Mux dashboard](https://dashboard.mux.com) → Settings → Webhooks, add:

```
https://<your-deployed-api>/api/webhooks/mux
```

Copy the signing secret into `MUX_WEBHOOK_SECRET` in your `.env`.

## 5. Point the frontend at your API

Open `web/App.jsx` (or wherever you're running it) and enter your deployed
API URL in the connection screen when prompted.
