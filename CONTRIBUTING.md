# Contributing to Mini ERP/CRM Operations Portal

Thank you for considering contributing to this project!

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rahul03ll/mini-erp-crm.git
   cd mini-erp-crm
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your DATABASE_URL and JWT_SECRET
   npx prisma db push
   npm run db:seed
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Set VITE_API_URL=http://localhost:3001
   npm run dev
   ```

## Code Style

- Use TypeScript for all new code
- Follow existing code conventions
- Use Prettier for formatting
- Write meaningful commit messages

## Commit Message Format

```
type(scope): subject

body (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/updates
- `chore`: Build/tooling changes

**Examples:**
```
feat(auth): add password reset functionality
fix(challan): prevent negative stock on confirm
docs(readme): update deployment instructions
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Create a pull request with clear description
6. Wait for review

## Testing

- Run backend tests: `npm test` (when available)
- Run frontend tests: `npm test` (when available)
- Manual testing of all affected features

## Questions?

Open an issue for any questions or concerns.
