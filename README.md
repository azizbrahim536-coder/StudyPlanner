# 📚 StudyPlanner — AI-Powered Study Planning

<p align="center">
  <img src="StudyFront/src/assets/studylogo.png" alt="StudyPlanner logo" width="120">
</p>

<p align="center">
  A full-stack study planning application built with Angular, Spring Boot, MySQL, Flask, and Gemini AI.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-Frontend-DD0031?logo=angular&logoColor=white" alt="Angular">
  <img src="https://img.shields.io/badge/Spring%20Boot-Backend-6DB33F?logo=springboot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Flask-AI%20Service-000000?logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/Gemini-AI-8E75B2?logo=googlegemini&logoColor=white" alt="Gemini AI">
</p>

---

## 📌 Overview

**StudyPlanner** is a full-stack web application that helps students organize study sessions, manage priorities, track progress, and prepare for exams.

The application also includes an AI-powered planner. The student provides a subject, exam date, available study time, preferred start time, difficulty level, and a list of chapters. Gemini AI then generates a structured study plan.

Before saving, the student can:

- Review the proposed sessions
- Edit titles, dates, times, durations, priorities, and descriptions
- Remove unwanted sessions
- Save all approved sessions to MySQL in one action

This project demonstrates full-stack development, REST API design, database management, Angular forms, batch operations, and AI integration.

---

## ✨ Features

### Study task management

- Create a study session
- Display all study sessions
- Edit an existing session
- Delete a session
- Search by title, subject, or description
- Filter by subject, status, and priority
- Change task status quickly
- Detect overdue study sessions
- Display planning statistics

### AI study plan generator

- Generate a study plan with Gemini AI
- Use an exam date and chapter list
- Define available hours per day
- Define a preferred start time
- Select a difficulty level
- Preview generated sessions before saving
- Edit generated sessions
- Remove individual generated sessions
- Clear the complete generated plan
- Save all approved sessions with one batch request

---

## 🤖 AI Workflow

```text
Student input
     │
     ▼
Angular frontend
     │
     ├── Flask AI service ── Gemini API
     │          │
     │          ▼
     │   Generated study plan
     │
     ▼
Editable planning preview
     │
     ▼
Spring Boot batch endpoint
     │
     ▼
MySQL database
```

The Gemini API key is stored locally in:

```text
service.ia/.env
```

This file is ignored by Git and must never be committed.

---

## 🏗️ Project Structure

```text
StudyPlanner/
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── mvnw
│
├── StudyFront/
│   ├── src/
│   ├── angular.json
│   └── package.json
│
├── service.ia/
│   ├── app.py
│   ├── .env.example
│   └── .gitignore
│
└── README.md
```

---

## 🛠️ Technologies

### Frontend

- Angular
- TypeScript
- HTML5
- CSS3
- Reactive Forms
- Template-driven Forms
- Angular HttpClient

### Backend

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- Hibernate
- Bean Validation
- Maven

### Database

- MySQL

### Artificial Intelligence

- Python
- Flask
- Flask-CORS
- Google Gemini API
- `google-genai`
- Pydantic
- `python-dotenv`

### Development tools

- Git
- GitHub
- Postman
- Visual Studio Code
- IntelliJ IDEA

---

## 🔗 API Endpoints

### Study tasks API

Base URL:

```text
http://localhost:8081/api/tasks
```

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | Get all study tasks |
| `GET` | `/api/tasks/{id}` | Get one task |
| `GET` | `/api/tasks?search=keyword` | Search tasks |
| `GET` | `/api/tasks?status=TODO` | Filter by status |
| `GET` | `/api/tasks?priority=HIGH` | Filter by priority |
| `GET` | `/api/tasks/statistics` | Get task statistics |
| `POST` | `/api/tasks` | Create one task |
| `POST` | `/api/tasks/batch` | Create multiple tasks |
| `PUT` | `/api/tasks/{id}` | Update a task |
| `PATCH` | `/api/tasks/{id}/status` | Update only the status |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

### AI API

Base URL:

```text
http://localhost:5001/api/ai
```

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/ai/health` | Check AI service status |
| `POST` | `/api/ai/generate-study-plan` | Generate a study plan |

---

## 📤 AI Request Example

```json
{
  "subject": "Spring Boot",
  "examDate": "2026-07-20",
  "chapters": [
    "Architecture MVC",
    "Spring Data JPA",
    "Controllers REST",
    "Validation",
    "Spring Security"
  ],
  "availableHoursPerDay": 2,
  "preferredStartTime": "18:00",
  "difficulty": "MEDIUM"
}
```

## 📥 AI Response Example

```json
{
  "subject": "Spring Boot",
  "examDate": "2026-07-20",
  "taskCount": 2,
  "tasks": [
    {
      "title": "Réviser l’architecture MVC",
      "description": "Comprendre les responsabilités du Controller, du Service et du Repository.",
      "subject": "Spring Boot",
      "studyDate": "2026-07-05",
      "startTime": "18:00:00",
      "durationMinutes": 60,
      "priority": "HIGH",
      "status": "TODO"
    }
  ]
}
```

---

## ⚙️ Installation

### Prerequisites

- Java 17 or later
- Node.js and npm
- Angular CLI
- MySQL
- Python 3.10 or later
- Git

### 1. Clone the repository

```bash
git clone https://github.com/azizbrahim536-coder/StudyPlanner.git
cd StudyPlanner
```

### 2. Configure and run Spring Boot

```bash
cd backend
```

Configure MySQL in:

```text
src/main/resources/application.properties
```

Example:

```properties
spring.application.name=StudyPlanner

spring.datasource.url=jdbc:mysql://localhost:3306/StudyPlanner?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

server.servlet.context-path=/api
server.port=8081
```

Run on Windows:

```bash
mvnw.cmd spring-boot:run
```

Backend URL:

```text
http://localhost:8081/api
```

### 3. Install and run Angular

```bash
cd StudyFront
npm install
ng serve
```

Frontend URL:

```text
http://localhost:4200
```

### 4. Configure the AI service

```bash
cd service.ia
python -m venv venv
venv\Scripts\activate
python -m pip install flask flask-cors python-dotenv google-genai pydantic
```

Create `.env` based on `.env.example`:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
```

Start Flask:

```bash
python app.py
```

AI service URL:

```text
http://localhost:5001
```

---

## ▶️ Run the Complete Application

Run each service in a separate terminal:

```text
Angular frontend:    http://localhost:4200
Spring Boot backend: http://localhost:8081/api
Flask AI service:    http://localhost:5001
```

Recommended startup order:

```text
1. MySQL
2. Spring Boot
3. Flask AI service
4. Angular
```

---

## 🧪 Testing

### Create one study task

```text
POST http://localhost:8081/api/tasks
```

```json
{
  "title": "Réviser Angular",
  "description": "Étudier les services et HttpClient.",
  "subject": "Angular",
  "studyDate": "2026-07-10",
  "startTime": "18:00:00",
  "durationMinutes": 90,
  "priority": "HIGH",
  "status": "TODO"
}
```

### Save multiple generated tasks

```text
POST http://localhost:8081/api/tasks/batch
```

The request body must contain a JSON array of study tasks.

---

## 🔐 Security

- Gemini API keys are stored in `.env`
- `.env` is excluded with `.gitignore`
- `.env.example` contains placeholders only
- Secrets must never be committed to GitHub
- Database passwords should be stored locally or in environment variables
- AI-generated data is validated before being returned
- Spring Boot validates tasks before saving them

---

## 🚀 Future Improvements

- User registration and JWT authentication
- Personal accounts and private planning
- Calendar view
- Email reminders
- Browser notifications
- Pomodoro timer
- Drag-and-drop planning
- Course document upload
- AI-generated quizzes
- AI recommendations for overdue tasks
- Weekly productivity charts
- Export planning as PDF
- Dark mode
- Cloud deployment

---

## 👨‍💻 Author

**Mohamed Aziz Brahim**

- GitHub: [azizbrahim536-coder](https://github.com/azizbrahim536-coder)

---

## 📄 License

This project was created for learning, demonstration, and portfolio purposes.
