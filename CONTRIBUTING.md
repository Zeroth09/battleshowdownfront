# 🤝 Contributing ke Battle Showdown

Terima kasih sudah tertarik untuk berkontribusi ke project Battle Showdown! 🎮✨

## 📋 Table of Contents

- [Cara Berkontribusi](#cara-berkontribusi)
- [Setup Development](#setup-development)
- [Guidelines](#guidelines)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Report Bugs](#report-bugs)
- [Request Features](#request-features)

## 🚀 Cara Berkontribusi

### 1. Fork Repository
1. Buka [Battle Showdown Repository](https://github.com/username/battle-showdown)
2. Klik tombol "Fork" di pojok kanan atas
3. Clone repository yang sudah di-fork ke local machine

```bash
git clone https://github.com/YOUR_USERNAME/battle-showdown.git
cd battle-showdown
```

### 2. Setup Development Environment
```bash
# Install dependencies
npm install

# Setup environment variables
cp env.local.example env.local
# Edit env.local sesuai kebutuhan

# Jalankan development server
npm run dev
```

### 3. Buat Branch Baru
```bash
# Buat dan switch ke branch baru
git checkout -b feature/AmazingFeature

# Atau untuk bug fix
git checkout -b fix/BugDescription
```

## 🛠️ Setup Development

### Prerequisites
- Node.js 18+
- npm atau yarn
- Git
- MongoDB (untuk backend)

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env dengan konfigurasi yang sesuai

# Jalankan backend
npm run dev
```

### Database Setup
```bash
# Install MongoDB
# Atau gunakan MongoDB Atlas untuk cloud

# Setup connection string di .env
MONGODB_URI=mongodb://localhost:27017/battle-showdown
```

## 📝 Guidelines

### Commit Messages
Gunakan [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
# Format
<type>[optional scope]: <description>

# Examples
feat: add new battle mode
fix(auth): resolve login issue
docs: update README
style: format code with prettier
refactor: simplify game logic
test: add unit tests for battle
chore: update dependencies
```

### Branch Naming
```bash
# Feature branches
feature/user-authentication
feature/battle-system
feature/admin-panel

# Bug fix branches
fix/login-error
fix/game-crash
fix/ui-responsive

# Documentation branches
docs/api-documentation
docs/user-guide
docs/deployment
```

## 🎨 Code Style

### Frontend (Next.js + TypeScript)
```typescript
// Gunakan TypeScript strict mode
// Prefer functional components dengan hooks
// Gunakan proper typing untuk semua props dan state

interface PlayerProps {
  id: string;
  name: string;
  team: 'red' | 'white';
  score: number;
}

const Player: React.FC<PlayerProps> = ({ id, name, team, score }) => {
  return (
    <div className="player-card">
      <h3>{name}</h3>
      <span className={`team-${team}`}>{team}</span>
      <p>Score: {score}</p>
    </div>
  );
};
```

### Backend (Node.js + Express)
```javascript
// Gunakan ES6+ syntax
// Prefer async/await over callbacks
// Gunakan proper error handling

const createPlayer = async (req, res) => {
  try {
    const { name, team } = req.body;
    
    // Validation
    if (!name || !team) {
      return res.status(400).json({ 
        error: 'Name and team are required' 
      });
    }
    
    const player = new Player({ name, team });
    await player.save();
    
    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};
```

### Styling (Tailwind CSS)
```jsx
// Gunakan utility classes dari Tailwind
// Prefer responsive design
// Gunakan consistent spacing

<div className="
  bg-white 
  rounded-lg 
  shadow-lg 
  p-6 
  m-4 
  hover:shadow-xl 
  transition-shadow 
  duration-300
  md:p-8 
  lg:p-10
">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">
    Battle Title
  </h2>
  <p className="text-gray-600 leading-relaxed">
    Battle description goes here
  </p>
</div>
```

## 🧪 Testing

### Frontend Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=Player.test.tsx
```

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Guidelines
- Tulis test untuk setiap fitur baru
- Test coverage minimal 80%
- Gunakan descriptive test names
- Test happy path dan error cases
- Mock external dependencies

```typescript
// Example test
describe('Player Component', () => {
  it('should render player name correctly', () => {
    const player = { name: 'John', team: 'red', score: 100 };
    render(<Player {...player} />);
    
    expect(screen.getByText('John')).toBeInTheDocument();
  });
  
  it('should display correct team color', () => {
    const player = { name: 'John', team: 'red', score: 100 };
    render(<Player {...player} />);
    
    const teamElement = screen.getByText('red');
    expect(teamElement).toHaveClass('team-red');
  });
});
```

## 🔄 Pull Request Process

### 1. Update Branch
```bash
# Sync dengan main branch
git fetch origin
git rebase origin/main

# Resolve conflicts jika ada
git add .
git rebase --continue
```

### 2. Test Changes
```bash
# Run all tests
npm test

# Check linting
npm run lint

# Build project
npm run build
```

### 3. Commit Changes
```bash
# Add all changes
git add .

# Commit dengan conventional format
git commit -m "feat: add new battle mode"

# Push ke remote
git push origin feature/AmazingFeature
```

### 4. Create Pull Request
1. Buka repository di GitHub
2. Klik "Compare & pull request"
3. Isi template PR dengan lengkap
4. Assign reviewers
5. Link issues jika ada

### PR Template
```markdown
## 📝 Description
Jelaskan perubahan yang dibuat

## 🎯 Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## 🧪 Testing
- [ ] Unit tests passed
- [ ] Integration tests passed
- [ ] Manual testing completed

## 📸 Screenshots
Tambahkan screenshot jika ada perubahan UI

## 🔗 Related Issues
Closes #123
```

## 🐛 Report Bugs

### Bug Report Template
```markdown
## 🐛 Bug Description
Jelaskan bug yang ditemukan

## 🔍 Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## ✅ Expected Behavior
Apa yang seharusnya terjadi

## ❌ Actual Behavior
Apa yang sebenarnya terjadi

## 📱 Environment
- OS: [e.g. Windows 10, macOS, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 22]

## 📸 Screenshots
Tambahkan screenshot jika ada

## 📋 Additional Context
Informasi tambahan yang relevan
```

## 💡 Request Features

### Feature Request Template
```markdown
## 💡 Feature Description
Jelaskan fitur yang diinginkan

## 🎯 Use Case
Kapan dan bagaimana fitur ini akan digunakan

## 💭 Proposed Solution
Bagaimana fitur ini sebaiknya diimplementasikan

## 🔄 Alternatives Considered
Alternatif lain yang sudah dipertimbangkan

## 📱 Additional Context
Informasi tambahan yang relevan
```

## 🏷️ Labels

Gunakan labels yang sesuai untuk issue dan PR:

- `bug` - Bug reports
- `enhancement` - Feature requests
- `documentation` - Documentation updates
- `good first issue` - Good for beginners
- `help wanted` - Need help
- `priority: high` - High priority
- `priority: low` - Low priority
- `frontend` - Frontend changes
- `backend` - Backend changes
- `ui/ux` - UI/UX improvements

## 📚 Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Tools
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Jest](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)

## 🎉 Recognition

Setiap contributor akan diakui di:
- README.md contributors section
- Release notes
- Project documentation

## 📞 Get Help

Jika ada pertanyaan atau butuh bantuan:

- Buka issue dengan label `question`
- Join Discord server (jika ada)
- Email maintainer
- Comment di PR atau issue

---

**Terima kasih sudah berkontribusi ke Battle Showdown! 🎮✨**

*Bersama kita buat game yang lebih keren dan fun!* 🚀 