# Contributing to Seven Project

First off, thank you for considering contributing to Seven! It's people like you that make Seven such a great project.

## Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title** for the issue
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples** to demonstrate the steps
* **Describe the behavior you observed** and what you expected
* **Include screenshots** if applicable
* **Mention the environment** (OS, Node version, npm version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a detailed description** of the suggested enhancement
* **Provide specific examples** to demonstrate the feature
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Follow the TypeScript styleguide (ESLint + Prettier)
* Include JSDoc comments for new functions/classes
* Add file headers to new files
* Update documentation if needed
* Write meaningful commit messages

## Development Process

### Setup Development Environment

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/seven.git`
3. Install dependencies: `npm run install:all`
4. Create a branch: `git checkout -b feature/my-feature`

### Code Style

* We use **Prettier** for code formatting
* We use **ESLint** for linting
* Run `npm run format` before committing
* Run `npm run lint` to check for issues

### File Headers

All TypeScript files should include:

```typescript
/**
 * Project: Seven
 * Pseudonym: prgera
 * @author YourName <your.email@example.com>
 * File: filename.ts
 * Description: Brief description of the file
 * Created: YYYY-MM-DD
 */
```

### Commit Messages

* Use present tense ("Add feature" not "Added feature")
* Use imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters
* Reference issues and pull requests when relevant

Examples:
```
Add WebSocket authentication support
Fix user login validation bug
Update README with installation steps
```

### Testing

* Write tests for new features
* Ensure all tests pass: `npm run test`
* Backend tests: `cd backend && npm run test`
* Frontend tests: `cd frontend && npm run test`

### Pull Request Process

1. Update the README.md or relevant documentation
2. Update the CHANGELOG.md with details of changes
3. The PR will be merged once you have the sign-off of maintainers

## Project Structure

```
newProjectAngular.io/
├── frontend/     # Angular application
├── backend/      # NestJS application
├── shared/       # Shared code between frontend/backend
└── docs/         # Documentation
```

## Additional Notes

### Issue and Pull Request Labels

* `bug` - Something isn't working
* `enhancement` - New feature or request
* `documentation` - Documentation improvements
* `good first issue` - Good for newcomers
* `help wanted` - Extra attention is needed

## Questions?

Feel free to contact the project maintainer:
* Email: the.loop.breaker4@gmail.com

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

Thank you for contributing! 🎉
