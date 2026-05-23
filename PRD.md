# Charge Circle — Real-Time Multiplayer Turn Board Game

## Project Overview

A real-time multiplayer collaborative grid game where up to **1,000 operators** connect simultaneously, take turns moving a shared **Energy Orb** across a 10×10 board, and cooperate to reach the **Charging Circle** target to score.

- **Single Control:** Only one user can move the piece at a time.
- **Turn Rotation:** After a user moves, they rotate to the back of the FIFO queue.
- **Live Sync:** WebSocket-powered real-time updates for all connected players.
- **Goal:** Guide the Energy Orb to the pulsing Charging Circle to charge the grid (+1 score per charge).

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js + HTML Canvas + Tailwind CSS + Framer Motion | UI rendering, game board, real-time client, landing page animations |
| Backend | Node.js + Express + Socket.io | WebSocket server, game logic, queue management |
| Database | PostgreSQL + Prisma ORM | Type-safe DB access, migrations, persistent storage |
| Containerization | Docker + docker-compose | One-command setup, reproducible environments |
| CI/CD | GitHub Actions | Automated testing, linting, type-checking |
| Testing | Vitest (frontend) + Jest/Supertest (backend) | Unit + integration tests |

---

## Features (MVP + Planned Enhancements)

### ✅ MVP (Implemented)
- 10×10 Canvas grid with cyberpunk neon aesthetic
- Single shared Energy Orb with smooth movement animation
- FIFO turn queue with counter system
- Charging Circle target with pulsing glow effect
- Score tracking (GW charged)
- Move validation (adjacent tiles only, board bounds, turn check)
- Reconnection with 8-second grace period before queue removal
- Hover highlighting (cyan for valid moves, red for invalid)
- Responsive UI with Queue Panel and Personal Console

### 🚀 Enhancement Roadmap

#### 1. High-Quality Landing Page (Framer Motion)
A polished, conversion-focused landing page that lives at `/` and sells the experience before users sign up.

**Design & Visuals:**
- **Hero section** — full-viewport with a canvas-rendered animated Energy Orb in the background, particle grid overlay, and a punchy headline (e.g. *"Cooperate. Charge. Win."*). CTA button pulses with a subtle glow to draw the eye.
- **Animated feature cards** — staggered entrance via Framer Motion `useInView` and `staggerChildren`. Each card explains a core mechanic (Turn Queue, Live Sync, Scoring) with hover micro-interactions (scale, glow, border highlight).
- **Live demo preview** — embedded status bar that fetches `/api/status` from the backend and displays real-time stats: *"843 Operators Online — 1,247 GW Charged"*. Visitors see the game is live immediately.
- **Animated counter strip** — key metrics (Players Online, Total Charges, Active Rooms, Uptime) animate from 0 to their live values on scroll using Framer Motion `useScroll` + `useSpring`.
- **"How It Works" section** — 3-4 numbered steps with staggered scroll-triggered reveals. Each step has a custom icon and brief description.
- **Tech showcase** — logo bar of technologies used (Next.js, Socket.io, PostgreSQL, Prisma, Docker, Framer Motion) with subtle hover animation.
- **Footer** — live grid status badge (pulsing green dot + "Grid Online") that reflects actual server health via periodic `/api/status` polling.

**Technical:**
- `framer-motion` for all animations: scroll-triggered reveals, staggered children, layout transitions, spring counters, hover effects.
- Server-side rendered via Next.js App Router for fast initial load and SEO.
- Fully responsive: mobile-first grid layout, touch-friendly, performs smoothly from 320px to ultrawide.
- Dark cyberpunk theme consistent with the game UI (indigo/cyan/orange palette, glassmorphism cards, subtle grid border overlays).
- Route: `/` (public landing), separate from `/game` (authenticated game page).

#### 2. Authentication & User System
- **Signup with nickname, email, and password** — persistent identity across sessions.
- **Login with email + password** — returns a JWT token stored in `localStorage`.
- **Password hashing** via `bcrypt` (never stored in plaintext).
- **JWT middleware** on both HTTP routes and Socket.io connections — every socket event is authenticated.
- **Protected HTTP routes** (`/api/me`, `/api/logout`) for session management.
- **Auth UI:** Login/signup forms with validation, auto-redirect to game on success.
- The auto-generated `Node-XXX` fallback is removed — players must sign up to play.

#### 2. Real-Time Chat System
- **In-game chat** alongside the board so players can coordinate.
- Messages broadcast via Socket.io with `send_chat` / `chat_message` events.
- Chat history persisted in PostgreSQL for message retention.
- System messages (e.g., "Player_X scored!", "Player_Y joined the grid").

#### 2. Multiple Game Rooms
- Players can **create or join** named rooms instead of one global board.
- Each room has its own isolated game state, queue, and chat.
- Room listing UI with player count display.
- `create_room` / `join_room` / `leave_room` events.
- Room owner can start/reset the game.
- **Player limit per room:** configurable on creation — set a max number (e.g. 10, 50) or leave as `null`/`0` for unlimited. Room is locked when full.

#### 3. PostgreSQL + Prisma ORM (replacing JSON files)
- **Prisma schema** defines all models: `User`, `Room`, `GameState`, `ChatMessage`, `MoveHistory`.
- **Type-safe queries** — Prisma Client generates TypeScript types from the schema.
- **Migrations via `npx prisma migrate dev --name <descriptive_name>`** — never `db push`.
- Migration files tracked in Git under `backend/prisma/migrations/`.
- Prisma Studio for visual DB inspection (`npx prisma studio`).

#### 4. Move History & Replay
- Every move logged to `move_history` table (player, coordinates, timestamp, room).
- Replay mode: playback the entire move sequence of a game session.
- Step-forward/step-backward controls in replay UI.

#### 5. Docker + docker-compose
- `Dockerfile` for frontend and backend.
- `docker-compose.yml` wiring frontend, backend, PostgreSQL.
- `.env` configuration with sensible defaults.
- One command: `docker compose up` to run everything.

#### 6. Test Suite
- **Backend:** Unit tests for queue logic, move validation; integration tests for Socket.io events and API endpoints.
- **Frontend:** Component tests for GameGrid, QueuePanel; hook tests for socket connection logic.
- Coverage reporting.

#### 7. GitHub Actions CI/CD
- Run tests, linting, type-checking on every push/PR.
- Optional: Docker image build and push.

#### 8. Admin Dashboard
- Real-time analytics: active connections, moves/sec, score history.
- Room management (view/cancel games).
- Basic moderation (kick, mute).

---

## Prisma Schema (`backend/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  nickname     String
  email        String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")

  rooms        Room[]
  gameStates   GameState[]
  chatMessages ChatMessage[]
  moveHistory  MoveHistory[]

  @@map("users")
}

model Room {
  id         String   @id @default(cuid())
  name       String
  ownerId    String   @map("owner_id")
  status     String   @default("waiting") // waiting | playing | finished
  boardSize  Int      @default(10) @map("board_size")
  maxPlayers Int?     @map("max_players") // null = unlimited
  createdAt  DateTime @default(now()) @map("created_at")

  owner        User          @relation(fields: [ownerId], references: [id])
  gameStates   GameState[]
  chatMessages ChatMessage[]
  moveHistory  MoveHistory[]

  @@map("rooms")
}

model GameState {
  roomId   String @id @map("room_id")
  pieceX   Int    @default(4) @map("piece_x")
  pieceY   Int    @default(4) @map("piece_y")
  targetX  Int    @default(2) @map("target_x")
  targetY  Int    @default(7) @map("target_y")
  score    Int    @default(0)
  turnQueue Json?  @map("turn_queue")

  room Room @relation(fields: [roomId], references: [id])

  @@map("game_state")
}

model ChatMessage {
  id        Int      @id @default(autoincrement())
  roomId    String   @map("room_id")
  userId    String   @map("user_id")
  message   String
  createdAt DateTime @default(now()) @map("created_at")

  room Room @relation(fields: [roomId], references: [id])
  user User @relation(fields: [userId], references: [id])

  @@map("chat_messages")
}

model MoveHistory {
  id        Int      @id @default(autoincrement())
  roomId    String   @map("room_id")
  userId    String   @map("user_id")
  fromX     Int?     @map("from_x")
  fromY     Int?     @map("from_y")
  toX       Int      @map("to_x")
  toY       Int      @map("to_y")
  scored    Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  room Room @relation(fields: [roomId], references: [id])
  user User @relation(fields: [userId], references: [id])

  @@map("move_history")
}
```

### Migration Workflow
```bash
# After editing schema.prisma:
npx prisma migrate dev --name add_chat_model

# Apply to production/staging:
npx prisma migrate deploy

# Visual DB browser:
npx prisma studio
```
Always use `migrate dev --name <descriptive_name>` — never `prisma db push` in this project.
`db push` is only for prototyping; `migrate dev` generates proper migration files that are committed to Git.

---

## Backend Events

### HTTP Endpoints
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | `{ nickname, email, password }` | Create account, return JWT |
| POST | `/api/auth/login` | `{ email, password }` | Authenticate, return JWT |
| GET | `/api/auth/me` | — (JWT in header) | Get current user info |

### Client → Server (WebSocket)
| Event | Payload | Description |
|-------|---------|-------------|
| `join_game` | `{ userId }` | Join the game queue |
| `move_piece` | `{ x, y }` | Attempt to move the Energy Orb |
| `send_chat` | `{ roomId, message }` | Send a chat message |
| `create_room` | `{ name }` | Create a new game room |
| `join_room` | `{ roomId }` | Join an existing room |
| `leave_room` | `{ roomId }` | Leave a room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `game_state` | Full board + queue state | Broadcast on every state change |
| `grid_charged` | `{ score, nextTarget }` | Emitted when a player scores |
| `chat_message` | `{ userId, message, timestamp }` | New chat broadcast |
| `room_list` | Array of rooms | Available rooms listing |
| `error_message` | `{ message }` | Validation errors |

---

## Project Structure

```
charge-circle/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/        # Request handlers (thin layer)
│   │   │   ├── auth.controller.ts
│   │   │   ├── game.controller.ts
│   │   │   └── room.controller.ts
│   │   ├── services/           # Business logic (testable)
│   │   │   ├── auth.service.ts
│   │   │   ├── queue.service.ts
│   │   │   ├── game.service.ts
│   │   │   ├── chat.service.ts
│   │   │   └── room.service.ts
│   │   ├── middleware/         # Express/Socket.io middleware
│   │   │   ├── auth.middleware.ts
│   │   │   └── validate.middleware.ts
│   │   ├── dto/               # Data Transfer Objects
│   │   │   ├── auth.dto.ts      # SignupDto, LoginDto
│   │   │   ├── game.dto.ts      # MovePieceDto, GameStateDto
│   │   │   ├── chat.dto.ts      # SendChatDto, ChatMessageDto
│   │   │   └── room.dto.ts      # CreateRoomDto, RoomDto
│   │   ├── socket/            # Socket.io event handlers
│   │   │   ├── game.handler.ts
│   │   │   ├── chat.handler.ts
│   │   │   └── room.handler.ts
│   │   ├── routes/
│   │   │   └── auth.routes.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   └── errors.ts
│   │   └── app.ts             # Express + Socket.io setup
│   ├── tests/
│   │   ├── services/
│   │   └── socket/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── game/
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── landing/            # Landing page components
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── FeatureCards.tsx
│   │   │   │   ├── LiveDemoStrip.tsx
│   │   │   │   ├── AnimatedCounters.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   ├── TechShowcase.tsx
│   │   │   │   └── LiveFooter.tsx
│   │   │   ├── GameGrid.tsx
│   │   │   ├── QueuePanel.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   └── RoomList.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useAnimatedCounter.ts
│   │   ├── lib/
│   │   │   ├── socket.ts
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Landing page (/)
│   │   └── globals.css
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── .env.example
└── README.md
```

### Unnecessary Files to Remove
- `frontend/AGENTS.md` — AI agent instructions, not project documentation
- `frontend/CLAUDE.md` — AI agent instructions, not project documentation
- `frontend/test-sockets.js` — standalone test script, replaced by proper test suite
- `frontend/README.md` — default Next.js boilerplate, replace with project README
- `frontend/public/*.svg` — default Next.js boilerplate SVGs (replace with game assets)
- `backend/database/` — entire folder (JSON file storage replaced by PostgreSQL + Prisma)

---

## Data Transfer Objects (DTOs)

Every API request/response uses typed DTOs to enforce shape at runtime and guarantee type safety from controller to client.

### Pattern
```
Client Request → DTO Validation (zod) → Service → Prisma DB
Client Response ← DTO Transform ← Service ← Prisma DB
```

### Backend DTOs
```typescript
// src/dto/auth.dto.ts
import { z } from 'zod';

export const SignupDto = z.object({
  nickname: z.string().min(2).max(20),
  email:    z.string().email(),
  password: z.string().min(6).max(100)
});
export type SignupDto = z.infer<typeof SignupDto>;

export const LoginDto = z.object({
  email:    z.string().email(),
  password: z.string()
});
export type LoginDto = z.infer<typeof LoginDto>;

// src/dto/game.dto.ts
export const MovePieceDto = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0)
});
export type MovePieceDto = z.infer<typeof MovePieceDto>;

// src/dto/chat.dto.ts
export const SendChatDto = z.object({
  roomId:  z.string(),
  message: z.string().min(1).max(500)
});
export type SendChatDto = z.infer<typeof SendChatDto>;

// src/dto/room.dto.ts
export const CreateRoomDto = z.object({
  name:       z.string().min(1).max(30),
  maxPlayers: z.number().int().min(1).nullable().optional() // null or omitted = unlimited
});
export type CreateRoomDto = z.infer<typeof CreateRoomDto>;

export const JoinRoomDto = z.object({
  roomId: z.string()
});
export type JoinRoomDto = z.infer<typeof JoinRoomDto>;
```

### Frontend DTOs (shared types)
```typescript
// frontend/app/types/index.ts
export interface GameStateDto {
  piece:    { x: number; y: number };
  target:   { x: number; y: number };
  boardSize: number;
  score:     number;
  queue:     QueueUserDto[];
}

export interface QueueUserDto {
  id:      string;
  counter: number;
  myTurn:  boolean;
  online:  boolean;
}

export interface ChatMessageDto {
  userId:    string;
  nickname:  string;
  message:   string;
  createdAt: string;
}
```

All Socket.io event payloads and HTTP request bodies are validated against their DTO before entering any service layer. Invalid payloads are rejected with a typed error response — never raw `any`.

---

## Backend Architecture

```mermaid
graph TD
    Client[Browser Client] -->|HTTP| Auth[Auth Module]
    Client -->|Socket.io (JWT)| WS[WebSocket Server]
    Auth --> DB[(PostgreSQL)]
    WS --> QM[Queue Manager]
    WS --> GSM[Game State Manager]
    WS --> Chat[Chat Handler]
    WS --> RoomM[Room Manager]
    GSM --> DB
    QM --> DB
    Chat --> DB
    RoomM --> DB
    GSM --> Redis[Redis Cache - Future]
```

### Module Responsibilities
1. **Auth Module:** Signup/login HTTP endpoints, password hashing (bcrypt), JWT generation and verification, token middleware for WebSocket connections.
2. **WebSocket Server:** Authenticated connection management, event routing, broadcasting.
3. **Queue Manager:** FIFO queue rotation, turn validation, counter updates.
4. **Game State Manager:** Piece position, target spawning, score tracking, move validation.
5. **Chat Handler:** Message relay, persistence, system messages.
6. **Room Manager:** Room lifecycle, isolated game instances, room listing.
7. **Database Layer (Prisma ORM):** Type-safe query client, schema management, migration generation, connection pooling via Prisma Client.

---

## Scalability & Performance

- **In-memory game state** with periodic PostgreSQL persistence (not on every move).
- **Socket.io rooms** isolate broadcasts per game room (avoids global fan-out).
- **Rate limiting** on move_piece and chat events to prevent spam.
- **Connection pooling** for PostgreSQL to handle concurrent reads/writes.
- **Future:** Redis pub/sub for horizontal scaling across multiple Node.js instances.

---

## Running the Project

```bash
# One-command setup (requires Docker)
docker compose up

# Or run manually:
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# PostgreSQL must be running locally on port 5432
```
