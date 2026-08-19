# 🌍 Gontobbo

### Discover places. Plan better. Travel smarter.

Gontobbo is a modern travel and destination discovery platform built to make discovering and exploring travel destinations simpler, more organized, and more engaging.

---

## 📖 About Gontobbo

Planning a trip often means jumping between different platforms to search for destinations, discover places, compare options, collect information, and decide where to go.

Most travel platforms are either heavily focused on **booking**, **reviews**, or **searching for individual attractions**. This can make the discovery and planning process feel fragmented.

**Gontobbo was built to bring the discovery experience together in one platform.**

Instead of treating travel as simply finding a hotel or booking a ticket, Gontobbo focuses on the journey that comes **before the booking** — discovering destinations, exploring places, and helping users decide where they actually want to go.

---

# 🎯 The Problem

Travel discovery can be surprisingly fragmented.

A person planning a trip may need to:

* Search Google for destinations
* Browse social media for interesting places
* Visit multiple travel websites
* Read scattered reviews
* Save interesting locations manually
* Compare destinations across different platforms
* Collect information before finally deciding where to travel

This creates several problems:

### 1. Information is scattered

Travel-related information is distributed across search engines, social platforms, blogs, booking websites, and review platforms.

### 2. Discovery is difficult

Finding a destination that matches someone's interests often requires significant searching and browsing.

### 3. Planning becomes fragmented

Users may discover a destination on one platform, find places on another, and keep notes somewhere else.

### 4. Existing platforms often prioritize transactions

Many popular travel platforms are primarily designed around:

* Hotel bookings
* Flights
* Restaurant reservations
* Reviews
* Tour packages

While these are useful, they don't necessarily solve the initial question:

> **"Where should I actually go, and what should I explore there?"**

---

# 💡 Our Solution

Gontobbo focuses on the **travel discovery and exploration stage**.

The goal is to provide a single, intuitive platform where users can:

**Discover → Explore → Evaluate → Decide**

Rather than immediately pushing users toward bookings, Gontobbo gives greater importance to **destination discovery and exploration**.

The platform is designed around the idea that a better trip begins with a better discovery experience.

---

# ⭐ What Makes Gontobbo Different?

Gontobbo is not intended to compete directly with large booking platforms.

Instead, it focuses on a different part of the travel journey.

### 🧭 Discovery-first approach

Gontobbo puts destination discovery at the center of the experience rather than making booking the primary objective.

### 🗂️ Organized travel exploration

Instead of requiring users to collect information from multiple unrelated sources, Gontobbo aims to organize travel discovery within a single platform.

### 🎨 Simpler experience

The interface is designed to keep exploration straightforward and visually engaging without overwhelming users with unnecessary information.

### 🌍 Destination-focused

The platform emphasizes destinations and places themselves, allowing users to explore possibilities before deciding how they want to travel.

### 🚀 Built for extensibility

Gontobbo is designed as a full-stack application so that additional travel functionality can be integrated in the future, including personalization, maps, reviews, itineraries, and recommendations.

---

# ✨ Core Features

## 🌍 Destination Discovery

Explore different destinations and discover places worth visiting.

## 🔎 Search & Exploration

Search and navigate through available destinations and travel-related content.

## 🗺️ Place Discovery

Explore interesting locations associated with destinations.

## 👤 User Accounts

Users can create accounts and access personalized functionality.

## 📱 Responsive Interface

The application is designed to provide a consistent experience across:

* Desktop
* Tablet
* Mobile

## 🎨 Modern User Interface

Gontobbo provides a clean and intuitive interface designed around exploration rather than complicated navigation.

---

# 🧩 How Gontobbo Works

The overall experience follows a simple flow:

```text
            ┌──────────────────┐
            │      Gontobbo    │
            └────────┬─────────┘
                     │
                     ▼
             Discover Destinations
                     │
                     ▼
                Explore Places
                     │
                     ▼
              Compare / Evaluate
                     │
                     ▼
               Choose a Place
                     │
                     ▼
                Plan Your Trip
```

The idea is to reduce the amount of fragmented searching required before making a travel decision.

---

# 🛠️ Technology Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* JavaScript
* React Router
* Axios

## Backend

* Node.js
* Express.js
* REST API

## Database

* MongoDB
* Mongoose

## Development

* Git
* GitHub
* VS Code
* Postman

## Deployment

* Vercel
* Render
* MongoDB Atlas

---

# 🏗️ Architecture

Gontobbo follows a client-server architecture.

```text
                    ┌─────────────────────┐
                    │      React App      │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                            REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Express Server   │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
                           Mongoose
                               │
                               ▼
                    ┌─────────────────────┐
                    │       MongoDB       │
                    │      Database       │
                    └─────────────────────┘
```

This separation allows the frontend and backend to be developed, maintained, and deployed independently.

---

# 📂 Project Structure

```text
gontobbo/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── assets/
│   │
│   ├── public/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── package.json
│
├── .gitignore
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* MongoDB / MongoDB Atlas
* Git

---

## Clone the Repository

```bash
git clone https://github.com/fahimsna/gontobbo.git

cd gontobbo
```

---

## Install Dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd ../server
npm install
```

---

# 🔐 Environment Variables

Create a `.env` file in the backend directory.

Example:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

If the frontend requires environment variables:

```env
VITE_API_URL=your_backend_api_url
```

> Never commit `.env` files or secret credentials to GitHub.

---

# ▶️ Run Locally

### Start the backend

```bash
cd server
npm run dev
```

### Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

The application will then be available through the local development URL provided by Vite.

---

# 🌐 Deployment

Gontobbo is deployed using a separated frontend/backend architecture.

| Component | Platform      |
| --------- | ------------- |
| Frontend  | Vercel        |
| Backend   | Render        |
| Database  | MongoDB Atlas |

### 🔗 Live Application

**[Visit Gontobbo](#)**

> Replace this with the actual deployed URL.

### 💻 Repository

**[GitHub Repository](https://github.com/fahimsna/gontobbo)**

---

# 🔮 Future Roadmap

Gontobbo can be extended beyond basic destination discovery.

Potential future features include:

### 🗺️ Interactive Maps

Allow users to visually explore destinations and nearby places.

### ❤️ Wishlist

Allow users to save destinations and places they want to visit.

### ⭐ Reviews & Ratings

Allow travelers to share their experiences.

### 🤖 Personalized Recommendations

Recommend destinations based on user interests and previous exploration.

### 🧳 Trip Planner

Allow users to organize destinations and places into complete itineraries.

### 📅 Travel Itineraries

Create day-by-day travel plans.

### 🌦️ Travel Information

Provide useful information such as weather and destination conditions.

### 👥 Social Travel Features

Allow users to share destinations and travel experiences with others.

---

# 📊 Project Vision

The long-term vision of Gontobbo is to evolve from a simple destination discovery platform into a **complete travel exploration and planning ecosystem**.

The goal is not simply to answer:

> **"Where can I book?"**

but rather:

> **"Where should I go, what can I discover there, and how can I plan my journey?"**

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

If you would like to contribute:

```bash
git checkout -b feature/your-feature
```

Make your changes, commit them, and submit a pull request.

---

# 👨‍💻 Author

### Fahim Shahriar Nur

Computer Science Student & Software Developer

**GitHub:**
https://github.com/fahimsna

**Project:**
https://github.com/fahimsna/gontobbo

---

# 📄 License

This project is developed for educational and portfolio purposes.

© 2026 Fahim Shahriar Nur
