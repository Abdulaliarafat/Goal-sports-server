# 🥅 Goal Server

A RESTful backend API built with **Node.js**, **Express.js**, **MongoDB**, **Firebase Admin SDK**, and **Stripe** to manage court bookings, user roles, payments, announcements, and more for a sports facility or community platform.

---
## 🧪 Local Development Setup

## 🧑‍💻 Getting Started

# git clone https://github.com/Abdulaliarafat/Goal-sports-server.git
# cd Goal-sports-server
# npm install
# npm i express
# http://localhost:3000
# npm start
---
## 🌍 Live Site

🔗 **Frontend:** [https://goal-sports-booking.netlify.app/](https://goal-sports-booking.netlify.app/)  
🔗 **Backend:** [https://assignment-12-server-red-theta.vercel.app/](https://assignment-12-server-red-theta.vercel.app/) <!-- change if needed -->
🔗 **Backend:** [https://github.com/Programming-Hero-Web-Course4/b11a12-client-side-Abdulaliarafat](https://github.com/Programming-Hero-Web-Course4/b11a12-client-side-Abdulaliarafat) <!-- change if needed -->

---

## 📋 Features

- 🔐 Firebase JWT Authentication
- 👤 Role-based Access Control (Admin, Member, User)
- 🏟️ Court Management (CRUD)
- 📅 Booking System with Approval Flow
- 💳 Stripe Payment Integration
- 🧾 Payment History
- 🎫 Coupon Management
- 📢 Announcements System
- 📊 Admin Dashboard Stats

---

## ⚙️ Tech Stack

| Category         | Technology                                                                                   |
|------------------|----------------------------------------------------------------------------------------------|
| Backend          | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) |
| Database         | ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) |
| Authentication   | ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black) |
| Payment Gateway  | ![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white) |
| Environment Vars | ![Dotenv](https://img.shields.io/badge/Dotenv-000000?style=for-the-badge&logo=dotenv&logoColor=white) |
| Hosting          | ![Render](https://img.shields.io/badge/Render-2C3E50?style=for-the-badge&logo=render&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) ![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white) |

---

## 📦 Dependencies

| Package           | Version    | Description                           |
|------------------|------------|---------------------------------------|
| `express`        | ^5.1.0     | Node.js web framework                 |
| `mongodb`        | ^6.17.0    | MongoDB Node.js driver                |
| `dotenv`         | ^17.2.0    | Loads environment variables           |
| `cors`           | ^2.8.5     | Cross-Origin Resource Sharing         |
| `firebase-admin` | ^13.4.0    | Firebase Admin SDK                    |
| `stripe`         | ^18.3.0    | Stripe API for payments               |



## 📂 API Endpoints Overview

### 🔑 Authentication

| Method | Endpoint                     | Description                           |
|--------|------------------------------|---------------------------------------|
| GET    | `/users/:email`              | Get user by email                     |
| GET    | `/users/role/:email`         | Get role by email                     |
| POST   | `/users`                     | Create or update user                 |

---

### 👤 Users

| Method | Endpoint         | Access Role | Description           |
|--------|------------------|-------------|-----------------------|
| GET    | `/users`         | Admin       | Get all users/members |
| DELETE | `/users/:id`     | Admin       | Delete user/member    |

---

### 🏟️ Courts

| Method | Endpoint         | Description                |
|--------|------------------|----------------------------|
| GET    | `/court`         | Get all courts             |
| POST   | `/court`         | Add a new court            |
| PUT    | `/court/:id`     | Update court by ID         |
| DELETE | `/court/:id`     | Delete court by ID         |

---

### 📅 Bookings

| Method | Endpoint                   | Access Role | Description                      |
|--------|----------------------------|-------------|----------------------------------|
| GET    | `/bookings`                | Admin       | Get all bookings                 |
| GET    | `/bookings/Member`         | Member      | Get member's bookings            |
| GET    | `/bookings/User`           | User        | Get user's bookings              |
| GET    | `/bookings/approved`       | Member      | Get approved bookings            |
| GET    | `/bookings/approved/:id`   | Member      | Get booking by ID for payment    |
| POST   | `/bookings`                | Public      | Create new booking               |
| PATCH  | `/bookings/decision/:id`   | Admin       | Approve/Reject booking           |
| DELETE | `/bookings/:id`            | Any         | Delete booking by ID             |

---

### 💸 Payments

| Method | Endpoint                | Access Role | Description                       |
|--------|-------------------------|-------------|-----------------------------------|
| GET    | `/payments?email=`      | Member      | Get user payment history          |
| POST   | `/payments`             | Public      | Record a payment                  |
| POST   | `/create-payment-intent`| Public      | Create Stripe payment intent      |

---

### 🎫 Coupons

| Method | Endpoint           | Description               |
|--------|--------------------|---------------------------|
| GET    | `/coupon`          | Get all coupons           |
| POST   | `/coupon`          | Add a coupon              |
| PATCH  | `/coupon/:id`      | Update coupon by ID       |
| DELETE | `/coupon/:id`      | Delete coupon by ID       |

---

### 📢 Announcements

| Method | Endpoint               | Description               |
|--------|------------------------|---------------------------|
| GET    | `/announcements`       | Get all announcements     |
| POST   | `/announcements`       | Post a new announcement   |
| PATCH  | `/announcements/:id`   | Update announcement       |
| DELETE | `/announcements/:id`   | Delete announcement       |

---

### 📊 Dashboard Stats

| Method | Endpoint           | Access Role | Description                   |
|--------|--------------------|-------------|-------------------------------|
| GET    | `/dashboard/stats` | Admin       | View total users, courts, etc |

---

## 🔐 Authentication & Security

- Firebase Admin SDK used for verifying ID tokens securely.
- Three custom role middlewares:
  - `verifyAdmin`
  - `verifyMember`
  - `verifyUser`

- JWT is sent in the `Authorization` header as `Bearer <token>`.

---

