# OAuth Setup Guide for VibeSync

This guide will help you set up OAuth authentication for Google, GitHub, and Spotify in your VibeSync application.

## Prerequisites

- Google Cloud Console account
- GitHub account
- Spotify Developer account
- Your application running on `http://localhost:8080` (backend) and `http://localhost:5173` (frontend)

## 1. Google OAuth Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (for user profile access)

### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted
4. Set Application type to "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:8080/login/oauth2/code/google`
6. Copy the Client ID and Client Secret

### Step 3: Update application.properties
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
```

## 2. GitHub OAuth Setup

### Step 1: Create a GitHub OAuth App
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: VibeSync
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:8080/login/oauth2/code/github`
4. Click "Register application"
5. Copy the Client ID and Client Secret

### Step 2: Update application.properties
```properties
spring.security.oauth2.client.registration.github.client-id=YOUR_GITHUB_CLIENT_ID
spring.security.oauth2.client.registration.github.client-secret=YOUR_GITHUB_CLIENT_SECRET
```

## 3. Spotify OAuth Setup

### Step 1: Create a Spotify App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create an App"
3. Fill in:
   - App name: VibeSync
   - App description: Social media app for music lovers
   - Redirect URI: `http://localhost:8080/login/oauth2/code/spotify`
4. Click "Save"
5. Copy the Client ID and Client Secret

### Step 2: Update application.properties
```properties
spring.security.oauth2.client.registration.spotify.client-id=YOUR_SPOTIFY_CLIENT_ID
spring.security.oauth2.client.registration.spotify.client-secret=YOUR_SPOTIFY_CLIENT_SECRET
```

## 4. Update Application Properties

Replace the placeholder values in `backend/src/main/resources/application.properties`:

```properties
# Google OAuth
spring.security.oauth2.client.registration.google.client-id=your-actual-google-client-id
spring.security.oauth2.client.registration.google.client-secret=your-actual-google-client-secret

# GitHub OAuth
spring.security.oauth2.client.registration.github.client-id=your-actual-github-client-id
spring.security.oauth2.client.registration.github.client-secret=your-actual-github-client-secret

# Spotify OAuth
spring.security.oauth2.client.registration.spotify.client-id=your-actual-spotify-client-id
spring.security.oauth2.client.registration.spotify.client-secret=your-actual-spotify-client-secret
```

## 5. Test the OAuth Flow

1. Start your backend server: `./mvnw spring-boot:run`
2. Start your frontend: `npm run dev`
3. Go to `http://localhost:5173`
4. Click any of the OAuth buttons (Google, GitHub, or Spotify)
5. You should be redirected to the provider's login page
6. After authentication, you should be redirected back to your app and logged in

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**
   - Make sure the redirect URIs in your OAuth app settings exactly match the ones in `application.properties`

2. **"invalid_client" error**
   - Check that your client ID and secret are correct

3. **CORS errors**
   - Make sure your backend is running on `http://localhost:8080` and frontend on `http://localhost:5173`

4. **OAuth flow not working**
   - Check the browser console for errors
   - Check the backend logs for OAuth-related errors

### Debug Tips:

- Add logging to `OAuth2AuthenticationSuccessHandler` to see what's happening
- Check browser network tab to see OAuth requests
- Verify that your OAuth apps are properly configured with the correct redirect URIs

## Security Notes

- Never commit your actual client secrets to version control
- Use environment variables in production instead of hardcoding secrets
- Regularly rotate your OAuth client secrets
- Set up proper CORS policies for production domains

## Production Deployment

When deploying to production:

1. Update all redirect URIs to your production domain
2. Use environment variables for client secrets
3. Set up proper HTTPS
4. Configure CORS for your production domain
5. Update OAuth app settings with production URLs