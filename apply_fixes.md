# Fixes for Disco Ball Positioning and Supabase Score Saving

## FIX 1: Disco Ball Positioning

**Find this line in sketch.js (around line 2029):**
```javascript
discoBallTargetY = height * 0.125; // Lower to smaller distance (half of original 0.25)
```

**Replace it with:**
```javascript
// Calculate DC-10 logo position and size to position disco ball below it
let dc10Width = isMobile ? 150 : 180;
let dc10Height = (dc10LogoImg ? dc10LogoImg.height / dc10LogoImg.width : 1) * dc10Width;
let dc10BottomY = 50 + dc10Height/2; // DC-10 logo is centered at y=50

// Calculate disco ball size to position it correctly
let discoBallSize = isMobile ? 60 : 80; // Approximate disco ball size
discoBallTargetY = dc10BottomY + discoBallSize; // Position so top of disco ball is below the logo
```

## FIX 2: Enhanced Supabase Score Submission

**Find the submitScore function and replace it with this enhanced version:**

```javascript
async function submitScore() {
  console.log('🎯 submitScore() called with:', { playerName, playerEmail, score });
  
  if (!playerName || playerName.trim() === '') {
    alert('Please enter your name');
    return;
  }

  if (!playerEmail || !playerEmail.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }

  // Try Supabase first if available
  if (!supabaseClient) {
    console.log('❌ Supabase client not available, storing score locally');
    storeScoreLocally();
    showSuccessMessage('Score saved locally!');
    return;
  }
  
  try {
    console.log("🔍 Attempting to submit score:", { score, playerName, playerEmail });
    console.log("🔍 Supabase client status:", { 
      hasClient: !!supabaseClient, 
      hasFrom: !!supabaseClient.from,
      clientType: typeof supabaseClient 
    });
    
    // Check if Supabase client is properly initialized
    if (!supabaseClient.from) {
      console.error("❌ Supabase client is not properly initialized");
      alert('Error: Database connection issue. Your score: ' + score);
      return;
    }
    
    // Test the connection first
    console.log("🔍 Testing Supabase connection...");
    const testQuery = await supabaseClient
      .from('leaderboard')
      .select('count')
      .limit(1);
    
    console.log("🔍 Test query result:", testQuery);
    
    if (testQuery.error) {
      console.error("❌ Supabase connection test failed:", testQuery.error);
      throw new Error('Database connection failed: ' + testQuery.error.message);
    }
    
    console.log("✅ Supabase connection test successful, proceeding with score submission...");
    
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .insert([
        { 
          player_name: playerName.trim(),
          player_email: playerEmail.trim(),
          score: parseInt(score),
          created_at: new Date().toISOString()
        }
      ])
      .select(); // Add .select() to get the inserted data back
      
    console.log("🔍 Supabase insert result:", { data, error });
    
    if (error) {
      console.error("❌ Supabase error details:", error);
      
      // Handle specific error types - fall back to local storage
      if (error.message && error.message.includes('Failed to fetch')) {
        console.log('❌ Database connection failed, storing score locally');
        storeScoreLocally();
        showSuccessMessage('Score saved locally!');
      } else {
        console.log('❌ Database error, storing score locally');
        storeScoreLocally();
        showSuccessMessage('Score saved locally!');
      }
      return; // Don't throw, just return gracefully
    }
    
    console.log("✅ Score submitted successfully:", data);
    
    // Show success message for online submission
    showSuccessMessage('Score saved to leaderboard!');
    
    // Hide the score submission form
    submitScoreForm.style('display', 'none');
    
    // Fetch and update leaderboard data
    fetchLeaderboard();
  } catch (error) {
    console.error('❌ Error submitting score:', error);
    
    // Provide user-friendly success messages and store locally
    console.log('❌ Catch block error, storing score locally');
    storeScoreLocally();
    showSuccessMessage('Score saved locally!');
    
    // Hide the score submission form even on error
    if (submitScoreForm) {
      submitScoreForm.style('display', 'none');
    }
  }
}
```

## What These Fixes Do:

### Disco Ball Fix:
- Calculates the actual DC-10 logo position and size
- Positions the disco ball so its top edge is below the logo
- Uses dynamic sizing based on mobile/desktop

### Supabase Fix:
- Adds comprehensive debugging and error logging
- Tests the connection before attempting to insert
- Provides detailed error messages in the console
- Ensures proper data types (trimmed strings, parsed integers)
- Adds .select() to get confirmation of inserted data

## Testing:
1. Open browser console (F12)
2. Submit a score
3. Check console for detailed debugging information
4. Verify disco ball positions correctly below DC-10 logo
