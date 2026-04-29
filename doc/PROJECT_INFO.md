# Seven Project - Technical Information

**Project Name**: Seven
**Version**: 1.3.2
**License**: ISC
**Author**: TheLoopBreaker (prgera)
**Email**: the.loop.breaker4@gmail.com
**Created**: 2025-10-26
**Status**: Active Development

---

## Project Overview

Seven is a modern full-stack web application built with Angular and NestJS, featuring real-time communication capabilities through WebSocket, JWT-based authentication, and MongoDB integration.

## Technology Stack

### Frontend
- **Framework**: Angular 20.0.4 (LTS)
- **UI Library**: Angular Material 20.0.3
- **State Management**: RxJS 7.8.0
- **Language**: TypeScript 5.8.3
- **Real-time**: Socket.IO Client 4.8.1
- **SSR**: Angular Universal (Express)
- **Styling**: LESS preprocessor

### Backend
- **Framework**: NestJS 11.1.3 (LTS)
- **Database**: MongoDB with Mongoose 8.9.5
- **Authentication**: Passport.js (JWT + Local)
- **Real-time**: Socket.IO 4.8.1
- **API Docs**: Swagger UI
- **Security**: bcrypt (password hashing)
- **Language**: TypeScript 5.8.3

### Development Tools
- **Task Runner**: Gulp 5.0.0
- **Code Style**: Prettier 3.4.2
- **Linting**: ESLint 9.20.0
- **Testing**: Jest 29.7.0 (Backend), Karma/Jasmine (Frontend)
- **Process Manager**: PM2 (Production)

## Features

### Authentication
- ✅ JWT token-based authentication
- ✅ Passport.js integration (Local + JWT strategies)
- ✅ bcrypt password hashing (10 rounds)
- ✅ Auth guards for route protection
- ⏳ Refresh tokens (planned)
- ⏳ Email verification (planned)
- ⏳ Password reset (planned)

### Real-time Communication
- ✅ WebSocket server with Socket.IO
- ✅ Global chat functionality
- ✅ Private messaging
- ✅ Chat rooms support
- ✅ Typing indicators
- ✅ Real-time notifications
- ✅ User presence tracking
- ✅ Data subscriptions

### API
- ✅ RESTful API structure
- ✅ Versioned endpoints (/api/v1)
- ✅ Swagger documentation
- ✅ Request/response logging
- ✅ Input validation (class-validator)
- ✅ Error handling

### Code Quality
- ✅ Full JSDoc documentation
- ✅ File headers with author info
- ✅ ESLint configuration
- ✅ Prettier code formatting
- ✅ Consistent code style
- ✅ TypeScript strict mode

## Project Structure

```
seven/
├── frontend/                     # Angular SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/      # UI components
│   │   │   ├── pages/           # Route pages
│   │   │   ├── services/        # Angular services
│   │   │   ├── directives/      # Custom directives
│   │   │   └── enums/           # Shared enumerations
│   │   ├── assets/              # Static assets
│   │   └── environments/        # Environment configs
│   └── package.json
│
├── backend/                      # NestJS API
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/            # Authentication module
│   │   │   ├── websockets/      # WebSocket gateway
│   │   │   ├── config/          # App configuration
│   │   │   ├── controllers/     # HTTP controllers
│   │   │   ├── services/        # Business logic
│   │   │   ├── models/          # Data models
│   │   │   ├── schemas/         # Mongoose schemas
│   │   │   ├── interfaces/      # TypeScript interfaces
│   │   │   ├── middlewares/     # Express middleware
│   │   │   ├── interceptors/    # NestJS interceptors
│   │   │   └── pipes/           # Custom pipes
│   │   └── main.ts              # Entry point
│   ├── test/                    # E2E tests
│   └── package.json
│
├── shared/                       # Shared code
│   └── enums/                   # Shared enumerations
│
├── .github/                     # GitHub templates
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/                        # Documentation
│   ├── README.md
│   ├── CHANGELOG.md
│   ├── WEBSOCKET_GUIDE.md
│   └── CONTRIBUTING.md
│
├── gulpfile.js                  # Gulp tasks
├── package.json                 # Root package
├── .prettierrc                  # Prettier config
├── .eslintrc.json              # ESLint config
└── LICENSE                      # ISC License
```

## Architecture Patterns

### Backend
- **Module-based architecture**: Feature modules (Auth, User, WebSocket)
- **Dependency Injection**: NestJS IoC container
- **Middleware pipeline**: Context, logging, validation
- **Repository pattern**: Mongoose models/schemas
- **Service layer**: Business logic separation

### Frontend
- **Component-based**: Reusable Angular components
- **Smart/Dumb components**: Container/Presentational pattern
- **Service layer**: API and WebSocket services
- **Reactive programming**: RxJS observables
- **Lazy loading**: Route-based code splitting

## Database Schema

### User Collection
```typescript
{
  name: String (required)
  email: String (required, unique)
  password: String (hashed, optional)
  createdAt: Date
  updatedAt: Date
}
```

### Chat Messages (In-memory)
```typescript
{
  id: String
  clientId: String
  username: String
  message: String
  roomId: String (optional)
  timestamp: ISO String
  edited: Boolean
  editedAt: ISO String (optional)
}
```

### Notifications (In-memory)
```typescript
{
  id: String
  from: String
  targetClientId: String
  title: String
  message: String
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: ISO String
  read: Boolean
  readAt: ISO String (optional)
}
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Users
- `GET /api/v1/users` - Get all users (TODO)
- `GET /api/v1/users/:id` - Get user by ID (TODO)

### WebSocket Events
- `chat:message` - Send/receive chat messages
- `chat:private` - Private messaging
- `room:join` - Join chat room
- `room:leave` - Leave chat room
- `notification:send` - Send notification
- See [WEBSOCKET_GUIDE.md](WEBSOCKET_GUIDE.md) for full list

## Environment Variables

### Backend (.env)
```env
PORT=3000
API_PATH=api
API_VERSION=v1
DATABASE_HOST=mongodb://localhost:27017/
DATABASE_NAME=seven_db
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

## Development Workflow

1. **Code**: Write code following style guide
2. **Format**: Run `npm run format`
3. **Lint**: Run `npm run lint`
4. **Test**: Run tests locally
5. **Commit**: Use meaningful commit messages
6. **Push**: Push to feature branch
7. **PR**: Create pull request with template

## Testing Strategy

### Backend
- **Unit tests**: Jest with ts-jest
- **E2E tests**: Supertest
- **Coverage goal**: > 80%

### Frontend
- **Unit tests**: Karma + Jasmine
- **E2E tests**: Planned (Cypress)
- **Coverage goal**: > 80%

## Deployment

### Production Checklist
- [ ] Set strong JWT_SECRET (min 32 chars)
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up MongoDB Atlas/production DB
- [ ] Configure environment variables
- [ ] Build optimized bundles
- [ ] Set up PM2 for backend
- [ ] Configure nginx/reverse proxy
- [ ] Set up SSL certificates
- [ ] Enable rate limiting
- [ ] Configure logging service
- [ ] Set up monitoring

### Recommended Hosting
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: Heroku, DigitalOcean, AWS EC2
- **Database**: MongoDB Atlas, AWS DocumentDB

## Performance Optimizations

### Frontend
- Lazy loading routes
- OnPush change detection strategy
- TrackBy in ngFor loops
- Image optimization
- Bundle size optimization

### Backend
- MongoDB indexing
- Connection pooling
- Caching strategies
- Response compression
- Load balancing

## Security Measures

- ✅ CORS configuration
- ✅ Helmet.js headers
- ✅ Input validation
- ✅ XSS protection
- ✅ SQL injection prevention
- ✅ Password hashing
- ✅ JWT token expiration
- ⏳ Rate limiting (planned)
- ⏳ CSRF protection (planned)

## Roadmap

### Phase 1 (Current)
- [x] Basic authentication
- [x] WebSocket implementation
- [x] Code documentation
- [x] Development tools setup

### Phase 2 (Q1 2025)
- [ ] Complete user CRUD
- [ ] Refresh tokens
- [ ] Email verification
- [ ] Password reset
- [ ] Role-based access control

### Phase 3 (Q2 2025)
- [ ] Unit test coverage > 80%
- [ ] E2E test suite
- [ ] CI/CD pipeline
- [ ] Docker containerization

### Phase 4 (Q3 2025)
- [ ] Production deployment
- [ ] Monitoring & logging
- [ ] Performance optimization
- [ ] Documentation site

## Known Issues

See [GitHub Issues](https://github.com/your-username/seven/issues) for current bugs and feature requests.

## Support

- **Email**: the.loop.breaker4@gmail.com
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## License

ISC License - See [LICENSE](LICENSE) for details.

---

**Last Updated**: 2025-10-26
**Maintained by**: TheLoopBreaker (prgera)
