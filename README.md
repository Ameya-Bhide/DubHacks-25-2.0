# Study Group App

A modern study group application built with Next.js, Tailwind CSS, and Electron for desktop deployment.

## Features

- **Beautiful Login Interface**: Clean and modern authentication UI
- **Study Group Management**: View and manage your study groups
- **Upcoming Sessions**: Track your scheduled study sessions
- **Quick Actions**: Easy access to common tasks
- **Desktop App**: Runs as a native desktop application using Electron

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Desktop**: Electron
- **Build Tool**: Next.js with static export

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd study-group-app
```

2. Install dependencies:
```bash
npm install
```

### Development

#### Web Development
To run the app in development mode (web browser):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Desktop Development
To run the app as a desktop application in development:
```bash
npm run electron-dev
```
This will start both the Next.js dev server and Electron.

### Building

#### Web Build
```bash
npm run build
npm run start
```

#### Desktop Build
```bash
npm run build-electron
```

#### Distribution
To create distributable packages:
```bash
npm run dist
```

## Project Structure

```
study-group-app/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page component
├── public/                # Static files
│   └── electron.js        # Electron main process
├── package.json           # Dependencies and scripts
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Features Overview

### Login Page
- Email and password authentication
- Responsive design
- Form validation
- Sign up link (placeholder)

### Main Dashboard
- Study group cards with member count and status
- Upcoming study sessions timeline
- Quick action buttons
- Responsive grid layout

### Desktop Integration
- Native menu bar
- Keyboard shortcuts
- Window management
- Security best practices

## Customization

### Styling
The app uses Tailwind CSS with a custom color scheme. You can modify colors in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    // Your custom primary colors
  }
}
```

### Electron Configuration
Modify `public/electron.js` to customize:
- Window size and behavior
- Menu items
- Security settings
- App metadata

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
