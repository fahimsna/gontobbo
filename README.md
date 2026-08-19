# 🚗 Gontobbo

### Connecting people, destinations, and journeys.

**Gontobbo** is a full-stack ride-sharing and mobility platform built with the MERN stack. It is designed to make everyday transportation more accessible, convenient, and organized by connecting people who need rides with people who can provide them.

> **Find a ride. Share a ride. Reach your destination.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge)](https://gontobbo-chi.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge\&logo=github)](https://github.com/fahimsna/gontobbo)

---

# 📌 Table of Contents

* [About Gontobbo](#-about-gontobbo)
* [The Problem](#-the-problem)
* [Our Solution](#-our-solution)
* [What Makes Gontobbo Different](#-what-makes-gontobbo-different)
* [Core Features](#-core-features)
* [How It Works](#-how-it-works)
* [Technology Stack](#-technology-stack)
* [System Architecture](#-system-architecture)
* [Project Structure](#-project-structure)
* [Getting Started](#-getting-started)
* [Environment Variables](#-environment-variables)
* [Running Locally](#-running-locally)
* [Deployment](#-deployment)
* [Future Roadmap](#-future-roadmap)
* [Contributing](#-contributing)
* [Author](#-author)
* [License](#-license)

---

# 🌍 About Gontobbo

Transportation is an important part of everyday life, but finding a convenient and affordable way to travel can still be difficult.

Gontobbo was created as a platform that brings **ride discovery, ride sharing, and mobility management** into one application.

Instead of relying entirely on traditional transportation services, users can use Gontobbo to discover available rides, share journeys, and connect with other people traveling toward similar destinations.

The platform is built with a modern full-stack architecture using **MongoDB, Express.js, React, and Node.js**, allowing the application to provide a complete end-to-end web experience.

---

# 🎯 The Problem

Everyday transportation can create several challenges for commuters and travelers.

### 🚗 1. Finding suitable rides

People often have difficulty finding transportation that matches their:

* Destination
* Schedule
* Budget
* Preferred route
* Availability

### 💰 2. Transportation costs

Individual transportation can become expensive, especially when a person is traveling alone.

Ride sharing can help distribute transportation costs between multiple passengers.

### 🕐 3. Time and convenience

Searching for transportation across different services can be time-consuming.

Users often need to contact people individually or rely on multiple platforms to find a suitable ride.

### 🤝 4. Lack of direct connection

People traveling along similar routes may not know about each other.

A platform that connects riders and drivers can make better use of existing transportation capacity.

### 🌐 5. Fragmented experience

Transportation discovery, communication, and ride management can be spread across different platforms.

This creates an unnecessary amount of friction for users.

---

# 💡 Our Solution

Gontobbo provides a centralized platform for **ride sharing and mobility discovery**.

The core idea is simple:

```text
        Need a Ride?
             │
             ▼
      Search / Discover
             │
             ▼
        Find a Match
             │
             ▼
      Connect with User
             │
             ▼
       Share the Ride
             │
             ▼
        Reach Destination
```

Gontobbo aims to make the process of finding and sharing transportation more straightforward by bringing the experience into one platform.

---

# ⭐ What Makes Gontobbo Different?

Gontobbo is not simply another transportation website.

Its focus is on creating a **community-driven mobility experience** where transportation can be shared between people traveling toward similar destinations.

### 🤝 Community-driven mobility

Instead of relying only on traditional transportation providers, Gontobbo allows users to participate in the transportation ecosystem.

A user can potentially be both:

* A passenger
* A ride provider

This creates a more flexible transportation network.

### 🧭 Destination-focused ride discovery

Gontobbo focuses on the journey itself.

Users can discover rides based on where they are going rather than simply choosing from a fixed list of transportation companies.

### 💰 Shared transportation

Ride sharing can allow multiple people traveling along similar routes to share transportation costs.

### 🌱 Better utilization of existing journeys

If someone is already traveling toward a particular destination, available seats in that journey can potentially be shared with others.

This can make better use of existing transportation capacity.

### 👥 Direct user-to-user interaction

Gontobbo is designed around interaction between users rather than only interactions between customers and a transportation company.

### 🚀 Extensible architecture

The MERN-based architecture allows the platform to grow into a larger mobility ecosystem with additional services and integrations.

---

# ✨ Core Features

## 🚗 Ride Discovery

Users can discover available rides and find transportation based on their travel requirements.

## 📍 Destination-based Searching

Users can search for rides according to their desired destination and journey.

## 👤 User Accounts

Users can create accounts and interact with the platform through authenticated functionality.

## 🤝 Ride Sharing

The platform is designed to connect people traveling along similar routes.

## 🧭 Mobility Management

Users can interact with available transportation options through a centralized interface.

## 📱 Responsive UI

Gontobbo is designed to provide a consistent experience across:

* Desktop
* Tablet
* Mobile

## 🎨 Modern Interface

The application uses a clean and modern interface to make navigation and ride discovery easier.

---

# 🔄 How Gontobbo Works

The platform can be understood through two primary user roles.

### 🧑 Passenger

A passenger can:

```text
Open Gontobbo
      ↓
Search for a ride
      ↓
Choose a suitable journey
      ↓
Connect / interact
      ↓
Share the journey
      ↓
Reach destination
```

### 🚗 Ride Provider

A ride provider can:

```text
Open Gontobbo
      ↓
Create / offer a ride
      ↓
Specify journey details
      ↓
Make available seats visible
      ↓
Connect with passengers
      ↓
Complete the journey
```

This creates a two-sided mobility platform where both sides contribute to the transportation network.

---

# 🏗️ System Architecture

Gontobbo follows a **client-server architecture**.

```text
                         Gontobbo
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       React Frontend              Express Backend
       Vite + Tailwind              Node.js + API
              │                           │
              │        REST API           │
              └─────────────┬─────────────┘
                            │
                            ▼
                       Mongoose
                            │
                            ▼
                     MongoDB Atlas
```

### Frontend

The React frontend is responsible for:

* User interface
* Navigation
* Forms
* User interactions
* API communication
* Responsive layouts

### Backend

The Express backend handles:

* API requests
* Business logic
* Authentication
* Data processing
* Database operations

### Database

MongoDB stores application data through Mongoose models.

---

# 🛠️ Technology Stack

## Frontend

| Technology   | Purpose             |
| ------------ | ------------------- |
| React.js     | User interface      |
| Vite         | Frontend build tool |
| Tailwind CSS | Styling             |
| JavaScript   | Application logic   |
| React Router | Client-side routing |
| Axios        | API communication   |

## Backend

| Technology | Purpose                     |
| ---------- | --------------------------- |
| Node.js    | Runtime environment         |
| Express.js | Backend framework           |
| REST API   | Client-server communication |
| Mongoose   | MongoDB object modeling     |

## Database

| Technology    | Purpose                |
| ------------- | ---------------------- |
| MongoDB       | Application database   |
| MongoDB Atlas | Cloud database hosting |

## Development & Deployment

| Tool    | Purpose             |
| ------- | ------------------- |
| Git     | Version control     |
| GitHub  | Source code hosting |
| Postman | API testing         |
| VS Code | Development         |
| Vercel  | Frontend deployment |
| Render  | Backend deployment  |

---

# 📂 Project Structure

```text
gontobbo/
│
├── client/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   │
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── ...
│   │
│   ├── package.json
│   └── server.js
│
├── .gitignore
└── README.md
```

---

# 🚀 Getting Started

Follow these steps to run Gontobbo locally.

## Prerequisites

Make sure you have the following installed:

* [Node.js](https://nodejs.org/)
* npm
* Git
* MongoDB or MongoDB Atlas

---

# 1️⃣ Clone the Repository

```bash
git clone https://github.com/fahimsna/gontobbo.git
```

Move into the project:

```bash
cd gontobbo
```

---

# 2️⃣ Install Frontend Dependencies

```bash
cd client
npm install
```

---

# 3️⃣ Install Backend Dependencies

Open another terminal:

```bash
cd gontobbo/server
npm install
```

---

# 🔐 Environment Variables

The application uses environment variables for configuration and sensitive credentials.

Create the required `.env` files based on the variables used by the project.

### Backend

Example:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Frontend

If required:

```env
VITE_API_URL=your_backend_api_url
```

> ⚠️ **Never commit `.env` files, database credentials, JWT secrets, API keys, or other sensitive information to GitHub.**

---

# ▶️ Running Locally

## Start the Backend

From the `server` directory:

```bash
npm run dev
```

The backend will start on the configured port.

For example:

```text
http://localhost:8000
```

---

## Start the Frontend

Open another terminal and move into the frontend:

```bash
cd client
npm run dev
```

Vite will provide the local development URL.

Typically:

```text
http://localhost:5173
```

---

# 🌐 Deployment

Gontobbo is deployed using a separated frontend/backend architecture.

| Component    | Platform      |
| ------------ | ------------- |
| 🌐 Frontend  | Vercel        |
| ⚙️ Backend   | Render        |
| 🗄️ Database | MongoDB Atlas |

## 🚀 Live Application

### **[Visit Gontobbo →](https://gontobbo-chi.vercel.app/)**

The production application is available online through Vercel.

## 💻 Source Code

### **[View Repository →](https://github.com/fahimsna/gontobbo)**

---

# 🔗 Deployment Flow

```text
                   USER
                    │
                    ▼
        ┌─────────────────────┐
        │  Gontobbo Frontend  │
        │       Vercel        │
        └──────────┬──────────┘
                   │
                   │ HTTPS / REST API
                   ▼
        ┌─────────────────────┐
        │   Gontobbo Backend  │
        │       Render        │
        └──────────┬──────────┘
                   │
                   │ Mongoose
                   ▼
        ┌─────────────────────┐
        │    MongoDB Atlas    │
        └─────────────────────┘
```

---

# 🔮 Future Roadmap

Gontobbo is designed to grow beyond basic ride sharing.

Potential future improvements include:

### 🗺️ Interactive Maps

Integrate maps to display:

* Pickup locations
* Drop-off locations
* Routes
* Nearby rides

### 📍 Real-time Location Tracking

Allow passengers and ride providers to track journeys in real time.

### 🔔 Notifications

Provide notifications for:

* Ride requests
* Ride confirmations
* Cancellations
* Journey updates

### ⭐ Ratings & Reviews

Allow passengers and ride providers to rate each other after completing a journey.

### 💬 In-app Messaging

Enable users to communicate without leaving the platform.

### 💳 Online Payments

Introduce secure digital payment functionality for shared transportation costs.

### 🤖 Smart Ride Matching

Use destination, route, timing, and availability to suggest compatible rides.

### 📊 User Dashboard

Provide personalized dashboards containing:

* Upcoming rides
* Previous journeys
* Ride history
* Activity
* Saved routes

### 🧭 Advanced Route Planning

Help users find efficient routes and suitable transportation options.

---

# 📈 Project Vision

The long-term vision of Gontobbo is to become more than a ride-sharing application.

The goal is to build a **connected mobility ecosystem** where people can discover, share, and manage transportation through a single platform.

Gontobbo aims to answer a simple question:

> **How can we make everyday transportation more connected, accessible, and convenient?**

The platform can evolve by combining:

```text
Ride Sharing
     +
Smart Matching
     +
Real-time Mobility
     +
Digital Payments
     +
Community
     =
Connected Mobility Platform
```

---

# 🤝 Contributing

Contributions and suggestions are welcome.

### Create a branch

```bash
git checkout -b feature/your-feature
```

### Make your changes

Implement and test your feature.

### Commit your changes

```bash
git add .
git commit -m "Add: your feature"
```

### Push the branch

```bash
git push origin feature/your-feature
```

Then open a Pull Request on GitHub.

---

# 🧪 Testing

Before submitting changes, make sure to verify:

* Frontend builds successfully
* Backend starts successfully
* API endpoints respond correctly
* Authentication works correctly
* Database operations work correctly
* Production environment variables are configured
* Responsive layouts work across different screen sizes

---

# 🔒 Security

Gontobbo uses environment variables for sensitive configuration.

When deploying the application:

* Keep database credentials private
* Keep authentication secrets private
* Configure production CORS correctly
* Do not expose private API keys
* Use HTTPS in production
* Validate user input on the backend

---

# 📊 Project Status

**Status:** 🟢 Deployed

**Frontend:** Vercel
**Backend:** Render
**Database:** MongoDB Atlas

### Live:

**https://gontobbo-chi.vercel.app/**

---

# 👨‍💻 Author

## Fahim Shahriar Nur

Computer Science Student & Software Developer

### Connect

* **GitHub:** https://github.com/fahimsna
* **Gontobbo Repository:** https://github.com/fahimsna/gontobbo
* **Live Application:** https://gontobbo-chi.vercel.app/

---

# 📄 License

This project was developed for educational and portfolio purposes.

© 2026 Fahim Shahriar Nur. All rights reserved.

---

<p align="center">
  This Project Is Built using the MERN Stack
</p>
