# Syntra 📚

A collaborative study platform for students that combines AI-powered study tools with group collaboration features.

![Syntra Logo](https://img.shields.io/badge/Syntra-Study%20Platform-blue?style=for-the-badge&logo=book)

## ✨ Features

### 🤖 AI-Powered Study Tools
- **Flashcards**: Generate interactive flashcards from your study materials
- **Summaries**: Get concise summaries of complex topics
- **Practice Questions**: Create practice questions for exam preparation
- **Search**: Intelligent search through your documents

### 👥 Study Group Management
- Create and join study groups
- Share documents and resources
- Schedule study sessions
- Invite classmates via email

### 📅 Calendar Integration
- View upcoming study sessions
- Track document due dates
- Visual calendar with meeting indicators

### 📱 Cross-Platform Support
- **Web Application**: Access from any browser
- **Desktop App**: Standalone application for offline use
- **Mobile Responsive**: Works on tablets and phones

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- AWS Account (for full functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/syntra.git
   cd syntra
   ```

2. **Install dependencies**
   ```bash
   npm install
   pip install -r AI/requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your AWS credentials
   ```

4. **Start the application**
   ```bash
   # Start the web server
   npm run dev
   
   # In another terminal, start the AI service
   cd AI && python app.py
   ```

5. **Access the app**
   - Web: http://localhost:3000
   - Desktop: `npm run electron-dev`

## 🖥️ Desktop Application

Syntra can be run as a standalone desktop application:

```bash
# Build the desktop app
npm run build-electron

# Create distribution packages
npm run dist
```

The desktop app provides:
- **Offline functionality** for basic features
- **Native file system access** for document management
- **System notifications** for study reminders
- **Auto-updates** for seamless experience

## ⚙️ Configuration

### AWS Setup (Optional)
For full functionality, configure AWS services:

1. **Create AWS Account**
2. **Set up Cognito User Pool**
3. **Configure DynamoDB tables**
4. **Set up S3 bucket for file storage**
5. **Configure Bedrock for AI features**

### Environment Variables
```env
# AWS Cognito
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_USER_POOL_ID=your_pool_id
NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID=your_client_id

# AWS Services
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1

# S3 Storage
AWS_S3_BUCKET_NAME=your_bucket_name
```

## 📖 Usage

### Creating Study Groups
1. Click "Create Group" on the home page
2. Fill in group details (name, description, class)
3. Set privacy settings (public/private)
4. Invite members via email

### Using AI Study Tools
1. Upload your study materials (PDF, TXT, DOCX)
2. Go to "AI Study Tools" section
3. Select study groups and choose a tool
4. Enter your query or topic
5. Get AI-generated content

### Managing Documents
- **Upload**: Drag and drop files or use the upload button
- **Organize**: Filter by study group, class, or date
- **Share**: Send documents to study group members
- **Download**: Access files offline

## 🏗️ Architecture

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Electron**: Desktop app wrapper

### Backend
- **AWS DynamoDB**: NoSQL database for data storage
- **AWS S3**: File storage and management
- **AWS Cognito**: User authentication
- **AWS Bedrock**: AI/ML services

### AI Service
- **Flask**: Python web framework
- **AWS Bedrock**: Claude 3 Haiku model
- **PDF Processing**: Text extraction from documents
- **YAML Configuration**: Document metadata management

## 🔧 Development

### Project Structure
```
syntra/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── page.tsx           # Main page
│   └── layout.tsx         # Root layout
├── components/            # React components
├── contexts/              # React contexts
├── lib/                   # Utility libraries
├── AI/                    # Python AI service
│   ├── app.py            # Flask application
│   └── requirements.txt  # Python dependencies
├── public/               # Static assets
└── scripts/              # Build and setup scripts
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run electron     # Run desktop app
npm run electron-dev # Run desktop app in dev mode
npm run dist         # Create distribution packages
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/yourusername/syntra/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/syntra/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/syntra/discussions)

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] Advanced AI features
- [ ] Integration with learning management systems
- [ ] Offline mode improvements
- [ ] Multi-language support

## 🙏 Acknowledgments

- AWS for cloud services
- Anthropic for Claude AI model
- Next.js team for the amazing framework
- Electron team for desktop app capabilities

---

**Made with ❤️ for students, by students**

*Syntra - Where studying meets intelligence*
