# Contributing to PolyOne

Thank you for your interest in contributing to PolyOne! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots if applicable

### Suggesting Features

We welcome feature suggestions! Please:
- Check if the feature has already been requested
- Provide a clear use case
- Explain the expected behavior
- Consider implementation details

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Write/update tests
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
7. Push to the branch (`git push origin feature/AmazingFeature`)
8. Open a Pull Request

## 📝 Code Style

### JavaScript/TypeScript
- Use ES6+ features
- Follow Airbnb style guide
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### React Components
- Use functional components with hooks
- PropTypes or TypeScript interfaces
- Keep components under 200 lines
- Extract reusable logic into custom hooks

### Commits
Follow conventional commits format:
```
type(scope): description

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(dashboard): add chain metrics visualization
fix(api): resolve authentication token expiration issue
docs(readme): update installation instructions
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Writing Tests
- Write tests for new features
- Update tests for bug fixes
- Aim for >80% code coverage
- Use descriptive test names

## 🔍 Code Review Process

1. Automated checks must pass (linting, tests, build)
2. At least one maintainer approval required
3. Address all review comments
4. Keep PRs focused and reasonably sized
5. Update documentation as needed

## 📚 Documentation

- Update README.md for user-facing changes
- Update API.md for API changes
- Add JSDoc comments for functions
- Update CHANGELOG.md

## 🏗️ Development Setup

```bash
# Install dependencies
npm install

# Set up git hooks
npm run prepare

# Start development servers
npm run dev
```

## 🐛 Debugging

- Use debugger statements
- Check browser console
- Review server logs
- Use React DevTools

## 🚀 Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Create GitHub release
6. Deploy to production

## 📞 Getting Help

- GitHub Issues for bugs/features
- Discussions for questions
- Discord for community chat
- Email: dev@polyone.io

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help create a welcoming environment

## 🎓 Resources

- [Polygon CDK Docs](https://wiki.polygon.technology/docs/cdk/overview)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Docker Documentation](https://docs.docker.com/)

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eligible for contributor badges

Thank you for contributing to PolyOne! 🎉

