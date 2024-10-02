# Lumisca

Empowering Collaborative Study, One Session at a Time.

---

## Prerequisites

- [Bun](https://bun.sh) for backend
- [Node.js](https://nodejs.org) for frontend
- [Firebase](https://firebase.google.com) for authentication & database
- [Videosdk.live](https://videosdk.live) for video conferencing

## Setup

1. Clone the repository

### Frontend

1. Navigate to the `frontend` directory
2. Install the dependencies
   ```bash
   bun install
   ```
3. Create `.env.local` file with the content:

   ```env
   NODE_ENV=development

   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api

   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   ```

4. Start the development server
   ```bash
   bun dev
   ```

### Backend

1. Navigate to the `backend` directory
2. Install the dependencies
   ```bash
   bun install
   ```
3. Create `.env` file with the content:

   ```env
   GOOGLE_APPLICATION_CREDENTIALS="./lumisca-xxx-xxxxxxxxx.json"
   # For gemini
   GOOGLE_API_KEY=

   FIREBASE_DATABASE_URL=

   # For development
   FIREBASE_AUTH_EMULATOR_HOST=
   FIREBASE_DATABASE_EMULATOR_HOST=
   FIRESTORE_EMULATOR_HOST=

   VIDEOSDK_API_KEY=
   VIDEOSDK_API_SECRET=
   ```

4. Start the development server
   ```bash
   bun dev
   ```

### Firebase Emulator

1. Install the Firebase CLI
   ```bash
   npm install -g firebase-tools
   ```
2. Login to Firebase

   ```bash
    firebase login
   ```

3. Start the Firebase Emulator
   ```bash
   firebase emulators:start
   ```

### Final steps

1. Open the frontend at [http://localhost:3000](http://localhost:3000) (or whatever is specified in the terminal)

   > [!NOTE]  
   > Frontend will do rewrite to the backend API, so make sure the backend is running at the specified URL, set on the `.env.local` file.

# Technologies

1. Next.js - Frontend
2. Bun & Hono - Backend
3. Firebase - Authentication & Database
4. Videosdk.live - Video Conferencing
5. Gemini & LangChain - AI Generated Roadmaps

# License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
