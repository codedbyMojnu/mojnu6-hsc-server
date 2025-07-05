
# 🧠 Brain Test App Server (Bangla)

এই সার্ভার `Node.js + Express + MongoDB` দিয়ে তৈরি।

## 🔧 ইনস্টল করার ধাপ

```bash
npm install
cp .env.example .env
# .env ফাইলে MongoDB URI এবং JWT_SECRET দিন
npm start
```

## 🛡️ API Routes

### 🔐 Auth Routes

- `POST /api/auth/register`
- `POST /api/auth/login`

### 🎯 Level Routes

- `GET /api/levels`
- `POST /api/levels` (admin only)
- `PUT /api/levels/:id` (admin only)
- `DELETE /api/levels/:id` (admin only)
