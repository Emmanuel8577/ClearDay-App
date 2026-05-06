## ClearDay App

**ClearDay** is a high-performance, production-ready productivity application designed to help users organize their lives through seamless note-taking and task scheduling. Engineered with an "Offline-First" philosophy, it ensures that your data is always accessible, regardless of your internet connection.

---

### 🚀 Key Features

*   **Note Management:** Create, edit, and organize notes with an intuitive user interface.
*   **Task Scheduling:** Integrated task manager with an alarm system to keep you on track throughout the day.
*   **100% Offline Support:** Full functionality without an internet connection, perfect for users in areas with spotty connectivity.
*   **Cross-Platform Foundations:** Built using React Native for a smooth experience on mobile devices.

---

### 🛠️ Tech Stack

*   **Frontend:** React Native / Expo.
*   **Backend/Database:** Node.js with Supabase integration for real-time feedback and secure authentication.
*   **Styling:** Tailwind CSS (NativeWind) for a modern, responsive UI.
*   **DevOps:** Fully containerized using **Docker** for a consistent development environment.

---

### 📦 Getting Started

#### Prerequisites
*   Node.js (v18+)
*   Docker (Optional, for containerized development)

#### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Emmanuel8577/ClearDay-App.git
   cd ClearDay-App
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   
```

4. **Run the App:**
   ```bash
   npx expo start
   ```

---

### 🐳 Docker Support

This project is containerized to ensure that developers can get up and running instantly without dependency conflicts.

**Pull the image from Docker Hub:**
```bash
docker pull emmanuel8577/clearday:latest
```

**Run using Docker Compose:**
```bash
docker-compose up --build
```

---

### 🛡️ Security & Quality Assurance
*   **Environment Safety:** Sensitive keys are managed via `.env` and protected by `.gitignore` to prevent leaks.
*   **Scalable Architecture:** Built with high-concurrency and production-readiness in mind, following standards established in previous large-scale projects like the Narcotic App and Dannon Platform.

---

### 👨‍💻 Author
**Emmanuel Edache Adikwu**
Full-Stack & Mobile App Developer | MERN Stack Specialist
*   **Location:** Benue State, Nigeria
*   **Education:** BEng in Electrical and Electronics Engineering
*   **Expertise:** Technical Leadership & Scalable Mobile Solutions
```
