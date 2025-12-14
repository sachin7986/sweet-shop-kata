# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Sweet Shop Management System 🍬

A full-stack Sweet Shop application built with **React** (Frontend) and **Firebase Realtime Database** (Backend). This project demonstrates modern development practices including authentication, role-based access control (Admin/User/Guest), and real-time inventory management.

## 🚀 Features
- **User Authentication:** Secure login and registration.
- **Role-Based Access:** - **Admins** can add, edit, delete, and restock sweets.
  - **Users** can purchase items (real-time stock updates).
  - **Guests** can view items but cannot purchase.
- **Real-time Database:** Inventory updates instantly across all connected clients.

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v14+)
- A Firebase Project

### Installation
1. Clone the repo:
   ```bash
   git clone https://github.com/sachin7986/sweet-shop-kata
