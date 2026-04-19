# VibeSync Comprehensive Profile Expansion - Testing Guide

## Quick Testing Commands

### 1. Test Profile Update (Comprehensive)

**Save comprehensive profile with all fields:**
```bash
curl -X POST http://localhost:8080/api/profile/update-comprehensive \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alex Sharma",
    "email": "alex@example.com",
    "phone": "+1 (555) 123-4567",
    "location": "San Francisco, USA",
    "dateOfBirth": "1995-06-15",
    "interests": "AI, Startups, Music Production, Data Science",
    "youtubeSubscriptions": "3Blue1Brown, Veritasium, Kurzgesagt",
    "spotifyArtists": "The Weeknd, J. Cole, Arctic Monkeys",
    "bio": "Full-stack developer passionate about building AI-powered products. Love indie music and hiking.",
    "vibeTags": "coding, AI, music, hiking, entrepreneurship",
    "hobbies": "Photography, Gaming, Music Production, Cooking",
    "musicTaste": "Indie, Electronic, Hip-hop, Alternative",
    "learningGoals": "Advanced Python, Machine Learning, DevOps, UI Design",
    "profilePicUrl": "https://i.imgur.com/example.jpg"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Profile updated completely!"
}
```

### 2. Fetch Full Profile

**Get all profile data:**
```bash
curl -X GET http://localhost:8080/api/profile/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "id": 1,
  "fullName": "Alex Sharma",
  "email": "alex@example.com",
  "phone": "+1 (555) 123-4567",
  "location": "San Francisco, USA",
  "dateOfBirth": "1995-06-15",
  "interests": "AI, Startups, Music Production, Data Science",
  "youtubeSubscriptions": "3Blue1Brown, Veritasium, Kurzgesagt",
  "spotifyArtists": "The Weeknd, J. Cole, Arctic Monkeys",
  "bio": "Full-stack developer passionate about building AI-powered products...",
  "vibeTags": "coding, AI, music, hiking, entrepreneurship",
  "hobbies": "Photography, Gaming, Music Production, Cooking",
  "musicTaste": "Indie, Electronic, Hip-hop, Alternative",
  "learningGoals": "Advanced Python, Machine Learning, DevOps, UI Design",
  "profilePicUrl": "https://i.imgur.com/example.jpg"
}
```

### 3. Get Hybrid Matches

**Fetch matching profiles using comprehensive algorithm:**
```bash
curl -X GET http://localhost:8080/api/profile/matches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (Top 10 Matches):**
```json
[
  {
    "userId": 42,
    "fullName": "Jordan Chen",
    "bio": "Indie musician and developer...",
    "vibeTags": "music, coding, travel",
    "distance": 0.85  (hybrid score: 0-1, higher is better)
  },
  {
    "userId": 17,
    "fullName": "Sam Rodriguez",
    "bio": "AI researcher, coffee enthusiast...",
    "vibeTags": "AI, research, coffee",
    "distance": 0.72
  }
]
```

---

## OAuth Testing

### Test Google OAuth with Enhanced Data

**Login via Google OAuth:**
1. Navigate to `http://localhost:5173/auth/google`
2. Authenticate with Google account
3. Check Profile tab for auto-populated fields:
   - ✓ Full Name (from "name")
   - ✓ Email (from "email")
   - ✓ Location (from "locale")
   - ✓ DOB (from "birthdate" if available)

### Test GitHub OAuth with Enhanced Data

**Login via GitHub OAuth:**
1. Navigate to `http://localhost:5173/auth/github`
2. Authenticate with GitHub account
3. Check Profile tab for auto-populated fields:
   - ✓ Full Name (from "name")
   - ✓ Email (from "email")
   - ✓ Location (from GitHub profile)
   - ✓ Interests (from "bio" field)

### Test Multi-Provider Connection

**Scenario:** User has already signed up with Google, then signs in with GitHub
1. Login with Google OAuth
2. Edit profile → verify `linkedProviders` field should show "google"
3. In new browser tab, login with GitHub OAuth (same email)
4. Profile appears with both providers linked
5. Check database: `linkedProviders = "google,github"`

---

## Frontend Testing Checklist

### Profile Edit Form Tests
- [ ] All 35+ input fields render properly
- [ ] Bio field shows character count (max 4000)
- [ ] Date picker works for dateOfBirth field
- [ ] Form is scrollable on mobile (max-height: 70vh)
- [ ] Phone field accepts various formats
- [ ] "Save Profile" button is disabled while saving
- [ ] Cancel button closes edit form without saving

### Profile Display Tests
- [ ] All populated fields display with labels
- [ ] Emojis render correctly (🎵, 🎯, 📚, 💡, 🎧, 📺, 📍)
- [ ] Profile picture loads from URL or falls back to avatar
- [ ] Tag pills render for vibeTags with correct styling
- [ ] Bio text wraps properly with whitespace preserved
- [ ] Location shows with location emoji

### Data Persistence Tests
- [ ] After saving, refresh page → data persists
- [ ] After OAuth login, new fields populate correctly
- [ ] After editing one field, others remain unchanged
- [ ] Empty optional fields don't display in read-only view

### Matching Tests
- [ ] Create profile A with specific interests (Photography, Python, Jazz)
- [ ] Create profile B with overlapping interests (Photography, Reading, Rock)
- [ ] Create profile C with no common interests
- [ ] Check matches for profile A:
  - Profile B should rank higher than C
  - Difference should be visible in match scores
- [ ] Edit profile A to add more common interests with B
- [ ] Match score for B should improve

---

## Database Migration Tests

### Verify New Columns Exist
```sql
-- Check User table new columns
SELECT 
  date_of_birth, phone, location, interests, 
  youtube_subscriptions, spotify_artists, linked_providers
FROM users 
LIMIT 1;

-- Check VibeProfile new columns
SELECT 
  comprehensive_interests_vector, enriched_matching_text,
  hobbies, music_taste, learning_goals, match_score, last_updated
FROM vibe_profiles 
LIMIT 1;
```

### Verify Data Types
```sql
-- User table
\d users;
-- Verify: date_of_birth (date), phone (varchar), location (varchar), 
--          interests (text), youtube_subscriptions (text), 
--          spotify_artists (text), linked_providers (varchar)

-- VibeProfile table
\d vibe_profiles;
-- Verify: comprehensive_interests_vector (vector), enriched_matching_text (text),
--          hobbies (varchar), music_taste (varchar), learning_goals (varchar),
--          match_score (integer), last_updated (bigint)
```

---

## Performance Tests

### Test Matching with Many Profiles
```bash
# Create 100 test profiles with varied data
for i in {1..100}; do
  curl -X POST http://localhost:8080/api/profile/update-comprehensive \
    -H "Authorization: Bearer USER_$i_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{...profile_data...}"
done

# Time the matches endpoint
time curl -X GET http://localhost:8080/api/profile/matches \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Target:** Response time < 500ms for 100 profiles

### Monitor Query Logs
```sql
-- Check if hybrid matching query runs efficiently
EXPLAIN ANALYZE
SELECT u.id, u.full_name, ...
FROM vibe_profiles vp
JOIN users u ON vp.user_id = u.id
WHERE vp.user_id != YOUR_USER_ID
ORDER BY distance DESC LIMIT 10;
```

---

## Error Handling Tests

### Test Invalid Profile Picture URL
```bash
curl -X POST http://localhost:8080/api/profile/update-comprehensive \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profilePicUrl": "data:image/png;base64,..."
  }'
```
**Expected:** 400 Error - "Use direct HTTPS link, not data URLs"

### Test Bio Too Long
```bash
curl -X POST http://localhost:8080/api/profile/update-comprehensive \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "' + (repeated_text * 500) + '"'
  }'
```
**Expected:** 400 Error - "Bio too long (max 4000 characters)"

### Test Invalid Date Format
```bash
curl -X POST http://localhost:8080/api/profile/update-comprehensive \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateOfBirth": "invalid-date"
  }'
```
**Expected:** 400 Error or field is ignored gracefully

### Test Missing Authorization
```bash
curl -X GET http://localhost:8080/api/profile/my
```
**Expected:** 401 Unauthorized Error

---

## Manual UI Testing Flow

### Complete User Journey

**Step 1: Fresh Registration**
1. Click "Sign in with Google"
2. Authenticate
3. Redirect to Profile page
4. Verify auto-populated fields: name, email, location, DOB

**Step 2: Complete Profile**
1. Click "Edit Profile"
2. Fill in missing optional fields: phone, hobbies, music taste, learning goals
3. Add custom interests
4. Add YouTube subscriptions and Spotify artists
5. Write detailed bio
6. Upload profile picture URL
7. Click "Save Profile"
8. Verify success toast appears

**Step 3: View Updated Profile**
1. Refresh page
2. All fields persist
3. Read-only display shows organized sections with emojis
4. Navigate to Explore
5. Click "Matches" 
6. Should see ranked profiles

**Step 4: Try Another Login Method**  
1. Open private window
2. Sign in with GitHub (same email)
3. Check linkedProviders = "google,github"
4. Verify profile data merged correctly

---

## Debugging Tips

### If Hybrid Matching Returns Empty
1. Check if profiles have bio_vector populated
2. Verify vibes_profiles table has data
3. Check backend logs for query errors
4. Try fallback: `/api/profile/matches` should retry twice

### If OAuth Data Not Populating  
1. Check OAuth2AuthenticationSuccessHandler logs
2. Verify OAuth provider returns expected attributes
3. Test with different OAuth account
4. Check User table for saved values after OAuth

### If Profile Save Fails
1. Check if comprehensive_interests_vector column exists
2. Verify AIService.getEmbedding() returns non-null
3. Check database constraints (unique email, etc.)
4. Review backend error logs

### Performance Issues
1. Profile query slow? → Check if bio_vector has index
2. Matching returns late? → Check AI embedding service
3. Frontend form sluggish? → Browser DevTools Performance tab

---

## Test Data Templates

### Musician Profile
```json
{
  "fullName": "Emma Davis",
  "email": "emma@music.com",
  "phone": "+1 (555) 222-3333",
  "location": "Austin, Texas",
  "dateOfBirth": "1998-03-20",
  "interests": "Music Production, Songwriting, Live Performance",
  "youtubeSubscriptions": "Andrew Huang, Rick Beato, Simon Servida",
  "spotifyArtists": "Billie Eilish, Clairo, Tame Impala",
  "bio": "Indie singer-songwriter. Love experimenting with electronic sounds.",
  "vibeTags": "music, indie, production, creative",
  "hobbies": "Music Production, Songwriting, Painting",
  "musicTaste": "Indie Pop, Electronic, Trip-hop, Ambient",
  "learningGoals": "Music Theory, Mixing Engineering, Singing",
  "profilePicUrl": "https://example.com/emma.jpg"
}
```

### Tech Founder Profile
```json
{
  "fullName": "Rohan Patel",
  "email": "rohan@startup.com",
  "phone": "+1 (555) 444-5555",
  "location": "Palo Alto, California",
  "dateOfBirth": "1992-08-10",
  "interests": "AI, Machine Learning, Startups, Venture Capital",
  "youtubeSubscriptions": "Y Combinator, TED-Ed, Ali Abdaal",
  "spotifyArtists": "Eminem, Drake, Kanye West",
  "bio": "Founder building AI tools for enterprises. Former Google engineer.",
  "vibeTags": "startup, AI, entrepreneurship, tech",
  "hobbies": "Coding, Reading, Basketball, Podcasts",
  "musicTaste": "Hip-hop, Electronic, Pop, Rap",
  "learningGoals": "Fundraising, Product Strategy, Public Speaking",
  "profilePicUrl": "https://example.com/rohan.jpg"
}
```

### Creative Designer Profile
```json
{
  "fullName": "Maya Gonzalez",
  "email": "maya@design.com",
  "phone": "+1 (555) 666-7777",
  "location": "Brooklyn, New York",
  "dateOfBirth": "1996-11-05",
  "interests": "UI Design, Branding, Digital Art, Photography",
  "youtubeSubscriptions": "The Futur, DesignCourse, Art for Everyone",
  "spotifyArtists": "SZA, Thundercat, Kendrick Lamar",
  "bio": "UX/UI designer with passion for minimalist aesthetics and user-centered design.",
  "vibeTags": "design, art, creative, minimalism",
  "hobbies": "Photography, Illustration, Interior Design, Traveling",
  "musicTaste": "R&B, Jazz, Hip-hop, Indie",
  "learningGoals": "Motion Design, 3D Modeling, Brand Strategy",
  "profilePicUrl": "https://example.com/maya.jpg"
}
```

---

## Regression Testing

**After Each Deployment, Verify:**
- [ ] Existing users can still login (backward compatibility)
- [ ] Legacy `/api/profile/update` endpoint still works
- [ ] New users get all default fields initialized
- [ ] Friend system still functional (separate from profile)
- [ ] Messages system unaffected
- [ ] Posts system unaffected

---

## Success Criteria

✅ **Profile Expansion Complete When:**
1. All 15+ fields editable and persist to database
2. OAuth auto-populates DOB, location, interests
3. Hybrid matching shows matches ordered by comprehensive score
4. Frontend displays all profile data with visual organization
5. No compilation errors in backend or frontend
6. Database migrations applied successfully
7. All CRUD operations work without errors
