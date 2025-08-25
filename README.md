# 🚀 Online Judge (OJ) - Competitive Programming Platform

A full-stack competitive programming platform with AI-powered assistance, real-time code execution, and comprehensive problem management system.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Running with Docker](#-running-with-docker)
- [API Documentation](#-api-documentation)
- [Contributing Guidelines](#-contributing-guidelines)
- [License](#-license)

## ✨ Features

### 🎯 Core Functionality
- **Problem Management**: Create, edit, and manage coding problems with multiple difficulty levels
- **Multi-language Support**: Java, C++, and C programming languages
- **Real-time Code Execution**: Compile and run code with custom test cases
- **Submission System**: Track user submissions and performance
- **User Authentication**: Secure login/register with Google OAuth support
- **Profile Management**: User statistics and submission history

### 🤖 AI-Powered Features
- **Smart Hints**: AI-generated hints for problem-solving (limited to 2 per problem)
- **AI Chatbot**: Programming assistance and concept explanations
- **Code Analysis**: Intelligent code review and suggestions

### 🛠️ Developer Experience
- **Code Editor**: Monaco Editor with syntax highlighting
- **Code Persistence**: Auto-save and restore user code
- **Custom Test Cases**: Run code against custom inputs
- **Performance Metrics**: Execution time and memory usage tracking
- **Recent Submissions**: View latest code submissions

### 🔒 Security & Performance
- **Rate Limiting**: API request throttling
- **Input Sanitization**: Code execution safety measures
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Cross-origin request handling
- **Helmet Security**: HTTP security headers

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Monaco Editor** - Professional code editor
- **React Icons** - Icon library
- **React Toastify** - Toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email functionality

### AI Services
- **Google Gemini AI** - AI-powered hints and chatbot
- **Google Generative AI** - Advanced AI capabilities

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy and static file serving
- **Microservices Architecture** - Separate compiler service

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Docker (optional, for containerized deployment)
- Google Cloud Platform account (for AI features)

### Step-by-Step Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd OJ
```

#### 2. Install Dependencies

**Client (Frontend)**
```bash
cd client
npm install
```

**Server (Backend)**
```bash
cd ../server
npm install
```

**Compiler Service**
```bash
cd ../Compiler
npm install
```

#### 3. Environment Configuration

Create `.env` files in the server and client directories:

**Server (.env)**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/online-judge

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# Server
PORT=5000
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# AI Services
GEMINI_API_KEY=your-gemini-api-key
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_COMPILER_URL=http://localhost:8000
```

#### 4. Database Setup
```bash
# Start MongoDB
mongod

# Seed initial problems (optional)
cd server
npm run seed
```

#### 5. Start Services

**Terminal 1 - Backend Server**
```bash
cd server
npm run server
```

**Terminal 2 - Compiler Service**
```bash
cd Compiler
npm run compiler
```

**Terminal 3 - Frontend Client**
```bash
cd client
npm run dev
```

## 🚀 Usage

### Accessing the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Compiler Service**: http://localhost:8000

### Basic Workflow
1. **Register/Login**: Create an account or sign in
2. **Browse Problems**: View available coding problems
3. **Select Problem**: Choose a problem to solve
4. **Write Code**: Use the integrated code editor
5. **Test Code**: Run against sample test cases
6. **Submit Solution**: Submit final solution for evaluation
7. **Get AI Hints**: Request AI assistance when stuck

### Code Editor Features
- **Language Selection**: Switch between Java, C++, and C
- **Syntax Highlighting**: Language-specific code highlighting
- **Auto-save**: Code is automatically saved as you type
- **Custom Input**: Test with custom test cases
- **Execution Results**: View stdout, stderr, and performance metrics

## ⚙️ Configuration

### Environment Variables

#### Required Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `GEMINI_API_KEY`: Google Gemini AI API key

#### Optional Variables
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `EMAIL_HOST`: SMTP server for password reset

### Database Configuration
- **MongoDB**: Primary database for users, problems, and submissions
- **Collections**: Users, Problems, Submissions, HintUsage
- **Indexes**: Optimized for problem queries and user submissions

### AI Configuration
- **Gemini API**: Configure API key in environment variables
- **Rate Limiting**: AI requests are limited per user
- **Hint System**: Maximum 2 hints per problem per user

## 🐳 Running with Docker

### Quick Start with Docker Compose
```bash
# Production deployment
docker-compose up -d

# Development deployment
docker-compose -f docker-compose.dev.yml up -d
```

### Individual Services

**Client (Frontend)**
```bash
cd client
docker build -t online-judge-client .
docker run -p 3000:80 online-judge-client
```

**Server (Backend)**
```bash
cd server
docker build -t online-judge-server .
docker run -p 5000:5000 online-judge-server
```

**Compiler Service**
```bash
cd Compiler
docker build -t online-judge-compiler .
docker run -p 8000:8000 online-judge-compiler
```

### Docker Features
- **Multi-stage builds** for optimized production images
- **Nginx reverse proxy** for static file serving
- **Volume mounting** for development hot-reloading
- **Environment variable** configuration
- **Health checks** and monitoring

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/v1/auth/register`
Register a new user account.
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### POST `/api/v1/auth/login`
Authenticate user and get JWT token.
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### POST `/api/v1/auth/google`
Google OAuth authentication.

#### POST `/api/v1/auth/forgotpassword`
Request password reset email.

#### PUT `/api/v1/auth/resetpassword/:resettoken`
Reset password with token.

### Problem Endpoints

#### GET `/api/v1/problems`
Get all available problems.

#### GET `/api/v1/problems/:id`
Get specific problem details.

#### POST `/api/v1/problems/:id/submit`
Submit solution for a problem.
```json
{
  "code": "your code here",
  "language": "java"
}
```

#### POST `/api/v1/problems/:id/run`
Run code against test cases.

#### POST `/api/v1/problems/:id/custom-test`
Run code with custom input.

### AI Endpoints

#### POST `/api/v1/ai/hint`
Get AI-generated hint for a problem.
```json
{
  "problemId": "problem_id",
  "userCode": "user's code",
  "hintNumber": 1
}
```

#### POST `/api/v1/ai/chatbot`
Get AI chatbot response.
```json
{
  "message": "user message",
  "type": "general"
}
```

### Compiler Service

#### POST `/compile`
Compile and execute code.
```json
{
  "language": "java",
  "code": "your code",
  "input": "optional input"
}
```

**Supported Languages**: Java, C++, C

## 🤝 Contributing Guidelines

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Setup
```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Run tests (when available)
npm test

# Build for production
npm run build
```

### Code Style
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure all tests pass
- Update documentation as needed

### Areas for Contribution
- **Frontend**: UI/UX improvements, new components
- **Backend**: API enhancements, performance optimization
- **AI Features**: Enhanced hint generation, better chatbot responses
- **Testing**: Unit tests, integration tests
- **Documentation**: API docs, user guides
- **Security**: Vulnerability fixes, security enhancements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Issues

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check the docs folder for detailed guides
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🙏 Acknowledgments

- **Google Gemini AI** for AI-powered features
- **Monaco Editor** for the excellent code editing experience
- **React Community** for the amazing ecosystem
- **Open Source Contributors** who made this project possible

---

**Happy Coding! 🎉**

*Built with ❤️ by the OJ Team*
