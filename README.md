# ZeroGravity

[![Production Deployed Link](https://img.shields.io/badge/Deployed-https%3A%2F%2Fzerogravity.aman--raj.me%2F-blueviolet?style=for-the-badge&logo=vercel)](https://zerogravity.aman-raj.me/)

ZeroGravity is an enterprise-grade, AI-powered study suite and interactive quiz platform. It provides a comprehensive set of tools designed to maximize student productivity, including on-demand AI quiz generation, real-time multiplayer testing environments, customized academic roadmaps, and robust performance analytics.

**Deployed Application:** [https://zerogravity.aman-raj.me/](https://zerogravity.aman-raj.me/)

---

## Core Pillars & Key Features

### 1. AI-Powered Practice Quizzes
* **On-Demand AI Generation:** Instantly generate bespoke practice tests on any topic, powered by state-of-the-art AI (Gemini model integrations).
* **Multi-Tier Difficulty Engine:** Select a testing pace from **Easy**, **Medium**, **Hard**, up to the elite **GOD** level (featuring advanced prompt complexities, dynamic visual upgrades, and auto-adjusted time constraints).
* **Deep Insight Analytics:** Complete tests to receive diagnostic dashboards containing interactive data visualizations (correct vs. incorrect breakdowns, performance tracking lines over time) and customized behavioral suggestions.
* **Practice Dashboard & Category Tracking:** Group, search, and monitor progress across customized subject folders.

### 2. Real-Time Multiplayer Hosted Quizzes
* **Host Live Rooms:** Open synchronous sessions for remote or in-person multiplayer competitions.
* **Active Moderation:** Utilize administrative dashboards to monitor participant connectivity, control room access, and review live scoring statistics.
* **Live Leaderboards:** Observe real-time ranking progression as players submit their answers.

### 3. Smart AI Study Planner & Tasks
* **Bespoke Roadmaps:** Input a topic or exam description to generate a comprehensive schedule complete with daily objectives, timelines, and task priorities.
* **Curated Study Focus Styles:** Tailor generation settings with distinct pedagogical modes:
  * **Balanced:** Progressive, thorough conceptual walkthroughs.
  * **Exam Cram:** High-yield summaries, active recall practice, and mock reviews.
  * **Deep Dive:** Conceptual mastery, intense research topics, and meticulous note guides.
  * **Practical:** Hands-on coding, building, and application projects.
* **Quota & Progress Meters:** Enforce daily plan limit controls, utilize interactive checkbox tracking, and seamlessly integrate tasks with the daily schedule.

### 4. Academia Companion Hub
* **Semester & Syllabus Management:** Organize academic courses, daily schedules, and overarching grading schemes.
* **GPA & Grade Tracking:** Record mock and official examination marks to dynamically calculate and forecast current academic standings.

### 5. Gamification, Social & Custom Shop
* **Virtual Economy & Custom Shop:** Accumulate points through active platform utilization to redeem items in the integrated platform shop.
* **Collectible Badges:** Earn and display premium achievement badges (visual tokens showcasing platform consistency, perfect scores, and completed study sprints).
* **Interactive Profiles:** Personalize public profiles, review global ranks, track peer statistics, and inspect profile visitor records.

---

## Technology Stack

ZeroGravity is engineered as a robust, high-performance distributed web application, leveraging a modern technology stack:

* **Frontend Framework:** Next.js 15 (App Router), React 19, and TypeScript.
* **Interactive Motion:** Framer Motion (facilitating seamless page transitions, glassmorphic UI elements, and dynamic tab switches).
* **Data Visualization:** Recharts (rendering detailed performance graphs, data distributions, and progress trends).
* **Component Styling:** Tailwind CSS, customized with fine-tuned dark/light modes and responsive media queries.
* **Security & Auth:** Secure cookie-based JWT sessions with local context caching for enhanced performance.
* **Backend Platform:** Node.js, Express.js microservice architecture (configured to interface with AI models, host real-time WebSockets, and maintain robust database records).

---

## Getting Started

### 1. Prerequisite Installations
Ensure you have [Node.js (v18+)](https://nodejs.org/) installed on your environment.

### 2. Set Up the Project
Clone the repository and navigate to the frontend directory:
```bash
git clone https://github.com/amanraj209/zeroGravity.git
cd zeroGravity/next-zerogravity
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Setup
Copy the sample environment configuration file and update the variables:
```bash
cp .env.example .env.local
```
Update your `.env.local` parameters, ensuring the `BACKEND_URL` reference correctly points to your local or deployed Express API server.

### 5. Launch Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to launch the platform locally.

### 6. Production Builds
To compile and optimize the codebase for a production environment:
```bash
npm run build
npm run start
```

---

## Security & Bug Bounty
We prioritize active platform hardening and security. ZeroGravity hosts a **Bug Bounty Program** that allows security researchers and users to responsibly disclose vulnerabilities in exchange for monetary rewards and public profile recognition. 
* **Submit a Vulnerability Report:** [Bug Bounty Form](https://forms.gle/jBC2bEukaqLCKF4KA)
