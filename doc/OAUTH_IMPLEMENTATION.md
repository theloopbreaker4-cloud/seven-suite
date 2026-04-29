# OAuth2 Social Login Implementation

**Project:** Seven
**Author:** TheLoopBreaker (prgera)
**Date:** 2025-11-01
**Version:** 1.0

## 📋 Overview

This document describes the implementation of OAuth2 social login for Google, Facebook, GitHub, and Discord in the Seven project.

## 🎯 What Was Implemented

### Backend (NestJS)

1. **Passport Strategies** - OAuth2 authentication strategies for 4 providers
2. **User Schema** - Extended user model to support OAuth profiles
3. **Auth Service** - Methods for OAuth user validation and creation
4. **API Endpoints** - 8 new endpoints for OAuth authentication
5. **Environment Configuration** - OAuth credentials in .env

### Providers Supported

- ✅ **Google OAuth2.0** - Most popular, email + profile
- ✅ **Facebook OAuth2.0** - Social login, email + profile
- ✅ **GitHub OAuth2.0** - Developer-focused, email + profile
- ✅ **Discord OAuth2.0** - Gaming community, email + username

## 📁 Files Created/Modified

### New Files

```
backend/src/app/auth/strategies/
├── google.strategy.ts      # Google OAuth2 strategy
├── facebook.strategy.ts    # Facebook OAuth2 strategy
├── github.strategy.ts      # GitHub OAuth2 strategy
└── discord.strategy.ts     # Discord OAuth2 strategy

doc/
└── OAUTH_IMPLEMENTATION.md # This file
```

### Modified Files

```
backend/src/app/
├── schemas/user.schema.ts       # Added OAuth fields
├── models/user.model.ts         # Added OAuth types
├── services/user.service.ts     # Added OAuth methods
├── auth/auth.service.ts         # Added validateOAuthUser()
├── auth/auth.controller.ts      # Added OAuth endpoints
├── auth/auth.module.ts          # Registered OAuth strategies
└── .env.example                 # Added OAuth credentials
```

## 🔧 Technical Implementation

### 1. User Schema Updates

Added OAuth fields to support social login:

```typescript
// backend/src/app/schemas/user.schema.ts
{
  password: { type: String, required: false }, // Optional for OAuth
  provider: { type: String, enum: ['local', 'google', 'facebook', 'github', 'discord'] },
  providerId: { type: String, required: false },
  picture: { type: String, required: false }, // Profile picture URL
}
```

### 2. OAuth Flow

```
User clicks "Login with Google"
  ↓
Frontend redirects to: GET /api/v1/auth/google
  ↓
Backend redirects to Google OAuth page
  ↓
User authorizes app
  ↓
Google redirects to: GET /api/v1/auth/google/callback
  ↓
Backend validates user:
  - Finds user by providerId
  - Or finds by email and links account
  - Or creates new user
  ↓
Backend generates JWT token
  ↓
Redirects to: http://localhost:4200/auth/callback?token=JWT_TOKEN
  ↓
Frontend saves token and logs in user
```

### 3. API Endpoints

#### Google OAuth
```
GET /api/v1/auth/google           # Initiates Google OAuth
GET /api/v1/auth/google/callback  # Google callback handler
```

#### Facebook OAuth
```
GET /api/v1/auth/facebook           # Initiates Facebook OAuth
GET /api/v1/auth/facebook/callback  # Facebook callback handler
```

#### GitHub OAuth
```
GET /api/v1/auth/github           # Initiates GitHub OAuth
GET /api/v1/auth/github/callback  # GitHub callback handler
```

#### Discord OAuth
```
GET /api/v1/auth/discord           # Initiates Discord OAuth
GET /api/v1/auth/discord/callback  # Discord callback handler
```

### 4. User Service Methods

```typescript
// Find user by OAuth provider
async findByProviderId(provider: string, providerId: string): Promise<User | null>

// Create user from OAuth profile
async createFromOAuth(oauthProfile: {
  provider: string;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
}): Promise<User>
```

### 5. Auth Service Methods

```typescript
// Validate or create OAuth user
async validateOAuthUser(oauthProfile: {
  provider: string;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
}): Promise<{ access_token: string; user: any }>
```

## 🔐 OAuth Credentials Setup

### Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create new project or select existing
3. Enable **Google+ API**
4. Create **OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/v1/auth/google/callback`
5. Copy **Client ID** and **Client Secret**

### Facebook OAuth2

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create new app
3. Add **Facebook Login** product
4. Settings → Basic
   - Copy **App ID** and **App Secret**
5. Settings → Facebook Login
   - Valid OAuth Redirect URIs: `http://localhost:3000/api/v1/auth/facebook/callback`

### GitHub OAuth2

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in details:
   - Homepage URL: `http://localhost:4200`
   - Authorization callback URL: `http://localhost:3000/api/v1/auth/github/callback`
4. Copy **Client ID** and generate **Client Secret**

### Discord OAuth2

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Go to **OAuth2** section
4. Add redirect URL: `http://localhost:3000/api/v1/auth/github/callback`
5. Copy **Client ID** and **Client Secret**

## 📝 Environment Configuration

Add to `backend/.env`:

```env
# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Facebook OAuth2
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/v1/auth/facebook/callback

# GitHub OAuth2
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback

# Discord OAuth2
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_CALLBACK_URL=http://localhost:3000/api/v1/auth/discord/callback
```

## 🎨 Frontend Integration (TODO)

### Login Buttons

```html
<!-- Google Login -->
<a href="http://localhost:3000/api/v1/auth/google" class="oauth-button google">
  <img src="assets/google-icon.svg" alt="Google">
  Sign in with Google
</a>

<!-- Facebook Login -->
<a href="http://localhost:3000/api/v1/auth/facebook" class="oauth-button facebook">
  <img src="assets/facebook-icon.svg" alt="Facebook">
  Sign in with Facebook
</a>

<!-- GitHub Login -->
<a href="http://localhost:3000/api/v1/auth/github" class="oauth-button github">
  <img src="assets/github-icon.svg" alt="GitHub">
  Sign in with GitHub
</a>

<!-- Discord Login -->
<a href="http://localhost:3000/api/v1/auth/discord" class="oauth-button discord">
  <img src="assets/discord-icon.svg" alt="Discord">
  Sign in with Discord
</a>
```

### Callback Handler

Create `frontend/src/app/pages/auth-callback/auth-callback.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: '<div>Processing login...</div>'
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        localStorage.setItem('access_token', token);
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/signin']);
      }
    });
  }
}
```

Add route in `app-routing.module.ts`:

```typescript
{
  path: 'auth/callback',
  component: AuthCallbackComponent
}
```

## 🧪 Testing

### Test Google OAuth

1. Set up Google OAuth credentials
2. Add to `.env`
3. Restart backend: `npm run start:dev`
4. Navigate to: `http://localhost:3000/api/v1/auth/google`
5. Authorize with Google account
6. Should redirect to frontend with token

### Test Other Providers

Same steps for Facebook, GitHub, Discord:
- `http://localhost:3000/api/v1/auth/facebook`
- `http://localhost:3000/api/v1/auth/github`
- `http://localhost:3000/api/v1/auth/discord`

## 🔒 Security Considerations

1. **HTTPS in Production** - Always use HTTPS for OAuth callbacks
2. **Environment Variables** - Never commit OAuth secrets to git
3. **Token Expiration** - JWT tokens expire in 1 hour
4. **User Validation** - Always verify email from OAuth provider
5. **CORS** - Properly configured for frontend domain

## 📦 Packages Installed

```json
{
  "dependencies": {
    "passport-google-oauth20": "^2.0.0",
    "passport-facebook": "^3.0.0",
    "passport-github2": "^0.1.12",
    "passport-discord": "^0.1.4"
  },
  "devDependencies": {
    "@types/passport-google-oauth20": "^2.0.14",
    "@types/passport-facebook": "^3.0.3",
    "@types/passport-github2": "^1.2.9"
  }
}
```

## ✅ Verification Checklist

- [x] Installed OAuth packages
- [x] Created 4 OAuth strategies
- [x] Updated user schema with OAuth fields
- [x] Added OAuth methods to UserService
- [x] Added validateOAuthUser to AuthService
- [x] Added 8 OAuth endpoints to AuthController
- [x] Registered strategies in AuthModule
- [x] Updated .env.example with OAuth credentials
- [x] Created comprehensive documentation
- [ ] Frontend OAuth buttons (TODO)
- [ ] Frontend callback handler (TODO)
- [ ] Test with real OAuth credentials (TODO)

## 🚀 Next Steps

1. **Get OAuth Credentials** - Register apps with Google, Facebook, GitHub, Discord
2. **Update .env** - Add real credentials
3. **Frontend Implementation** - Create OAuth login buttons
4. **Testing** - Test each provider thoroughly
5. **Production Setup** - Update callback URLs for production domain

## 📞 Support

For issues or questions:
- Check backend logs: `npm run start:dev`
- Verify OAuth credentials in `.env`
- Ensure callback URLs match exactly

## 📚 References

- [Passport.js Documentation](http://www.passportjs.org/)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Google OAuth2 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login)
- [GitHub OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Discord OAuth2](https://discord.com/developers/docs/topics/oauth2)

---

**Status:** ✅ Backend Implementation Complete
**Frontend:** 🔄 Pending Implementation
