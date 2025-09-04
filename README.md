# Reecords Vibecheck

A fun browser-based game where you play as a DJ defending your booth from needy club goers by throwing records at them.

## Features
- Throw records at needy club goers
- Avoid hitting friendly dancers
- Special effects: strobe lights and smoke machine
- Leaderboard system to track high scores

## Supabase Setup for Leaderboard

To enable the leaderboard functionality, you need to set up a Supabase project:

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com/) and sign up for a free account
   - Create a new project

2. **Set Up Database Table**
   - In your Supabase dashboard, go to the SQL Editor
   - Run the following SQL to create the leaderboard table:

```sql
CREATE TABLE leaderboard (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a policy to allow anyone to insert scores
CREATE POLICY "Allow anonymous score submissions" 
ON leaderboard FOR INSERT 
TO anon 
WITH CHECK (true);

-- Create a policy to allow anyone to read scores
CREATE POLICY "Allow anonymous score reading" 
ON leaderboard FOR SELECT 
TO anon 
USING (true);

-- Enable RLS (Row Level Security)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
```

3. **Get Your API Keys**
   - In your Supabase dashboard, go to Project Settings > API
   - Copy the "URL" and "anon public" key
   - Open `sketch.js` and replace the placeholder values:
   
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your URL
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key
```

4. **Run the Game**
   - Open `index.html` in a web browser or serve it using a local server
   - The leaderboard functionality should now be working!

## Privacy Considerations
- The leaderboard only displays the first part of the email address for privacy
- Consider adding additional validation or authentication for a production environment

## Game Instructions
- Click or tap to throw records at annoying club goers approaching your DJ booth
- Avoid hitting the friendly dancers in the back - they're just vibing!
- Score points for each annoying club goer you hit
- Watch out for special effects: strobe lights activate after 5 hits, smoke machine after 10!

## Customization
- You can modify the leaderboard styling in the CSS section of `index.html`
- Adjust the number of displayed scores by changing the `limit` value in the `fetchLeaderboard` function 