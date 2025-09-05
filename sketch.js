// ===== PLAYER TRACKING & ANALYTICS SYSTEM =====

// Player identification and session tracking
let playerID = null;
let sessionID = null;
let sessionStartTime = null;
let sessionEndTime = null;
let isFirstTimePlayer = false;
let playerFirstSeenDate = null;
let lastActiveDate = null;
let totalSessions = 0;
let totalPlayTime = 0;

// Device and platform tracking
let deviceInfo = {
  type: 'unknown',
  platform: 'unknown',
  userAgent: '',
  screenSize: { width: 0, height: 0 },
  viewportSize: { width: 0, height: 0 },
  pixelRatio: 1,
  isMobile: false,
  isTablet: false,
  isDesktop: false,
  isTouch: false,
  browser: 'unknown',
  os: 'unknown'
};

// Retention tracking
let day1Retention = false;
let day7Retention = false;
let day30Retention = false;
let retentionMilestones = {
  day1: false,
  day7: false,
  day30: false
};

// Gameplay analytics
let currentSessionScore = 0;
let highestSessionScore = 0;
let totalScoresReached = [];
let engagementHeartbeat = null;
let lastHeartbeatTime = 0;
let activeGameplayTime = 0;

// Event tracking
let trackedEvents = [];
let pendingEvents = [];

// Detect device information
function detectDeviceInfo() {
  const userAgent = navigator.userAgent;
  const screenWidth = screen.width;
  const screenHeight = screen.height;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Detect OS
  let os = 'unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  
  // Detect browser
  let browser = 'unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';
  
  // Detect device type
  let isMobile = false;
  let isTablet = false;
  let isDesktop = false;
  let type = 'unknown';
  
  // Mobile detection
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    isMobile = true;
    type = 'mobile';
  }
  
  // Tablet detection (iPad or large mobile screens)
  if (userAgent.includes('iPad') || (screenWidth >= 768 && screenHeight >= 1024)) {
    isTablet = true;
    type = 'tablet';
  }
  
  // Desktop detection
  if (!isMobile && !isTablet) {
    isDesktop = true;
    type = 'desktop';
  }
  
  // Touch detection
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Platform detection
  let platform = 'unknown';
  if (isMobile || isTablet) {
    if (userAgent.includes('Android')) platform = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'iOS';
    else platform = 'Mobile';
  } else {
    platform = 'Desktop';
  }
  
  deviceInfo = {
    type: type,
    platform: platform,
    userAgent: userAgent,
    screenSize: { width: screenWidth, height: screenHeight },
    viewportSize: { width: viewportWidth, height: viewportHeight },
    pixelRatio: pixelRatio,
    isMobile: isMobile,
    isTablet: isTablet,
    isDesktop: isDesktop,
    isTouch: isTouch,
    browser: browser,
    os: os
  };
  
  console.log('📱 Device detected:', deviceInfo);
  return deviceInfo;
}

// Initialize player tracking system
function initializePlayerTracking() {
  console.log('🔍 Initializing player tracking system...');
  
  // Detect device information first
  detectDeviceInfo();
  
  // Generate or retrieve player ID
  playerID = localStorage.getItem('reecords_player_id');
  if (!playerID) {
    playerID = generatePlayerID();
    localStorage.setItem('reecords_player_id', playerID);
    isFirstTimePlayer = true;
    console.log('   New player created:', playerID);
  } else {
    console.log('👋 Returning player:', playerID);
  }
  
  // Check retention milestones
  checkRetentionMilestones();
  
  // Initialize session
  startNewSession();
  
  // Start engagement heartbeat
  startEngagementHeartbeat();
  
  console.log('✅ Player tracking initialized');
}

// Generate unique player ID
function generatePlayerID() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `player_${timestamp}_${random}`;
}

// Generate unique session ID
function generateSessionID() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random}`;
}

// Start new session
function startNewSession() {
  sessionID = generateSessionID();
  sessionStartTime = Date.now();
  currentSessionScore = 0;
  highestSessionScore = 0;
  
  // Track session start
  trackEvent('session_start', {
    session_id: sessionID,
    player_id: playerID,
    timestamp: sessionStartTime,
    is_first_time: isFirstTimePlayer
  });
  
  console.log('   Session started:', sessionID);
}

// End current session
function endCurrentSession() {
  if (sessionStartTime) {
    sessionEndTime = Date.now();
    const sessionDuration = sessionEndTime - sessionStartTime;
    
    // Track session end
    trackEvent('session_end', {
      session_id: sessionID,
      player_id: playerID,
      timestamp: sessionEndTime,
      duration_ms: sessionDuration,
      final_score: currentSessionScore,
      highest_score: highestSessionScore
    });
    
    // Update total play time
    totalPlayTime += sessionDuration;
    localStorage.setItem('reecords_total_playtime', totalPlayTime.toString());
    
    console.log('🏁 Session ended:', sessionID, 'Duration:', Math.round(sessionDuration / 1000), 'seconds');
  }
}

// Check retention milestones
function checkRetentionMilestones() {
  const now = new Date();
  const firstSeen = localStorage.getItem('reecords_first_seen');
  const lastActive = localStorage.getItem('reecords_last_active');
  
  if (!firstSeen) {
    // First time player
    playerFirstSeenDate = now.toISOString();
    localStorage.setItem('reecords_first_seen', playerFirstSeenDate);
    console.log('🎉 First time player detected');
  } else {
    playerFirstSeenDate = new Date(firstSeen);
    lastActiveDate = lastActive ? new Date(lastActive) : null;
    
    // Calculate days since first seen
    const daysSinceFirstSeen = Math.floor((now - playerFirstSeenDate) / (1000 * 60 * 60 * 24));
    
    // Check retention milestones
    if (daysSinceFirstSeen >= 1 && !retentionMilestones.day1) {
      retentionMilestones.day1 = true;
      trackEvent('retention_milestone', {
        milestone: 'day1',
        days_since_first_seen: daysSinceFirstSeen,
        player_id: playerID
      });
      console.log('🎯 Day 1 retention milestone reached!');
    }
    
    if (daysSinceFirstSeen >= 7 && !retentionMilestones.day7) {
      retentionMilestones.day7 = true;
      trackEvent('retention_milestone', {
        milestone: 'day7',
        days_since_first_seen: daysSinceFirstSeen,
        player_id: playerID
      });
      console.log('🎯 Day 7 retention milestone reached!');
    }
    
    if (daysSinceFirstSeen >= 30 && !retentionMilestones.day30) {
      retentionMilestones.day30 = true;
      trackEvent('retention_milestone', {
        milestone: 'day30',
        days_since_first_seen: daysSinceFirstSeen,
        player_id: playerID
      });
      console.log('🎯 Day 30 retention milestone reached!');
    }
  }
  
  // Update last active date
  localStorage.setItem('reecords_last_active', now.toISOString());
}

// Track game events
function trackEvent(eventType, eventData) {
  const event = {
    event_type: eventType,
    player_id: playerID,
    session_id: sessionID,
    timestamp: Date.now(),
    device_info: deviceInfo,
    ...eventData
  };
  
  trackedEvents.push(event);
  pendingEvents.push(event);
  
  // Send to Supabase if available
  if (supabaseClient) {
    sendEventToSupabase(event);
  }
  
  console.log('📊 Event tracked:', eventType, eventData);
}

// Track specific game events
function trackGameEvent(eventType, additionalData = {}) {
  const gameData = {
    game_state: gameState,
    current_score: score,
    dancers_left: dancersLeft,
    ...additionalData
  };
  
  trackEvent(eventType, gameData);
}

// Track player engagement
function trackEngagement(action, context = {}) {
  trackEvent('player_engagement', {
    action: action,
    context: context,
    game_state: gameState,
    current_score: score
  });
}

// Track game progression
function trackProgression(milestone, data = {}) {
  trackEvent('game_progression', {
    milestone: milestone,
    ...data,
    game_state: gameState,
    current_score: score
  });
}

// Track performance metrics
function trackPerformance(metric, value, context = {}) {
  trackEvent('performance_metric', {
    metric: metric,
    value: value,
    context: context,
    game_state: gameState
  });
}

// Send event to Supabase
async function sendEventToSupabase(event) {
  try {
    const { error } = await supabaseClient
      .from('player_events')
      .insert([event]);
    
    if (error) {
      console.error('❌ Error sending event to Supabase:', error);
      // Keep event in pendingEvents for retry
    } else {
      // Remove from pending events if successfully sent
      const index = pendingEvents.findIndex(e => e.timestamp === event.timestamp);
      if (index > -1) {
        pendingEvents.splice(index, 1);
      }
    }
  } catch (error) {
    console.error('❌ Exception sending event to Supabase:', error);
  }
}

// Track score events
function trackScoreEvent(scoreValue, context = {}) {
  trackEvent('score_reached', {
    score: scoreValue,
    context: context,
    player_id: playerID,
    session_id: sessionID
  });
  
  // Update session tracking
  currentSessionScore = Math.max(currentSessionScore, scoreValue);
  highestSessionScore = Math.max(highestSessionScore, scoreValue);
  
  // Track total scores reached
  if (!totalScoresReached.includes(scoreValue)) {
    totalScoresReached.push(scoreValue);
    totalScoresReached.sort((a, b) => a - b);
  }
}

// Track URL clicks
function trackURLClick(url, context = {}) {
  trackEvent('url_click', {
    url: url,
    context: context,
    player_id: playerID,
    session_id: sessionID
  });
}

// Start engagement heartbeat
function startEngagementHeartbeat() {
  if (engagementHeartbeat) {
    clearInterval(engagementHeartbeat);
  }
  
  engagementHeartbeat = setInterval(() => {
    if (gameState === 'playing') {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - lastHeartbeatTime;
      
      if (timeSinceLastHeartbeat >= 60000) { // Every minute
        activeGameplayTime += 60000;
        lastHeartbeatTime = now;
        
        trackEvent('engagement_heartbeat', {
          active_gameplay_time_ms: activeGameplayTime,
          current_score: score,
          player_id: playerID,
          session_id: sessionID
        });
      }
    }
  }, 10000); // Check every 10 seconds
}

// Stop engagement heartbeat
function stopEngagementHeartbeat() {
  if (engagementHeartbeat) {
    clearInterval(engagementHeartbeat);
    engagementHeartbeat = null;
  }
}

// Retry sending pending events
function retryPendingEvents() {
  if (pendingEvents.length > 0 && supabaseClient) {
    console.log('   Retrying', pendingEvents.length, 'pending events...');
    pendingEvents.forEach(event => {
      sendEventToSupabase(event);
    });
  }
}

// Get player analytics summary
function getPlayerAnalytics() {
  return {
    player_id: playerID,
    session_id: sessionID,
    is_first_time: isFirstTimePlayer,
    first_seen: playerFirstSeenDate,
    last_active: lastActiveDate,
    total_playtime: totalPlayTime,
    current_session_score: currentSessionScore,
    highest_session_score: highestSessionScore,
    total_scores_reached: totalScoresReached,
    retention_milestones: retentionMilestones,
    active_gameplay_time: activeGameplayTime
  };
}

// Debug function to log analytics to console
function logPlayerAnalytics() {
  const analytics = getPlayerAnalytics();
  console.log('📊 PLAYER ANALYTICS:', analytics);
  console.log('📊 TRACKED EVENTS:', trackedEvents.length, 'events');
  console.log('📊 PENDING EVENTS:', pendingEvents.length, 'events');
}

// Function to export analytics data
function exportAnalyticsData() {
  const analytics = getPlayerAnalytics();
  const exportData = {
    analytics: analytics,
    events: trackedEvents,
    timestamp: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `reecords_analytics_${playerID}_${Date.now()}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
  console.log('📊 Analytics data exported');
}

// Track page visibility changes and unload events
function setupPageTracking() {
  // Track when page becomes hidden (tab switch, minimize, etc.)
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      trackEvent('page_hidden', {
        player_id: playerID,
        session_id: sessionID,
        game_state: gameState
      });
    } else {
      trackEvent('page_visible', {
        player_id: playerID,
        session_id: sessionID,
        game_state: gameState
      });
    }
  });
  
  // Track when page is about to unload (close tab, refresh, etc.)
  window.addEventListener('beforeunload', function() {
    endCurrentSession();
    stopEngagementHeartbeat();
    retryPendingEvents();
  });
  
  // Track when page is unloaded
  window.addEventListener('unload', function() {
    endCurrentSession();
    stopEngagementHeartbeat();
    retryPendingEvents();
  });
}

// ===== END PLAYER TRACKING & ANALYTICS SYSTEM =====
let dancers = []; // Array for dancers on the dancefloor
let records = [];
let score = 0;
let milestonesReached = []; // Track milestones reached in current session
let gameOver = false;
let gameOverReason = ""; // Track reason for game over
let dancersLeft = 0; // Counter for dancers who have left
let gameState = 'menu'; // 'menu', 'playing', 'gameOver'
let waitingForStartSound = false; // Flag to track if we're waiting for start sound to finish
let dancerPhrases = ["Great set!", "Love this track!", "Vibing!", "This DJ rocks!", "Dancing all night!", "Amazing beats!", "Love this vibe!", "Best night ever!"];
let leavingPhrases = ["I'm tired...", "Need some air", "Getting late", "Time to go", "Had enough", "Heading out"];
let fogParticles = []; // Array to store fog particles
let strobeTimer = 0; // Timer for strobe light effect
let strobeOn = false; // Strobe light state
let strobeCount = 0; // Count of strobe flashes in current burst
let strobeBurstActive = false; // Whether a strobe burst is currently active
let strobeCooldown = 0; // Cooldown between strobe bursts
let strobeEnabled = false; // Whether strobe is enabled (after 5th hit)
let waitingForScore5Sound = false; // Flag to track if we're waiting for score 5 sound to finish
let waitingForScore10Sound = false; // Flag to track if we're waiting for score 10 sound to finish
let waitingForScore15Video = false; // Flag to track if we're waiting for score 15 video to finish
let isMobile = false; // Flag for mobile detection
let smokeActive = false; // Flag to track if smoke machine is active
let smokeTimer = 0; // Timer for smoke duration
let lastStrobeCheck = 0; // Last score when we checked for strobe trigger
let lastSmokeCheck = 0; // Last score when we checked for smoke trigger
let emojiThrowCount = 0; // Counter for tracking sandwich emoji timing

// Disco ball effect variables
let discoBallActive = false; // Whether disco ball effect is active
let discoBallY = -100; // Current Y position of disco ball
let discoBallTargetY = 0; // Target Y position when lowered (will be calculated dynamically)
let discoBallSpeed = 2; // Speed of lowering animation
let discoBallLowered = false; // Whether disco ball has reached target position
let lastDiscoBallCheck = 0; // Last score when we checked for disco ball trigger
let musicDimmed = false; // Whether background music is currently dimmed

// Disco ball light effect variables
let discoBallLights = []; // Array to store light reflection spots
let discoBallRotation = 0; // Rotation angle of disco ball
let floorLights = []; // Array to store moving floor light spots
let videoPlaying = false; // Flag to track if video is currently playing
let lightsEnabled = false; // Flag to track if sparkle effects should be active

// Zoom effect variables
let zoomActive = false;
let zoomProgress = 0;
let zoomSpeed = 0.05; // Slower, more dramatic zoom speed
let zoomStartX, zoomStartY;
let zoomScale = 1;

// Dancer leaving zoom effect variables
let dancerLeaveZoomActive = false;
let dancerLeaveZoomProgress = 0;
let dancerLeaveZoomSpeed = 0.1; // Fast zoom to leaving dancer
let dancerLeaveZoomX, dancerLeaveZoomY;
let dancerLeaveZoomScale = 1;
let dancerLeavePhase = "inactive"; // "inactive", "zooming_in", "displaying_image", "zooming_out"
let isGamePausedForZoom = false; // Global flag to pause all dancers during zoom

// Dancer leaving zoom effect variables
let dancerLeaveFreezeTimer = 0;
let dancerLeaveFreezeFrameDuration = 30; // 0.5 seconds at 60fps
let dancerLeaveImageTimer = 0;
let dancerLeaveImageDuration = 120; // 2 seconds at 60fps
let dancerLeaveNotificationTimer = 0;
let waitingForDancerLeaveSound = false;

// SoundCloud track data
let currentTrackIndex = 0;
let trackSwitchTimer = 0;
let trackSwitchInterval = 7200; // Switch tracks every 120 seconds (2 minutes)
let soundCloudWidget = null;
let isTrackEnding = false; // Flag to check if track is near its end
let tracks = [
  { id: '1793446501', name: 'Reelow - Hey Suga (feat. Rayzir, Eli Wild)', bpm: 128 },
  { id: '1793446423', name: "Reelow - I'm With Them (feat. Jo Harris)", bpm: 129 }
];

// Beat tracking variables
let currentBPM = 128;
let beatIntervalFrames = 0; // How many frames between each beat
let beatTimer = 0; // Timer to track frames for beat
let discoBallWinkState = 0; // 0 for left, 1 for right

// Supabase configuration
const SUPABASE_URL = 'https://kmokcgfdsopjatjklkmg.supabase.co'; // Replace with your actual URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb2tjZ2Zkc29wamF0amtsa21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjE4ODYsImV4cCI6MjA3MTg5Nzg4Nn0.2ruNIc1WN7XhtNTUOQAEsYV-_suxNTG5XWQRPugtIrs'; // Replace with your actual key
// supabaseClient is defined globally in index.html
let leaderboardData = [];
let playerEmail = '';
let playerName = '';
let showingLeaderboard = false;
let submitScoreForm;

// Sound variables
let throwSound, recordHitSound, smokeSound, startGameSound, score5Sound, score10Sound, gameOverSound, playerLeavesFloorSound, heySomebodyDroppedSound, throwWristbandSound, ooohThankYouSound;

// Visual assets
let partyEmojiImg;
let sandwichImg;
let gameOverImg;
let reecordsLogoImg;
let discoBallImg, discoBallSmirkLeftImg, discoBallSmirkRightImg, discoBall5oclockImg, wristbandImg;
let swipeUpTextImg;
let oneDancerLeftImg, secondDancerImg, thirdDancerImg;
// sugaBagImg removed - no longer used
// solidGroovesLogoImg and dc10LogoImg removed
let partyStartedVideo;
let autopilotMode = false; // For background gameplay during game over

// Autopilot settings for game over screen
let autopilotRecords = [];

// Game state for dropped items
// sugaBagDropped removed - no longer used
let droppedItems = [];
let discoBallChangedAt8 = false;
let girlReachedDJBooth = false;
let mmmGettingDownPlayed = false;
let showSwipeUpText = true; // Show swipe up text until first score
let soundEffectsMuted = false; // Global flag for muting sound effects

// Swipe detection variables for mobile
let swipeStartX = 0;
let swipeStartY = 0;
let swipeStartTime = 0;
let isSwipeActive = false;
let bagPickupTriggered = false;
let bagPickupDancer = null;
let bagPickupTime = 0;
let wristbandThrown = false;
let throwingWristbands = false;
let targetGirlDancer = null;
let girlHitWithWristband = false;
let wristbandZoomPhase = "inactive";
let wristbandZoomTarget = null;
let wristbandZoomProgress = 0;
let wristbandZoomScale = 1;
let wristbandDisplayTimer = 0;
let zoomedWristband = null; // New global variable

function preload() {
  // Load sound files first
  throwSound = loadSound('Sound Effects/throw record.mp3');
  recordHitSound = loadSound('Sound Effects/record hits goer.mp3');
  smokeSound = loadSound('Sound Effects/Smoke Effect.mp3');
  startGameSound = loadSound('Sound Effects/Start Game_Lets_Party.mp3');
  score5Sound = loadSound('Sound Effects/score5_rockin_lights_flashin.mp3');
  score10Sound = loadSound('Sound Effects/score10_whoohoo_gimmee_smoke.mp3');
  gameOverSound = loadSound('Sound Effects/Game Over_song.mp3');
  playerLeavesFloorSound = loadSound('Sound Effects/player_leaves_floor.mp3');
  heySomebodyDroppedSound = loadSound('Sound Effects/mmm_getting_down.mp3');
  throwWristbandSound = loadSound('Sound Effects/throw_wristband.mp3');
  ooohThankYouSound = loadSound('Sound Effects/oooh_thank_you.mp3');
  
  // Load visual assets
  partyEmojiImg = loadImage('Visual/party_emoji.png', 
    () => console.log("Party emoji loaded successfully!"),
    () => console.error("Failed to load party emoji image")
  );
  
  sandwichImg = loadImage('Visual/sandwich.png',
    () => console.log("Sandwich emoji loaded successfully!"),
    () => console.error("Failed to load sandwich emoji image")
  );
  
  gameOverImg = loadImage('Visual/game_over.png',
    () => console.log("Game over image loaded successfully!"),
    () => console.error("Failed to load game over image")
  );
  
  reecordsLogoImg = loadImage('Visual/reecords_logo_white_transparent.png',
    () => console.log("Reecords logo loaded successfully!"),
    () => console.error("Failed to load reecords logo image")
  );
  
  redAuraDancerImg = loadImage('Visual/red_aura_dancer.png',
    () => console.log("Red aura dancer image loaded successfully!"),
    () => console.error("Failed to load red aura dancer image")
  );
  
  vibecheckTaglineImg = loadImage('Visual/vibecheck&Tagline.png',
    () => console.log("Vibecheck tagline image loaded successfully!"),
    () => console.error("Failed to load vibecheck tagline image")
  );
  
  deadEmojiImg = loadImage('Visual/dead_emoji.png',
    () => console.log("Dead emoji image loaded successfully!"),
    () => console.error("Failed to load dead emoji image")
  );
  
  discoBallImg = loadImage('Visual/disco_ball_smirk.png',
    () => console.log("Disco ball image loaded successfully!"),
    () => console.error("Failed to load disco ball image")
  );
  
  discoBallSmirkLeftImg = loadImage('Visual/disco_ball_smirk_Left.png',
    () => console.log("Disco ball left smirk image loaded successfully!"),
    () => console.error("Failed to load disco ball left smirk image")
  );
  
  discoBallSmirkRightImg = loadImage('Visual/disco_ball_smirk_Right.png',
    () => console.log("Disco ball right smirk image loaded successfully!"),
    () => console.error("Failed to load disco ball right smirk image")
  );
  
  discoBall5oclockImg = loadImage('Visual/disco_ball_smirk_5oclock_point_white.png',
    () => console.log("Disco ball 5 o'clock image loaded successfully!"),
    () => console.error("Failed to load disco ball 5 o'clock image")
  );
  
  oneDancerLeftImg = loadImage('Visual/one_dancer_left_the_floor.png',
    () => console.log("One dancer left image loaded successfully!"),
    () => console.error("Failed to load one dancer left image")
  );
  
  secondDancerImg = loadImage('Visual/second_dancer_was_bored.png',
    () => console.log("Second dancer image loaded successfully!"),
    () => console.error("Failed to load second dancer image")
  );
  
  thirdDancerImg = loadImage('Visual/third_strike_out.png',
    () => console.log("Third dancer image loaded successfully!"),
    () => console.error("Failed to load third dancer image")
  );
  
  createdByCrxssImg = loadImage('Visual/created by CRXSS.png',
    () => console.log("Created by CRXSS image loaded successfully!"),
    () => console.error("Failed to load created by CRXSS image")
  );
  

  
  // sugaBagImg loading removed - no longer used
  
  wristbandImg = loadImage('Visual/wristband.png',
    () => console.log("Wristband image loaded successfully!"),
    () => console.error("Failed to load wristband image")
  );
  
  swipeUpTextImg = loadImage('Visual/swipe_up_text.png',
    () => console.log("Swipe up text image loaded successfully!"),
    () => console.error("Failed to load swipe up text image")
  );
  
  // solidGroovesLogoImg and dc10LogoImg loading removed
  
  // dc10LogoImg loading removed
  
  // Load video assets with error handling
  try {
    // Check if video files exist before loading
    console.log('🎥 Attempting to load party started video...');
    
    // Try multiple video formats for better browser compatibility (prioritize .mp4)
    const cacheBuster = '?v=' + Date.now();
    partyStartedVideo = createVideo(['Visual/score15_party_started.mp4' + cacheBuster, 'Visual/score15_party_started.mov' + cacheBuster]);
    
    if (partyStartedVideo) {
      partyStartedVideo.hide(); // Hide video element initially
      
      // Add error event listener to handle loading errors
      partyStartedVideo.elt.addEventListener('error', (e) => {
        console.error('❌ Video loading error:', e);
        console.error('❌ Video error details:', partyStartedVideo.elt.error);
        partyStartedVideo = null; // Disable video functionality
      });
      
      // Add load event listener to confirm successful loading
      partyStartedVideo.elt.addEventListener('loadeddata', () => {
        console.log('✅ Video loaded successfully');
      });
    }
    
    // Ensure video has audio attributes set properly
    partyStartedVideo.elt.preload = 'auto';
    partyStartedVideo.elt.muted = false;
    partyStartedVideo.elt.volume = 1.0;
    partyStartedVideo.elt.controls = false; // Hide video controls
    
    console.log('🎬 Video audio attributes set during creation');
    
    // Add error handler
    partyStartedVideo.elt.addEventListener('error', (e) => {
      console.error("❌ Video loading error:", e);
      console.error("Video error details:", e.target.error);
    });
    
    // Add loaded handler
    partyStartedVideo.elt.addEventListener('loadeddata', () => {
      console.log("✅ Video data loaded successfully");
    });
    
    console.log("✅ Party started video created successfully");
    console.log("Video element:", partyStartedVideo);
    console.log("Video element type:", typeof partyStartedVideo);
    console.log("Video DOM element:", partyStartedVideo ? partyStartedVideo.elt : 'NO ELEMENT');
  } catch (error) {
    console.error("❌ Error creating party started video:", error);
    partyStartedVideo = null;
  }
  
  // Sound files are now loaded in preload() function
  console.log("🔊 Sound files loaded in preload function");
}

function setup() {
  try {
    // Initialize player tracking system first
    initializePlayerTracking();
    
    // Setup page tracking for session management
    setupPageTracking();
    
    // Create fullscreen canvas that works on both desktop and mobile
    createCanvas(windowWidth, windowHeight);
    textAlign(CENTER, CENTER);
    
    console.log('🎯 Setup complete - Canvas size:', windowWidth, 'x', windowHeight);
    
    try {
      // Initialize Supabase client if available
      if (window.supabase) {
        console.log("Supabase library found, initializing client...");
        
        // Initialize the global supabaseClient
        if (typeof window.supabase.createClient === 'function') {
          supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        } else if (window.supabase && window.supabase.default && typeof window.supabase.default.createClient === 'function') {
          supabaseClient = window.supabase.default.createClient(SUPABASE_URL, SUPABASE_KEY);
        } else {
          console.error("Could not find a valid createClient method on the Supabase object");
          throw new Error("Invalid Supabase client");
        }
        
        console.log("Supabase client initialized successfully:", supabaseClient);
      } else {
        console.log("Supabase not available, leaderboard functionality will be disabled");
      }
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      supabaseClient = null; // Ensure it's null if initialization failed
      // Game will continue without leaderboard functionality
    }
    
    // Device detection is now handled in initializePlayerTracking()
    // Update the legacy isMobile variable for backward compatibility
    isMobile = deviceInfo.isMobile;
    
    // Start with main menu
    gameState = 'menu';
    
    // Initialize fog particles array but don't create particles yet
    fogParticles = [];
    
    // Create score submission form only if Supabase is available
    if (supabaseClient) {
      createScoreForm();
      // Fetch leaderboard data
      fetchLeaderboard();
    }
    
    // Don't start background music until game starts
    // Music will start when player clicks Start Game
  } catch (error) {
    // If there's an error in setup, display a message
    console.error("Error setting up game:", error);
    
    // Create a basic canvas to show error message
    createCanvas(600, 400);
    background(20);
    fill(255, 0, 0);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Error loading game", width/2, height/2 - 40);
    textSize(16);
    fill(255);
    text("Please check the console for details", width/2, height/2);
    text("Try refreshing the page or check your browser console", width/2, height/2 + 30);
  }
}

// Function to create fog particles
function createFogParticles() {
  fogParticles = []; // Clear existing particles
  
  // Calculate DJ booth position for smoke origin
  let boothCenterX = width / 2; // Center of the booth
  let boothY = height * 0.75; // Top of the booth
  
  for (let i = 0; i < 50; i++) {
    fogParticles.push({
      x: random(boothCenterX - 200, boothCenterX + 200), // Spread from booth center
      y: random(boothY - 30, boothY + 20), // Start from booth area
      size: random(50, 150),
      speed: random(0.5, 2), // Faster for burst effect
      opacity: random(100, 200), // Start more visible
      direction: random(-PI/4, -3*PI/4), // Upward directions (smoke rises)
      life: random(400, 600) // Longer life for lingering effect (was 255)
    });
  }
}

// Handle window resizing for responsive design
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Reposition the score form if it exists
  if (submitScoreForm) {
    submitScoreForm.style('top', (height/2 + 150) + 'px');
  }
}

// Function to populate the dance floor with dancers at the start
function populateDanceFloor() {
  // Add 15-20 dancers spread across the back of the dance floor
  let numDancers = random(15, 20);
  for (let i = 0; i < numDancers; i++) {
    let x = random(width * 0.1, width * 0.9);
    let y = random(height * 0.3, height * 0.65); // Position dancers closer to DJ but not overlapping booth
    let speed = random(0.5, 1.5);
    let color = [random(100, 255), random(100, 255), random(100, 255)];
    let phrase = random(dancerPhrases);
    let mood = random(['happy', 'excited']);
    let gender = random() > 0.5 ? 'male' : 'female';
    let hairColor = [random(0, 100), random(0, 100), random(0, 255)];
    dancers.push(new Dancer(x, y, speed, color, phrase, mood, gender, hairColor));
  }
}

function draw() {
  // Debug logging every 2 seconds
  if (frameCount % 120 === 0) {
    console.log('🎨 Main draw() - gameState:', gameState, 'waitingForStartSound:', waitingForStartSound);
  }
  
  if (gameState === 'menu' || waitingForStartSound) {
    drawMainMenu();
  } else if (gameState === 'playing') {
    drawGameplay();
  } else if (gameState === 'gameOver') {
    drawGameplay(); // Draw gameplay in background
    drawGameOverOverlay(); // Draw overlay on top
  }
}

function drawGameplay() {
  background(20); // Darker background for club atmosphere
  
  // Debug: Log what's happening
  if (frameCount % 30 === 0) { // Log twice per second
    console.log('🎮 drawGameplay called - videoPlaying:', videoPlaying, 'gameState:', gameState);
  }
  
  // Don't update game elements if video is playing, but still draw basic elements
  if (videoPlaying) {
    // Still draw some basic elements so screen isn't completely black
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text('Video Playing...', width/2, height/2);
    return; // Pause all game updates during video
  }
  
  // Update beat timer and handle beat events
  if (beatIntervalFrames > 0) {
    beatTimer++;
    if (beatTimer >= beatIntervalFrames) {
      beatTimer = 0;
      // This block runs on every beat
      discoBallWinkState = 1 - discoBallWinkState; // Toggle between 0 and 1
    }
  }
  
  // Debug logging for black screen issue
  if (frameCount % 60 === 0) { // Log once per second
    console.log('Gameplay state:', {
      dancerLeavePhase: dancerLeavePhase,
      dancerLeaveZoomActive: dancerLeaveZoomActive,
      gameState: gameState,
      autopilotMode: autopilotMode,
      videoPlaying: videoPlaying,
      waitingForScore15Video: waitingForScore15Video,
      dancersCount: dancers.length,
      recordsCount: records.length
    });
  }
  
  // Update zoom effects
  updateZoomEffect();
  
  // Only update dancer leave zoom if it's actually active
  if (dancerLeaveZoomActive || dancerLeavePhase === "showing_image") {
    updateDancerLeaveZoom();
  }
  
  // Update wristband zoom effect
  updateWristbandZoom();
  
  // Update notification timer
  if (dancerLeaveNotificationTimer > 0) {
    dancerLeaveNotificationTimer--;
  }
  
  // Apply zoom transformations if active
  push();
  applyZoomTransform();
  
  // Only apply dancer leave zoom if actually in zooming or freezing phase
  if (dancerLeavePhase === "zooming_in" || dancerLeavePhase === "displaying_image" || dancerLeavePhase === "zooming_out") {
    applyDancerLeaveZoomTransform();
  }
  
  // Apply wristband zoom transformation if active
  if (wristbandZoomPhase !== "inactive") {
    applyWristbandZoomTransform();
  }
  
  // Update track switching timer (only during active gameplay)
  if (!autopilotMode && gameState === 'playing') {
    trackSwitchTimer++;
    
    // Optional: Log timer progress every 60 seconds for monitoring
    if (trackSwitchTimer % 3600 === 0 && trackSwitchTimer > 0) {
      console.log(`🕐 Track timer: ${Math.floor(trackSwitchTimer/60)}s / ${Math.floor(trackSwitchInterval/60)}s (Track ${currentTrackIndex + 1})`);
    }
    
    // Switch tracks every 2 minutes as fallback, or if track is ending
    if (trackSwitchTimer >= trackSwitchInterval || isTrackEnding) {
      console.log('🔄 SWITCHING TO NEXT TRACK...');
      console.log(`Timer: ${trackSwitchTimer}, Interval: ${trackSwitchInterval}, IsEnding: ${isTrackEnding}`);
      nextTrack();
      trackSwitchTimer = 0; // Reset timer
      isTrackEnding = false; // Reset ending flag
    }
  }
  
  // Update strobe light effect (only if not in autopilot mode)
  if (!autopilotMode) {
  updateStrobeEffect();
  
  // Check if we should trigger strobe (when score hits 2, 7, 12, etc.)
  if (score >= 2 && (score - 2) % 5 === 0 && lastStrobeCheck !== score) {
    // Enable strobe permanently after 2nd hit
    if (!strobeEnabled && score >= 2) {
      // Play score 2 sound first, then enable strobe when it finishes
      playScore2Sound();
    }
    
    lastStrobeCheck = score;
  }
  
  // Check if we should trigger smoke machine at score 4 (special case with sound)
  if (score === 4 && lastSmokeCheck !== score) {
    playScore4Sound();
    lastSmokeCheck = score;
  }
  
    // Check for intermittent smoke throughout the game (roughly every 3-4 points after 4)
  if (score > 4 && (score % 3 === 0 || score % 4 === 0) && lastSmokeCheck !== score && score - lastSmokeCheck >= 2) {
    // Add some randomness so it's not too predictable
    if (random() < 0.7) { // 70% chance to trigger
    triggerSmokeEffect();
    lastSmokeCheck = score;
    }
  }
  
  // Check for disco ball trigger (now at score 6 for testing)
  if (score >= 6 && !discoBallActive && millis() - lastDiscoBallCheck > 1000) {
    triggerDiscoBallEffect();
    lastDiscoBallCheck = millis(); // Prevent re-triggering immediately
  }
  
  // Check for suga bag drop at score 10 (for testing)
  // Suga bag visual removed from gameplay
  
  // Check for disco ball change at score 12
  if (score >= 12 && !discoBallChangedAt8) {
    discoBallChangedAt8 = true;
    // Play the "mmm getting down" sound
    if (heySomebodyDroppedSound && heySomebodyDroppedSound.isLoaded()) {
      if (!soundEffectsMuted) heySomebodyDroppedSound.play();
      mmmGettingDownPlayed = true; // Mark that the sound has been played
    }
    
    // Find a female dancer to give white aura and position her at bottom right of dancefloor
    let femaleDancers = dancers.filter(d => d.gender === 'female' && d.state === 'dancing');
    if (femaleDancers.length > 0) {
      // Pick a random female dancer and give her white aura
      let selectedGirl = random(femaleDancers);
      selectedGirl.hasWhiteAura = true;
      
      // Position her at the bottom right of the dancefloor immediately
      selectedGirl.x = width * 0.9; // Right side of dancefloor
      selectedGirl.y = height * 0.6; // Bottom of dancefloor
      selectedGirl.originalX = selectedGirl.x;
      selectedGirl.originalY = selectedGirl.y;
      
      console.log("✨ Selected girl dancer now has white aura and appears at bottom right!");
    }
    
    console.log("🪩 Disco ball changed to 5 o'clock point at score 12!");
  }
  
  // Check for wristband sequence trigger on next score after mmm_getting_down sound
  if (mmmGettingDownPlayed && !wristbandThrown && score > 12) {
    console.log("🎯 Next score after mmm_getting_down sound! Starting wristband sequence!");
    
    // Find the white aura girl to target
    let whiteAuraDancer = dancers.find(d => d.hasWhiteAura);
    if (whiteAuraDancer) {
      targetGirlDancer = whiteAuraDancer;
      console.log("✨ Targeting white aura girl for wristband sequence!");
    }
    
    // Play throw wristband sound
    if (throwWristbandSound && throwWristbandSound.isLoaded()) {
      console.log("🎵 Playing throw wristband sound!");
      throwWristbandSound.setVolume(1.0);
      if (!soundEffectsMuted) throwWristbandSound.play();
    } else {
      console.error("❌ Could not play throw wristband sound");
    }
    
    // Revert any dancers who are currently leaving or stopping back to dancing
    for (let i = 0; i < dancers.length; i++) {
      if (dancers[i].state === 'stopping' || dancers[i].state === 'leaving') {
        console.log(`🔄 Reverting dancer from ${dancers[i].state} back to dancing for wristband phase`);
        dancers[i].state = 'dancing';
        dancers[i].stateTimer = 0;
        // Reset their position to a good dancing position
        dancers[i].x = dancers[i].originalX;
        dancers[i].y = dancers[i].originalY;
        dancers[i].targetY = dancers[i].originalY;
      }
    }
    
    // Start throwing wristbands
    wristbandThrown = true;
    throwingWristbands = true;
    
    console.log("🎯 Now throwing wristbands instead of party emojis!");
  }
  
  // Check for bag pickup at score 13
  if (score >= 13 && !bagPickupTriggered && droppedItems.length > 0) {
    console.log("🎯 Score 13 reached! Checking bag pickup conditions...");
    console.log("bagPickupTriggered:", bagPickupTriggered);
    console.log("droppedItems.length:", droppedItems.length);
    
    bagPickupTriggered = true;
    
    // girl_I_got_it sound removed from gameplay
    
    // Find a female dancer to pick up the bag (preferably one with white aura)
    let femaleDancers = dancers.filter(d => d.gender === 'female' && d.state === 'dancing');
    console.log("Female dancers available:", femaleDancers.length);
    
    if (femaleDancers.length > 0) {
      // First try to find a dancer with white aura
      let whiteAuraDancer = femaleDancers.find(d => d.hasWhiteAura);
      if (whiteAuraDancer) {
        bagPickupDancer = whiteAuraDancer;
        console.log("✨ Using girl with white aura to pick up bag!");
      } else {
        // Pick a random female dancer
        bagPickupDancer = random(femaleDancers);
      }
      // The white aura girl is already positioned at bottom right, just set her state
      bagPickupDancer.state = 'picking_up';
      bagPickupDancer.stateTimer = 60; // Shorter timer since no movement needed
      console.log("💃 Girl at bottom right picks up bag!");
    }
  }
  
  // Old wristband trigger logic removed - now triggered on next score after mmm_getting_down sound
  }
  
  // Update smoke effect timer
  if (smokeActive) {
    smokeTimer--;
    if (smokeTimer <= 0) {
      smokeActive = false;
    }
  }
  
  if (gameState === 'playing' || autopilotMode) {
    // Draw dance floor with grid pattern
    drawDanceFloor();
    
    // Smoke machine visual removed
    
    // Draw fog effect if active or if there are still particles
    if (smokeActive || fogParticles.length > 0) {
      drawFogEffect();
    }
    
    // Update and draw disco ball effect if active
    if (discoBallActive) {
      updateDiscoBall();
      drawDiscoBall();
    }
    
    // Apply strobe light effect if active
    if (strobeOn) {
      // Create strobe light effect
      fill(255, 255, 255, 150); // Increased brightness
      rect(0, 0, width, height); // Cover entire screen with semi-transparent white
    }
    
    // Draw DJ Booth in front of DJ (between DJ and dance floor)
    drawDJBooth();
    
    // Draw DJ from behind - now drawn AFTER the booth so he appears behind it
    drawDJ();
    
    // Update and draw dancers
    for (let i = dancers.length - 1; i >= 0; i--) {
      dancers[i].update();
      dancers[i].draw();
      
      // Check if a dancer has moved off-screen to trigger the leaving sequence
      if (dancers[i].state === 'leaving' && !dancers[i].isPausedForZoom &&
         (dancers[i].x < -40 || dancers[i].x > width + 40 || dancers[i].y < -40 || dancers[i].y > height + 40)) {
        
        // Only trigger the zoom effect if another one isn't already active
        if (dancerLeavePhase === "inactive") {
          console.log(`🎯 Triggering dancer leave zoom effect!`);
          triggerDancerLeaveZoom(dancers[i].x, dancers[i].y);
          dancers[i].isPausedForZoom = true; // Pause this dancer and flag for removal after zoom
        }
      }
    }
    
    // Draw any items dropped on the floor
    for (const item of droppedItems) {
      if (item.img && item.img.width > 0) {
        imageMode(CORNER);
        image(item.img, item.x - 15, item.y - 15, 30, 30); // Draw as 30x30 pixels (50% smaller)
      }
    }
    
    // Update and draw records (party emojis)
    for (let i = records.length - 1; i >= 0; i--) {
      records[i].update();

      // Draw all records normally (global zoom transformation is applied above)
      records[i].draw();
      
      // Don't remove wristbands that are being zoomed
      if (records[i].x < 0 || records[i].x > width || records[i].y < 0 || records[i].y > height) {
        if (records[i] !== zoomedWristband || wristbandZoomPhase === "inactive") {
        records.splice(i, 1); // Remove if out of bounds
        }
      }
    }
    
    // Check for collisions between party emojis and dancers
    for (let i = records.length - 1; i >= 0; i--) {
      for (let j = dancers.length - 1; j >= 0; j--) {
        let dx = records[i].x - dancers[j].x;
        let dy = records[i].y - dancers[j].y;
        let distance = sqrt(dx * dx + dy * dy);
        if (distance < (records[i].size/2 + 15)) {
          // Handle wristband collision
          if (records[i].type === 'wristband') {
            // Wristband only affects the target girl
            if (dancers[j] === targetGirlDancer && !girlHitWithWristband) {
              girlHitWithWristband = true;
              throwingWristbands = false; // Stop throwing wristbands
              
              // Play thank you sound
              if (ooohThankYouSound && ooohThankYouSound.isLoaded()) {
                ooohThankYouSound.setVolume(2.0); // Increase volume
                ooohThankYouSound.play();
              }
              
              // Trigger wristband zoom effect
              wristbandZoomPhase = "zooming_in";
              wristbandZoomTarget = { x: records[i].x, y: records[i].y }; // Store hit coordinates
              zoomedWristband = records[i]; // Store the actual wristband object
              wristbandZoomProgress = 0;
              wristbandZoomScale = 1;
              isGamePausedForZoom = true;
              console.log("🎯 Wristband zoom effect triggered! Target:", wristbandZoomTarget, "Phase:", wristbandZoomPhase);
              
              // Start the girl's journey to DJ booth
              dancers[j].startGoingToDJBooth();
              console.log("💃 Girl hit with wristband! Going to DJ booth!");
              
              // Mark this wristband for removal after zoom effect
              records[i].markedForRemoval = true;
          break;
        }
            // Wristband passes through other dancers without effect
          } else {
            // Normal emoji collision - only with dancers who are stopping or leaving
            if (dancers[j].state === 'leaving' || dancers[j].state === 'stopping') {
              // Play hit sequence (only if no milestone sounds are playing)
              if (recordHitSound && recordHitSound.isLoaded() && !isMilestoneSoundPlaying()) {
                if (!soundEffectsMuted) recordHitSound.play();
              }
              
              // Bring them back to dancing!
              dancers[j].returnToDancing();
              score++; // Increase score for saving a dancer
              
              // Hide swipe up text after first score
              if (score === 1) {
                showSwipeUpText = false;
              }
              
              // Track dancer saved event
              trackGameEvent('dancer_saved', {
                dancer_id: j,
                dancer_state: dancers[j].state,
                record_type: records[i].type,
                collision_position: { x: records[i].x, y: records[i].y }
              });
              
              // Track score event
              try {
                trackScoreEvent(score, {
                  dancer_saved: true,
                  dancer_id: j,
                  record_type: records[i].type,
                  player_id: playerID,
                  session_id: sessionID
                });
                console.log('📊 Score event tracked successfully for score:', score);
                
                // Check for score milestones
                const milestones = [];
                if (score >= 10 && !milestonesReached.includes(10)) {
                  milestones.push(10);
                  milestonesReached.push(10);
                }
                if (score >= 25 && !milestonesReached.includes(25)) {
                  milestones.push(25);
                  milestonesReached.push(25);
                }
                if (score >= 50 && !milestonesReached.includes(50)) {
                  milestones.push(50);
                  milestonesReached.push(50);
                }
                if (score >= 100 && !milestonesReached.includes(100)) {
                  milestones.push(100);
                  milestonesReached.push(100);
                }
                
                // Track milestone events if any reached
                if (milestones.length > 0) {
                  trackEvent('milestones_reached', {
                    milestones: milestones,
                    current_score: score,
                    player_id: playerID,
                    session_id: sessionID
                  });
                  console.log('🏆 Milestones reached:', milestones);
                }
              } catch (error) {
                console.error('❌ Error tracking score event:', error);
              }
              
              records.splice(i, 1); // Remove the record that hit
              break;
            }
            // If hit while dancing, emoji passes through (no collision)
          }
        }
      }
    }
    
    // Manage dancer population and leaving behavior
    if (frameCount % 60 === 0) {
      // Add new dancers if we have too few
      if (dancers.length < 15) {
        let x = random(width * 0.1, width * 0.9);
        let y = random(height * 0.3, height * 0.65);
        let speed = random(0.5, 1.5);
        let color = [random(100, 255), random(100, 255), random(100, 255)];
        let phrase = random(dancerPhrases);
        let mood = random(['happy', 'excited']);
        let gender = random() > 0.5 ? 'male' : 'female';
        let hairColor = [random(0, 100), random(0, 100), random(0, 255)];
        dancers.push(new Dancer(x, y, speed, color, phrase, mood, gender, hairColor));
      }
      
      // Random chance for a dancing dancer to decide to leave (not in autopilot)
      // Don't allow dancers to start leaving when wristbands are being thrown
      if (!autopilotMode && !throwingWristbands && dancers.length > 0 && random() < 0.15) {
        let dancingDancers = dancers.filter(d => d.state === 'dancing' && !d.hasWhiteAura);
        if (dancingDancers.length > 0) {
          let randomDancer = random(dancingDancers);
          randomDancer.startLeaving();
        }
      }
    }
    
    // Only show UI during actual gameplay
    if (gameState === 'playing') {
      // Display score and dancers left counter only
    fill(255);
    textSize(isMobile ? 16 : 20);
      textAlign(LEFT, CENTER);
      text("Score: " + score, 20, 30);
      text("Dancers Left: " + dancersLeft + "/3", 20, 55);
      
      // solidGroovesLogoImg and dc10LogoImg drawing removed
      
      // Draw swipe up text for mobile/touch devices only before first score
      if (isMobile && showSwipeUpText && swipeUpTextImg && swipeUpTextImg.width > 0) {
        imageMode(CENTER);
        let swipeTextWidth = 120; // Adjust size as needed
        let swipeTextHeight = (swipeUpTextImg.height / swipeUpTextImg.width) * swipeTextWidth;
        // Position at bottom left, underneath the DJ booth but a bit higher
        let swipeX = width * 0.25; // Left of DJ (who is at center)
        let swipeY = height * 0.92; // Below DJ booth area but higher than before
        image(swipeUpTextImg, swipeX, swipeY, swipeTextWidth, swipeTextHeight);
      }
      
    }
  }
  
  // Close zoom transformation
  pop();
  
  // Draw dancer leaving image notification (outside of zoom transformation)
  if (dancerLeavePhase === "displaying_image" || dancerLeavePhase === "zooming_out") {
    drawDancerLeaveImageNotification();
  }
}

// Function to update strobe light effect
function updateStrobeEffect() {
  // If strobe is not enabled yet, don't do anything
  if (!strobeEnabled) {
    return;
  }
  
  // Update strobe cooldown if it's active
  if (strobeCooldown > 0) {
    strobeCooldown--;
    strobeOn = false; // Ensure strobe is off during cooldown
    
    // Start a new burst after cooldown automatically
    if (strobeCooldown === 0) {
      triggerStrobeEffect(); // Start a new burst automatically
    }
    return;
  }
  
  // Update strobe timer
  strobeTimer++;
  
  // Change strobe state based on beat (every 7 frames - faster than before)
  if (strobeTimer % 7 === 0) {
    strobeOn = !strobeOn;
    
    // If turning on, increment the count
    if (strobeOn) {
      strobeCount++;
    }
    
    // If we've completed 5 flashes, start cooldown
    if (strobeCount >= 5) {
      strobeBurstActive = false; // End current burst
      strobeCooldown = 180; // 3 seconds cooldown (60 frames per second)
      strobeOn = false; // Turn off strobe
    }
  }
}

// Function to play score 2 sound and trigger strobe when finished
function playScore2Sound() {
  if (score5Sound && score5Sound.isLoaded()) {
    waitingForScore5Sound = true;
    score5Sound.play();
    
    // Set up callback for when sound finishes
    score5Sound.onended(() => {
      waitingForScore5Sound = false;
      strobeEnabled = true;
      triggerStrobeEffect();
    });
  } else {
    // If sound not available, enable strobe immediately
    strobeEnabled = true;
    triggerStrobeEffect();
  }
}

// Function to play score 4 sound and trigger smoke when finished
function playScore4Sound() {
  if (score10Sound && score10Sound.isLoaded()) {
    waitingForScore10Sound = true;
    score10Sound.play();
    
    // Set up callback for when sound finishes
    score10Sound.onended(() => {
      waitingForScore10Sound = false;
      triggerSmokeEffect();
    });
  } else {
    // If sound not available, trigger smoke immediately
    triggerSmokeEffect();
  }
}

// Function to play party started video and handle music dimming
function playPartyStartedVideo() {
  console.log('🎥 DISCO BALL EFFECT TRIGGERED - Playing party started video!');
  console.log('🎯 Current score:', score);
  console.log('Video object:', partyStartedVideo);
  console.log('Video object exists:', !!partyStartedVideo);
  
  // Check if video exists and is properly loaded
  if (partyStartedVideo && partyStartedVideo.elt && !partyStartedVideo.elt.error) {
    console.log('✅ Video object exists, attempting to play...');
    console.log('🔍 Video element details:', partyStartedVideo.elt);
    console.log('🔍 Video src:', partyStartedVideo.elt.src);
    console.log('🔍 Video readyState:', partyStartedVideo.elt.readyState);
    console.log('🔍 Video error:', partyStartedVideo.elt.error);
    
    videoPlaying = true;
    waitingForScore15Video = true;
    
    // Dim background music by 30%
    dimBackgroundMusic();
    
    // Show video full-screen and pause the game
    partyStartedVideo.show();
    partyStartedVideo.volume(1.0); // Maximum p5.js volume
    partyStartedVideo.elt.volume = 1.0; // Maximum HTML5 video volume
    partyStartedVideo.elt.muted = false; // Explicitly unmute
    
    console.log('🔊 Video audio settings:');
    console.log('Volume:', partyStartedVideo.elt.volume);
    console.log('Muted:', partyStartedVideo.elt.muted);
    
    // Make video full-screen
    partyStartedVideo.position(0, 0);
    partyStartedVideo.size(windowWidth, windowHeight);
    partyStartedVideo.style('z-index', '10000');
    partyStartedVideo.style('position', 'fixed');
    partyStartedVideo.style('background-color', 'black');
    partyStartedVideo.style('object-fit', 'cover'); // Changed from 'contain' to 'cover' to crop borders
    
    console.log('📺 Video set to full-screen mode');
    console.log('⏸️ Game paused for video playback');
    
    // Add timeout to prevent infinite loading
    let videoTimeout = setTimeout(() => {
      console.log('⏰ Video timeout - falling back to disco lights');
      if (partyStartedVideo) {
        partyStartedVideo.hide();
      }
      videoPlaying = false;
      waitingForScore15Video = false;
      enableDiscoBallLights();
    }, 5000); // 5 second timeout
    
    // Try to play and catch any errors
    try {
      const playPromise = partyStartedVideo.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          clearTimeout(videoTimeout); // Cancel timeout if video starts successfully
          console.log('✅ Video play() succeeded');
          console.log('🔊 Audio enabled:', !partyStartedVideo.elt.muted);
          console.log('🔊 Current volume:', partyStartedVideo.elt.volume);
          
          // Double-check audio settings after play starts
          setTimeout(() => {
            console.log('🔊 Audio check after 100ms:');
            console.log('Volume:', partyStartedVideo.elt.volume);
            console.log('Muted:', partyStartedVideo.elt.muted);
            console.log('Duration:', partyStartedVideo.elt.duration);
            console.log('Current time:', partyStartedVideo.elt.currentTime);
          }, 100);
          
        }).catch((error) => {
          clearTimeout(videoTimeout); // Cancel timeout if we get an error
          console.error('❌ Video play() failed:', error);
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          // If video fails, continue with game
          videoPlaying = false;
          waitingForScore15Video = false;
          if (partyStartedVideo) {
            partyStartedVideo.hide();
          }
          enableDiscoBallLights();
        });
      }
    } catch (error) {
      clearTimeout(videoTimeout); // Cancel timeout if we get an error
      console.error('❌ Video play() threw error:', error);
      // If video fails, continue with game
      videoPlaying = false;
      waitingForScore15Video = false;
      if (partyStartedVideo) {
        partyStartedVideo.hide();
      }
      enableDiscoBallLights();
    }
    
    console.log('📹 Video show() and play() called');
    
    // Set up callback for when video finishes
    partyStartedVideo.onended(() => {
      clearTimeout(videoTimeout); // Cancel timeout if video finishes normally
      console.log('🎥 Video finished, hiding and resuming game');
      videoPlaying = false;
      waitingForScore15Video = false;
      
      // Hide video
      partyStartedVideo.hide();
      
      // Restore background music volume
      restoreBackgroundMusic();
      
      // Enable disco ball light effects
      enableDiscoBallLights();
      
      console.log('▶️ Game resumed after video');
    });
  } else {
    console.log('❌ Party started video not available or failed to load!');
    if (partyStartedVideo && partyStartedVideo.elt && partyStartedVideo.elt.error) {
      console.log('❌ Video error:', partyStartedVideo.elt.error);
    }
    console.log('🔍 Please ensure score15_party_started.mp4 is in the Visual folder');
    // Fallback: enable lights immediately without crashing
    try {
      enableDiscoBallLights();
    } catch (error) {
      console.error('❌ Error enabling disco ball lights:', error);
    }
  }
}

// Function to enable disco ball light effects after video
function enableDiscoBallLights() {
  console.log('✨ Enabling disco ball sparkle effects');
  lightsEnabled = true;
  
  // Initialize light effects
  createDiscoBallLights();
  createFloorLights();
}

// Function to start zoom effect toward disco ball
function startZoomEffect() {
  console.log('🔍 Starting zoom effect toward disco ball');
  zoomActive = true;
  zoomProgress = 0;
  zoomScale = 1;
  
  // Set zoom target to the center of the disco ball graphic
  zoomStartX = width / 2;
  zoomStartY = discoBallY; // Zoom directly to the middle of the disco ball
}

// Function to update zoom effect
function updateZoomEffect() {
  if (!zoomActive) return;
  
  zoomProgress += zoomSpeed;
  zoomScale = 1 + (zoomProgress * 4); // Moderate zoom multiplier (reduced from 8 to 4)
  
  if (zoomProgress >= 1) {
    // Zoom complete, start video
    zoomActive = false;
    zoomProgress = 1;
    console.log('🔍 Zoom complete, starting video!');
    playPartyStartedVideo();
  }
}

// Function to apply zoom transformation
function applyZoomTransform() {
  if (!zoomActive) return;
  
  // Calculate zoom center point
  let zoomCenterX = zoomStartX;
  let zoomCenterY = zoomStartY;
  
  // Apply transformation
  translate(zoomCenterX, zoomCenterY);
  scale(zoomScale);
  translate(-zoomCenterX, -zoomCenterY);
}

// Function to trigger zoom effect to leaving dancer with sound
function triggerDancerLeaveZoom(dancerX, dancerY) {
  console.log(`🔍 Triggering zoom to leaving dancer at (${Math.floor(dancerX)}, ${Math.floor(dancerY)})`);
  isGamePausedForZoom = true; // PAUSE all other dancers
  
  // Play the player leaves floor sound
  if (playerLeavesFloorSound && playerLeavesFloorSound.isLoaded()) {
    playerLeavesFloorSound.play();
    waitingForDancerLeaveSound = true;
    console.log('🎵 Player leaves floor sound playing');
  }
  
  dancerLeaveZoomActive = true;
  dancerLeaveZoomProgress = 0;
  dancerLeaveZoomScale = 1;
  dancerLeavePhase = "zooming_in"; // Start the zooming_in phase
  
  // Set zoom target to dancer position
  dancerLeaveZoomX = dancerX;
  dancerLeaveZoomY = dancerY;
  
  // Reset timers
  dancerLeaveFreezeTimer = 0;
  dancerLeaveImageTimer = 0;
}

// Function to update dancer leaving zoom effect with phases
function updateDancerLeaveZoom() {
  if (!dancerLeaveZoomActive) return;

  if (dancerLeavePhase === "zooming_in") {
    // Phase 1: Zoom in to dancer
    dancerLeaveZoomProgress += dancerLeaveZoomSpeed;
    dancerLeaveZoomScale = 1 + (dancerLeaveZoomProgress * 2); // Zoom to 3x
    if (dancerLeaveZoomProgress >= 1) {
      dancerLeaveZoomProgress = 1;
      dancerLeaveZoomScale = 3;
      dancerLeavePhase = "displaying_image";
      dancerLeaveImageTimer = dancerLeaveImageDuration; // Start timer to display image
    }
  }
  else if (dancerLeavePhase === "displaying_image") {
    // Phase 2: Hold zoom and display image for a duration
    dancerLeaveImageTimer--;
    if (dancerLeaveImageTimer <= 0) {
      dancerLeavePhase = "zooming_out";
    }
  }
  else if (dancerLeavePhase === "zooming_out") {
    // Phase 3: Zoom back out
    dancerLeaveZoomProgress -= dancerLeaveZoomSpeed;
    dancerLeaveZoomScale = 1 + (dancerLeaveZoomProgress * 2);
    if (dancerLeaveZoomProgress <= 0) {
      // End of sequence, reset everything
      dancerLeavePhase = "inactive";
      dancerLeaveZoomActive = false;
      dancerLeaveZoomScale = 1;
      waitingForDancerLeaveSound = false;
      isGamePausedForZoom = false; // UNPAUSE all dancers

      // Find and remove the paused dancer now that the effect is over
      for (let i = dancers.length - 1; i >= 0; i--) {
        if (dancers[i].isPausedForZoom) {
          dancersLeft++;
          console.log(`⚠️ Dancer removed! Total left: ${dancersLeft}/3`);
          
          // Track dancer left event
          trackGameEvent('dancer_left', {
            dancer_id: i,
            dancer_state: dancers[i].state,
            total_dancers_left: dancersLeft,
            current_score: score,
            dancers_remaining: dancers.length - 1
          });
          
          dancers.splice(i, 1);
          
          // Check for game over condition after removing the dancer
          if (dancersLeft >= 3) {
            gameOver = true;
            gameState = 'gameOver';
            autopilotMode = true;
            gameOverReason = "Too many dancers left the party!";
            
            // Track game over event
            try {
              trackEvent('game_over', {
                final_score: score,
                highest_score: highestSessionScore,
                player_id: playerID,
                session_id: sessionID
              });
              console.log('📊 Game over event tracked successfully with score:', score);
            } catch (error) {
              console.error('❌ Error tracking game over event:', error);
            }
            
            pauseSoundCloudMusic();
            // Only play the game over sound if it's not already playing
            if (gameOverSound && gameOverSound.isLoaded() && !gameOverSound.isPlaying()) {
              gameOverSound.play();
            }
            if (supabaseClient && submitScoreForm) {
              updateFormPosition();
              submitScoreForm.style('display', 'block');
            }
            hideSoundCloudPlayer();
          }
          break; // Only remove one dancer per sequence
        }
      }
    }
  }
}

// Function to apply dancer leaving zoom transformation
function applyDancerLeaveZoomTransform() {
  if (!dancerLeaveZoomActive) return;
  
  // Apply transformation centered on leaving dancer
  translate(dancerLeaveZoomX, dancerLeaveZoomY);
  scale(dancerLeaveZoomScale);
  translate(-dancerLeaveZoomX, -dancerLeaveZoomY);
}

// Function to apply wristband zoom transformation
function applyWristbandZoomTransform() {
  if (wristbandZoomPhase === "inactive" || !zoomedWristband) return;
  
  // Apply transformation centered on the wristband
  translate(zoomedWristband.x, zoomedWristband.y);
  scale(wristbandZoomScale);
  translate(-zoomedWristband.x, -zoomedWristband.y);
}

// Function to draw dancer leaving image notification
function drawDancerLeaveImageNotification() {
  let currentImage;
  // Select the correct image based on how many dancers have left
  if (dancersLeft === 0) {
    currentImage = oneDancerLeftImg;
  } else if (dancersLeft === 1) {
    currentImage = secondDancerImg;
  } else {
    currentImage = thirdDancerImg;
  }

  if (!currentImage || !currentImage.width) return;

  // Fade effect based on zoom progress
  let alpha = 0;
  if (dancerLeavePhase === "displaying_image") {
    // Fade in
    alpha = map(dancerLeaveImageTimer, dancerLeaveImageDuration, 0, 0, 255);
  } else if (dancerLeavePhase === "zooming_out") {
    // Fade out
    alpha = map(dancerLeaveZoomProgress, 1, 0, 255, 0);
  }
  alpha = constrain(alpha, 0, 255);

  push();
  tint(255, alpha);
  imageMode(CENTER);

  // Calculate a scaled size for the image (30% of screen width)
  let imgWidth = width * 0.3;
  let imgHeight = currentImage.height * (imgWidth / currentImage.width);
  if (isNaN(imgHeight)) imgHeight = height * 0.3; // Fallback

  // Position the image adjacent to the dancer
  // Add an offset and ensure it stays within screen bounds
  let x = dancerLeaveZoomX + imgWidth * 0.6;
  let y = dancerLeaveZoomY - imgHeight * 0.6;
  x = constrain(x, imgWidth / 2, width - imgWidth / 2);
  y = constrain(y, imgHeight / 2, height - imgHeight / 2);

  image(currentImage, x, y, imgWidth, imgHeight);

  noTint(); // Reset tint
  pop();
}

// Function to update wristband zoom effect
function updateWristbandZoom() {
  if (wristbandZoomPhase === "inactive") return;

  console.log("🎯 Updating wristband zoom - Phase:", wristbandZoomPhase, "Progress:", wristbandZoomProgress, "Scale:", wristbandZoomScale);

  if (wristbandZoomPhase === "zooming_in") {
    // Phase 1: Zoom in to wristband
    wristbandZoomProgress += 0.02; // Much slower zoom (was 0.1)
    wristbandZoomScale = 1 + (wristbandZoomProgress * 3); // Zoom to 4x
    console.log("🎯 Zooming in - Progress:", wristbandZoomProgress, "Scale:", wristbandZoomScale);
    if (wristbandZoomProgress >= 1) {
      wristbandZoomProgress = 1;
      wristbandZoomScale = 4;
      wristbandZoomPhase = "displaying_wristband";
      wristbandDisplayTimer = 120; // Display for 2 seconds (was 60)
      console.log("🎯 Transitioned to displaying_wristband phase");
    }
  }
  else if (wristbandZoomPhase === "displaying_wristband") {
    // Phase 2: Hold zoom and display wristband
    wristbandDisplayTimer--;
    if (wristbandDisplayTimer <= 0) {
      wristbandZoomPhase = "zooming_out";
    }
  }
  else if (wristbandZoomPhase === "zooming_out") {
    // Phase 3: Zoom back out
    wristbandZoomProgress -= 0.02; // Much slower zoom out (was 0.1)
    wristbandZoomScale = 1 + (wristbandZoomProgress * 3);
    if (wristbandZoomProgress <= 0) {
      // End of sequence, reset everything
      wristbandZoomPhase = "inactive";
      wristbandZoomScale = 1;
      isGamePausedForZoom = false; // UNPAUSE all dancers
      zoomedWristband = null; // Reset the zoomed wristband
      console.log("🎯 Wristband zoom effect completed!");
      
      // Remove the marked wristband after zoom effect is complete
      for (let i = records.length - 1; i >= 0; i--) {
        if (records[i].markedForRemoval) {
          records.splice(i, 1);
          console.log("🎯 Marked wristband removed after zoom effect!");
          break;
        }
      }
    }
  }
}

// Function to apply wristband zoom transformation


// Function to pause background music during video
function dimBackgroundMusic() {
  const iframe = document.getElementById('soundcloud-iframe');
  if (iframe) {
    try {
      // Simply pause SoundCloud playback during video
      iframe.contentWindow.postMessage(JSON.stringify({
        method: 'pause'
      }), '*');
      
      // Visual indication that audio is paused
      iframe.style.opacity = '0.5';
      
      musicDimmed = true;
      console.log('⏸️ Background music paused for video');
    } catch (error) {
      console.log('⚠️ SoundCloud control limited, using visual indication only');
      iframe.style.opacity = '0.5';
      musicDimmed = true;
    }
  }
}

// Function to resume background music after video
function restoreBackgroundMusic() {
  const iframe = document.getElementById('soundcloud-iframe');
  if (iframe) {
    try {
      // Simply resume SoundCloud playback after video
      iframe.contentWindow.postMessage(JSON.stringify({
        method: 'play'
      }), '*');
      
      // Restore visual appearance
      iframe.style.opacity = '1';
      iframe.style.filter = 'none';
      
      musicDimmed = false;
      console.log('▶️ Background music resumed after video');
    } catch (error) {
      console.log('⚠️ SoundCloud control limited, restored visually only');
      iframe.style.opacity = '1';
      iframe.style.filter = 'none';
      musicDimmed = false;
    }
  }
}

// Function to pause background music for game over
function pauseSoundCloudMusic() {
  const iframe = document.getElementById('soundcloud-iframe');
  if (iframe) {
    try {
      // Pause SoundCloud playback
      iframe.contentWindow.postMessage(JSON.stringify({
        method: 'pause'
      }), '*');
      
      // Visual indication that music is paused
      iframe.style.opacity = '0.3';
      
      console.log('⏸️ Background music paused for game over');
    } catch (error) {
      console.log('⚠️ SoundCloud control limited, visual indication only');
      iframe.style.opacity = '0.3';
    }
  }
}

// Helper function to check if any milestone sounds are currently playing
function isMilestoneSoundPlaying() {
  return waitingForScore5Sound || waitingForScore10Sound || waitingForScore15Video;
}

// Function to trigger strobe effect
function triggerStrobeEffect() {
  strobeBurstActive = true;
  strobeCount = 0;
  strobeTimer = 0;
}

// Function to trigger smoke effect
function triggerSmokeEffect() {
  smokeActive = true;
  smokeTimer = 300; // Smoke active state lasts for 5 seconds (was 180)
  createFogParticles(); // Create fresh particles for the burst
  // smokeSound.play(); // Removed smoke sound
  if (smokeSound && smokeSound.isLoaded()) {
    smokeSound.play();
  }
}

// Function to trigger disco ball effect
function triggerDiscoBallEffect() {
  console.log('🪩 Triggering disco ball at score 2 (testing)!');
  console.log('🔇 STOPPING ALL AUDIO TO PREVENT CONFLICTS');
  
  // Check for any hidden audio elements that might be playing
  console.log('🔍 Checking for hidden audio elements...');
  const audioElements = document.querySelectorAll('audio');
  console.log('Found audio elements:', audioElements.length);
  audioElements.forEach((audio, index) => {
    console.log(`Audio ${index}:`, audio.src, 'Playing:', !audio.paused);
    if (!audio.paused) {
      console.log('🛑 Stopping hidden audio element:', audio.src);
      audio.pause();
      audio.currentTime = 0;
    }
  });
  
  // Emergency: Stop ALL audio in the entire page
  console.log('🚨 EMERGENCY: Stopping ALL audio and video elements');
  document.querySelectorAll('audio, video').forEach((element) => {
    element.pause();
    element.currentTime = 0;
    element.muted = true;
  });
  
  // Also check iframe audio (SoundCloud)
  const iframes = document.querySelectorAll('iframe');
  console.log('Found iframes:', iframes.length);
  iframes.forEach((iframe, index) => {
    console.log(`Iframe ${index}:`, iframe.src);
  });
  
  // Stop any potentially playing audio to prevent conflicts
  try {
    if (score5Sound && score5Sound.isPlaying && score5Sound.isPlaying()) score5Sound.stop();
    if (score10Sound && score10Sound.isPlaying && score10Sound.isPlaying()) score10Sound.stop();
    if (startGameSound && startGameSound.isPlaying && startGameSound.isPlaying()) startGameSound.stop();
    if (throwSound && throwSound.isPlaying && throwSound.isPlaying()) throwSound.stop();
    if (recordHitSound && recordHitSound.isPlaying && recordHitSound.isPlaying()) recordHitSound.stop();
    if (smokeSound && smokeSound.isPlaying && smokeSound.isPlaying()) smokeSound.stop();
  } catch (e) {
    console.log('Audio stop error (normal):', e);
  }
  
  discoBallActive = true;
  discoBallY = -100; // Start above screen
  
  // Position disco ball at top of screen (no longer positioned below DC-10 logo)
  let discoBallSize = isMobile ? 60 : 80; // Approximate disco ball size
  discoBallTargetY = 80; // Fixed position near top of screen
  
  // Debug disco ball positioning
  console.log('🪩 Disco ball positioning calculation:', {
    discoBallSize,
    discoBallTargetY,
    isMobile
  });
  
  discoBallLowered = false;
  musicDimmed = false;
  discoBallRotation = 0;
  videoPlaying = false;
  lightsEnabled = false;
  
  // Don't initialize light effects yet - wait for video to finish
}

// Smoke machine visual removed - function deleted

// Function to draw fog effect
function drawFogEffect() {
  noStroke();
  
  // Update and draw each fog particle
  for (let i = fogParticles.length - 1; i >= 0; i--) {
    let p = fogParticles[i];
    
    // Draw fog particle with fading opacity based on life
    fill(200, 200, 200, min(p.opacity, p.life));
    ellipse(p.x, p.y, p.size, p.size * 0.7);
    
    // Move fog particle in its direction
    p.x += cos(p.direction) * p.speed;
    p.y += sin(p.direction) * p.speed * 0.5; // Move up slower than sideways
    
    // Reduce particle life more slowly for lingering effect
    p.life -= 0.8; // Was 1.5, now slower decay
    
    // Remove dead particles
    if (p.life <= 0) {
      fogParticles.splice(i, 1);
    }
  }
}

// Function to update disco ball animation
function updateDiscoBall() {
  if (!discoBallLowered && discoBallY < discoBallTargetY) {
    // Lower the disco ball
    discoBallY += discoBallSpeed;
    
    // Check if reached target position
    if (discoBallY >= discoBallTargetY) {
      discoBallY = discoBallTargetY;
      discoBallLowered = true;
      
      // Start zoom effect first, then video
      console.log('🪩 Disco ball fully lowered, starting zoom effect!');
      startZoomEffect();
    }
  }
  
  // Update light effects only if lights are enabled
  if (discoBallActive && lightsEnabled) {
    // Update light reflections
    updateDiscoBallLights();
    updateFloorLights();
  }
}

// Function to draw disco ball and chain
function drawDiscoBall() {
  push();
  
  // Draw floor light spots first (behind everything) - only if lights enabled
  if (lightsEnabled) {
    drawFloorLights();
  }
  
  // Draw chain from top of screen to disco ball
  stroke(150);
  strokeWeight(3);
  line(width/2, 0, width/2, discoBallY); // Chain to center of ball

  // Draw the disco ball image or fallback shape
  let ballX = width / 2;
  let ballY = discoBallY;
  let imageToDraw = discoBallImg; // Default image

  // At score 12+, use the 5 o'clock point image unless girl has reached DJ booth
  if (score >= 12 && discoBallActive && !girlReachedDJBooth) {
    imageToDraw = discoBall5oclockImg;
  }
  // At score 8+ (or when girl reaches DJ booth), alternate the disco ball's eyes on the beat
  else if ((score >= 8 || girlReachedDJBooth) && discoBallActive) {
    if (frameCount % 60 === 0) { // Log once per second to avoid spam
      console.log(`Score is ${score}, alternating disco ball image. WinkState: ${discoBallWinkState}`);
    }
    if (discoBallWinkState === 0) {
      imageToDraw = discoBallSmirkLeftImg;
    } else {
      imageToDraw = discoBallSmirkRightImg;
    }
  }

  if (imageToDraw && imageToDraw.width > 0) {
    imageMode(CENTER);
    let imgWidth = 100;
    let imgHeight = imageToDraw.height * (imgWidth / imageToDraw.width);
    image(imageToDraw, ballX, ballY, imgWidth, imgHeight);
  } else {
    // Fallback if image not loaded
    fill(200);
    ellipse(ballX, ballY, 100, 100);
  }
  
  // Draw sparkles on top of the disco ball - only if lights enabled
  if (lightsEnabled) {
    drawDiscoBallSparkles(ballX, ballY);
  }

  pop();
}

// Function to create disco ball sparkles
function createDiscoBallLights() {
  discoBallLights = [];
  for (let i = 0; i < 8; i++) {
    discoBallLights.push({
      x: random(-40, 40),
      y: random(-40, 40),
      size: random(3, 8),
      brightness: random(150, 255),
      twinkleSpeed: random(0.05, 0.15),
      life: random(60, 120)
    });
  }
}

// Function to update disco ball sparkles
function updateDiscoBallLights() {
  for (let sparkle of discoBallLights) {
    sparkle.life--;
    
    // Regenerate sparkle if it fades out
    if (sparkle.life <= 0) {
      sparkle.x = random(-40, 40);
      sparkle.y = random(-40, 40);
      sparkle.size = random(3, 8);
      sparkle.brightness = random(150, 255);
      sparkle.twinkleSpeed = random(0.05, 0.15);
      sparkle.life = random(60, 120);
    }
  }
}

// Function to draw white sparkles on the disco ball
function drawDiscoBallSparkles(ballX, ballY) {
  for (let sparkle of discoBallLights) {
    push();
    
    // Calculate twinkling effect
    let twinkle = sin(frameCount * sparkle.twinkleSpeed) * 0.5 + 0.5;
    let alpha = map(sparkle.life, 0, 120, 0, sparkle.brightness) * twinkle;
    
    // Draw white sparkle
    fill(255, 255, 255, alpha);
    noStroke();
    ellipse(ballX + sparkle.x, ballY + sparkle.y, sparkle.size, sparkle.size);
    
    // Add smaller bright center
    fill(255, 255, 255, alpha * 1.5);
    ellipse(ballX + sparkle.x, ballY + sparkle.y, sparkle.size * 0.4, sparkle.size * 0.4);
    
    pop();
  }
}

// Function to create white floor light spots
function createFloorLights() {
  floorLights = [];
  
  // Create concentric circles extending to the entire dance floor
  let circles = [];
  let baseRadius = 25;
  let spacing = 15; // Starting spacing between circles
  let spacingIncrease = 1.3; // Multiplier for increasing spacing
  let currentRadius = baseRadius;
  
  // Calculate maximum radius to cover the dance floor (to screen edges)
  let maxRadius = Math.min(width, height) * 0.6; // 60% of screen size to cover dance floor
  
  let circleIndex = 0;
  while (currentRadius < maxRadius) {
    let count = Math.floor(6 + (circleIndex * 2.5)); // Gradually increase light count per circle
    let speed = -TWO_PI / (60 * (8 + random(-2, 6))); // Varied speeds around 6-14 RPM
    
    circles.push({
      radius: currentRadius,
      count: count,
      speed: speed
    });
    
    // Increase spacing progressively for next circle
    currentRadius += spacing;
    spacing *= spacingIncrease; // Each gap gets larger
    circleIndex++;
    
    // Safety check to prevent infinite loops
    if (circleIndex > 20) break;
  }
  
  console.log(`Created ${circles.length} concentric circles extending to radius ${Math.floor(currentRadius)}px`);
  
  for (let circleData of circles) {
    for (let i = 0; i < circleData.count; i++) {
      floorLights.push({
        angle: (i / circleData.count) * TWO_PI, // Evenly spaced around circle
        radius: circleData.radius, // Radius for this circle
        size: random(4, 8), // Very small circles of light
        brightness: random(200, 255), // Bright white light with variation
        rotationSpeed: circleData.speed, // Different speed for each circle
        baseAngle: (i / circleData.count) * TWO_PI, // Starting angle
        intensity: random(0.7, 1.0), // Intensity variation
        centerX: width / 2, // Center under disco ball
        centerY: discoBallY + 100, // Position below disco ball
        circleRadius: circleData.radius, // Store original radius
        z: random(-20, 40), // Z-depth: negative = closer, positive = farther
        baseZ: random(-20, 40) // Base Z for oscillation
      });
    }
  }
}

// Function to update white floor lights
function updateFloorLights() {
  for (let light of floorLights) {
    // Rotate the light counterclockwise at different RPMs
    light.angle += light.rotationSpeed;
    
    // Update position based on disco ball location
    light.centerX = width / 2;
    light.centerY = discoBallY + 100; // Always 100 pixels below disco ball
    
    // Animate Z-depth for floating effect
    light.z = light.baseZ + sin(frameCount * 0.02 + light.baseAngle) * 10;
    
    // Calculate perspective scale based on Z-depth
    let perspective = 200; // Perspective distance
    let scale = perspective / (perspective + light.z);
    
    // Calculate new position in circle with perspective
    let scaledRadius = light.radius * scale;
    light.x = light.centerX + cos(light.angle) * scaledRadius;
    light.y = light.centerY + sin(light.angle) * scaledRadius;
    
    // Scale size based on depth
    light.currentSize = light.size * scale;
    
    // Adjust brightness based on depth (closer = brighter)
    let depthBrightness = map(light.z, -30, 50, 1.2, 0.6);
    light.currentBrightness = light.brightness * light.intensity * depthBrightness * (0.9 + 0.1 * sin(frameCount * 0.1 + light.baseAngle));
  }
}

// Function to draw white floor lights with 3D depth effect
function drawFloorLights() {
  // Sort lights by Z-depth (draw farther lights first)
  let sortedLights = [...floorLights].sort((a, b) => b.z - a.z);
  
  for (let light of sortedLights) {
    push();
    
    let brightness = light.currentBrightness || light.brightness;
    let size = light.currentSize || light.size;
    
    // Draw depth-scaled white light spots
    noStroke();
    
    // Subtle outer glow - scales with depth
    fill(255, 255, 255, brightness * 0.15);
    ellipse(light.x, light.y, size * 2.5);
    
    // Main light spot - depth-scaled
    fill(255, 255, 255, brightness * 0.8);
    ellipse(light.x, light.y, size);
    
    // Bright center dot - tiny but intense, depth-scaled
    fill(255, 255, 255, brightness);
    ellipse(light.x, light.y, size * 0.3);
    
    // Add subtle shadow/depth indicator for lights that are "above" the floor
    if (light.z < 0) { // Closer lights cast subtle shadows
      fill(0, 0, 0, abs(light.z) * 2);
      ellipse(light.x + 2, light.y + 2, size * 0.8);
    }
    
    pop();
  }
}

function drawDanceFloor() {
  // Draw a grid pattern for the dance floor
  stroke(50, 50, 150);
  strokeWeight(1);
  for (let x = 0; x < width; x += 30) {
    for (let y = 0; y < height * 0.75; y += 30) { // Make room for DJ booth at bottom
      fill(30 + sin(frameCount * 0.05 + x * 0.1 + y * 0.1) * 20, 
           30 + cos(frameCount * 0.08 + x * 0.05) * 20, 
           80 + sin(frameCount * 0.03 + y * 0.05) * 20);
      rect(x, y, 30, 30);
    }
  }
  noStroke();
}

function drawDJBooth() {
  // DJ Booth - fixed size, centered
  fill(80);
  let boothY = height * 0.75;
  let boothWidth = 400; // Original fixed width
  let boothX = (width - boothWidth) / 2; // Center it
  rect(boothX, boothY, boothWidth, 50); // Original fixed height
  
  // Front panel of the booth
  fill(60);
  rect(boothX, boothY + 20, boothWidth, 30); // Front panel with texture
  
  // Add some texture/detail to the front panel
  fill(40);
  for (let i = 0; i < 8; i++) {
    rect(boothX + 20 + i * 50, boothY + 25, 30, 20, 3); // Decorative panels
  }
  
  fill(120);
  rect(boothX + 50, boothY - 20, 300, 20); // Mixer section
  
  // DJ equipment
  fill(150);
  let turntableY = boothY + 25;
  let leftTurntableX = boothX + 100;
  let rightTurntableX = boothX + 300;
  ellipse(leftTurntableX, turntableY, 50, 50); // Left turntable - fixed size
  ellipse(rightTurntableX, turntableY, 50, 50); // Right turntable - fixed size
  fill(30);
  rect(boothX + 175, boothY - 10, 50, 10); // Mixer
  
  // Draw small knobs and buttons on mixer
  for (let i = 0; i < 5; i++) {
    fill(255, 0, 0);
    let knobY = boothY - 15 + sin(frameCount * 0.1 + i) * 2;
    ellipse(boothX + 185 + i * 10, knobY, 5, 5);
  }
  
  // Animate turntables spinning
  push();
  translate(leftTurntableX, turntableY);
  rotate(frameCount * 0.05);
  fill(255);
  ellipse(0, 0, 20, 20); // Left record - fixed size
  fill(0);
  ellipse(0, 0, 10, 10); // Center hole
  fill(255, 0, 0);
  rect(-8, -1, 16, 2); // Record marking
  pop();
  
  push();
  translate(rightTurntableX, turntableY);
  rotate(-frameCount * 0.03);
  fill(255);
  ellipse(0, 0, 20, 20); // Right record - fixed size
  fill(0);
  ellipse(0, 0, 10, 10); // Center hole
  fill(0, 0, 255);
  rect(-8, -1, 16, 2); // Record marking
  pop();
}

function drawDJ() {
  // DJ seen from behind - responsive positioning
  
  // Calculate responsive DJ position
  let djCenterX = width / 2;
  let djY = height * 0.85;
  let djBodyWidth = width * 0.08;
  let djBodyHeight = height * 0.15;
  
  // Calculate bobbing and mixing animations
  let bobAmount = sin(frameCount * 0.1) * 5;
  let mixLeftAmount = sin(frameCount * 0.2) * 8;
  let mixRightAmount = cos(frameCount * 0.15) * 8;
  let knobTurn = sin(frameCount * 0.3) * 3;
  
  push();
  translate(0, bobAmount * 0.3); // Whole DJ body bobbing slightly
  
  // DJ body
  fill(50, 50, 60); // Dark shirt color
  rect(djCenterX - djBodyWidth/2, djY, djBodyWidth, djBodyHeight); // Body - responsive positioning
  
  // DJ shoulders
  fill(50, 50, 60);
  rect(djCenterX - djBodyWidth/2 - width * 0.01, djY, width * 0.02, height * 0.05); // Left shoulder
  rect(djCenterX + djBodyWidth/2 - width * 0.01, djY, width * 0.02, height * 0.05); // Right shoulder
  
  // DJ neck
  fill(150, 120, 90);
  rect(djCenterX - width * 0.008, djY - height * 0.03 + bobAmount, width * 0.016, height * 0.03 - bobAmount); // Neck
  
  // Draw DJ's left arm - mixing the left turntable
  push();
  let leftArmOriginX = djCenterX - djBodyWidth/2;
  let leftArmOriginY = djY + height * 0.02;
  translate(leftArmOriginX, leftArmOriginY);
  
  // Calculate arm angle to reach the left turntable
  let leftTurntableX = (width - 400) / 2 + 100; // Fixed turntable position
  let leftTurntableY = height * 0.75 + 25;
  let leftArmTargetX = leftTurntableX - leftArmOriginX;
  let leftArmTargetY = leftTurntableY - leftArmOriginY;
  let leftArmAngle = atan2(leftArmTargetY, leftArmTargetX);
  
  rotate(leftArmAngle + sin(frameCount * 0.2) * 0.2); // Base angle plus mixing motion
  
  fill(150, 120, 90); // Skin color
  rect(0, 0, 60, 10); // Left arm - horizontal orientation
  
  // Left hand on turntable
  translate(60, 0);
  fill(150, 120, 90);
  ellipse(0, 0, 15, 15); // Left hand
  
  // Show finger on record
  stroke(150, 120, 90);
  strokeWeight(3);
  line(0, 0, 5, -5 + sin(frameCount * 0.2) * 3); // Finger movement
  noStroke();
  pop();
  
  // DJ head from behind - bobbing to the beat
  push();
  translate(djCenterX, djY - height * 0.05 + bobAmount); // Move the head up and down - responsive positioning
  
  fill(150, 120, 90); // Skin color for back of head/neck
  ellipse(0, 0, width * 0.04, height * 0.06); // Head
  
  // DJ hair
  fill(40, 30, 20); // Dark hair
  arc(0, 0, 50, 50, PI, 2*PI, CHORD); // Hair on top of head
  
  // DJ headphones
  fill(80);
  ellipse(-25, 0, 20, 20); // Left headphone
  ellipse(25, 0, 20, 20); // Right headphone
  stroke(80);
  strokeWeight(5);
  line(-25, -10, 25, -10); // Headphone band
  strokeWeight(1);
  noStroke();
  
  pop(); // End head transform
  
  // DJ's right arm - adjusting knobs or right turntable
  // Moved after head so it appears in front
  push();
  let rightArmOriginX = djCenterX + djBodyWidth/2;
  let rightArmOriginY = djY + height * 0.02;
  translate(rightArmOriginX, rightArmOriginY);
  
  if (frameCount % 120 < 60) {
    // Adjusting mixer knobs
    let mixerX = (width - 400) / 2 + 200; // Fixed mixer position
    let mixerY = height * 0.75 - 10;
    let rightArmTargetX = mixerX - rightArmOriginX;
    let rightArmTargetY = mixerY - rightArmOriginY;
    let rightArmAngle = atan2(rightArmTargetY, rightArmTargetX);
    
    // Constrain the angle to keep arm in front of head
    rightArmAngle = constrain(rightArmAngle, -PI/2, -PI/8);
    
    rotate(rightArmAngle + sin(frameCount * 0.3) * 0.1); // Base angle plus small adjustments
    
    fill(150, 120, 90); // Skin color
    rect(0, 0, 70, 10); // Right arm - horizontal orientation
    
    // Right hand on mixer
    translate(70, 0);
    fill(150, 120, 90);
    ellipse(0, 0, 15, 15); // Right hand
    
    // Show finger adjusting knob
    fill(150, 120, 90);
    ellipse(0, -5, 5, 8); // Extended finger
  } else {
    // Mixing right turntable
    let rightTurntableX = (width - 400) / 2 + 300; // Fixed turntable position
    let rightTurntableY = height * 0.75 + 25;
    let rightArmTargetX = rightTurntableX - rightArmOriginX;
    let rightArmTargetY = rightTurntableY - rightArmOriginY;
    let rightArmAngle = atan2(rightArmTargetY, rightArmTargetX);
    
    // Constrain the angle to keep arm in front of head
    rightArmAngle = constrain(rightArmAngle, -PI/2, PI/4);
    
    rotate(rightArmAngle + cos(frameCount * 0.15) * 0.2); // Base angle plus mixing motion
    
    fill(150, 120, 90); // Skin color
    rect(0, 0, 60, 10); // Right arm - horizontal orientation
    
    // Right hand on turntable
    translate(60, 0);
    fill(150, 120, 90);
    ellipse(0, 0, 15, 15); // Right hand
    
    // Show finger on record
    stroke(150, 120, 90);
    strokeWeight(3);
    line(0, 0, 5, -5 + cos(frameCount * 0.15) * 3); // Finger movement
    noStroke();
  }
  pop();
  
  pop(); // End whole DJ bobbing
}

// Handle both mouse and touch input
function mousePressed() {
  handleInput(mouseX, mouseY);
}

function touchStarted() {
  if (isMobile && gameState === 'playing') {
    // Start swipe detection
    swipeStartX = touches[0].x;
    swipeStartY = touches[0].y;
    swipeStartTime = millis();
    isSwipeActive = true;
    
    console.log("👆 Touch started at:", swipeStartX, swipeStartY);
    return false; // Prevent default behavior
  } else if (isMobile && gameState === 'menu') {
    // For menu state, use regular tap handling
    handleInput(touches[0].x, touches[0].y);
    return false;
  } else if (isMobile && gameState === 'gameOver') {
    // For game over state, allow form interactions but also handle button clicks
    handleInput(touches[0].x, touches[0].y);
    // Don't prevent default - allow form inputs to work
    return true;
  }
}

function touchEnded() {
  if (isMobile && gameState === 'playing' && isSwipeActive) {
    // For touchEnded, we need to use the last known position from touchMoved or approximate
    let swipeEndX = mouseX; // p5.js updates mouseX/Y with touch position
    let swipeEndY = mouseY;
    let swipeTime = millis() - swipeStartTime;
    
    // Calculate swipe distance and direction
    let swipeDistanceX = swipeEndX - swipeStartX;
    let swipeDistanceY = swipeEndY - swipeStartY;
    let totalDistance = sqrt(swipeDistanceX * swipeDistanceX + swipeDistanceY * swipeDistanceY);
    
    console.log("👆 Touch ended - Distance:", totalDistance, "Time:", swipeTime, "Direction:", swipeDistanceX, swipeDistanceY);
    
    // Check if it's a valid swipe (minimum distance and upward direction)
    let minSwipeDistance = 50; // Minimum swipe distance
    let maxSwipeTime = 1000; // Maximum swipe time (1 second)
    let djX = width / 2;
    let djY = height * 0.85;
    let djAreaRadius = 100; // Area around DJ where swipe can start
    
    // Check if swipe started near DJ booth
    let distanceFromDJ = sqrt((swipeStartX - djX) * (swipeStartX - djX) + (swipeStartY - djY) * (swipeStartY - djY));
    
    if (totalDistance >= minSwipeDistance && 
        swipeTime <= maxSwipeTime && 
        swipeDistanceY < -20 && // Must be upward swipe (negative Y)
        distanceFromDJ <= djAreaRadius) {
      
      // Calculate target position based on swipe direction
      let targetX = djX + swipeDistanceX * 2; // Scale the horizontal direction
      let targetY = djY + swipeDistanceY * 2; // Scale the vertical direction
      
      // Constrain target to screen bounds
      targetX = constrain(targetX, 0, width);
      targetY = constrain(targetY, 0, height * 0.7); // Don't throw below dance floor
      
      console.log("🎯 Valid swipe detected! Throwing to:", targetX, targetY);
      
      // Create emoji throw using swipe direction
      createEmojiFromSwipe(djX, djY, targetX, targetY);
      
    } else {
      console.log("❌ Invalid swipe - Distance:", totalDistance, "Time:", swipeTime, "Upward:", swipeDistanceY < -20, "Near DJ:", distanceFromDJ <= djAreaRadius);
    }
    
    isSwipeActive = false;
    return false;
  }
}

// Function to create emoji from swipe gesture
function createEmojiFromSwipe(startX, startY, targetX, targetY) {
  console.log("🎮 Creating emoji from swipe - From:", startX, startY, "To:", targetX, targetY);
  
  // Calculate direction and speed
  let dx = targetX - startX;
  let dy = targetY - startY;
  let distance = sqrt(dx * dx + dy * dy);
  
  // Normalize direction
  let dirX = dx / distance;
  let dirY = dy / distance;
  
  // Set speed (similar to existing record creation)
  let speed = 15; // Increased to match desktop throwing speed
  let vx = dirX * speed;
  let vy = dirY * speed;
  
  console.log("Creating record with:", {x: startX, y: startY, vx: vx, vy: vy});
  
  // Increment emoji throw count
  emojiThrowCount++;
  
  // Determine what to throw (same logic as existing system)
  let emojiType;
  if (throwingWristbands) {
    emojiType = 'wristband';
  } else if (emojiThrowCount % 10 === 0) {
    emojiType = 'sandwich';
  } else {
    emojiType = 'party';
  }
  
  console.log("Swipe throw #" + emojiThrowCount + " - Type: " + emojiType);
  
  // Create new record with appropriate emoji type
  let newRecord = new Record(startX, startY, vx, vy, emojiType);
  records.push(newRecord);
  
  console.log("Records array length:", records.length);
  
  // Track emoji throw
  trackGameEvent('emoji_thrown', {
    emoji_type: emojiType,
    throw_position: { x: startX, y: startY },
    target_position: { x: targetX, y: targetY },
    input_method: 'swipe',
    velocity: { vx: vx, vy: vy }
  });
  
  // Play throw sound
  if (throwSound && throwSound.isLoaded()) {
    throwSound.play();
  }
}

function mouseMoved() {
  // Only change cursor on desktop (not mobile)
  if (!isMobile && gameState === 'menu') {
    // Calculate button position (same logic as in handleInput and drawMainMenu)
    let boxWidth = min(width * 0.9, 900);
    let boxHeight = min(height * 0.8, 700); // Reduced height to move everything up
    let boxY = (height - boxHeight) / 2 - 50; // Move entire box up by 50 pixels
    
    let logoBottomY;
    if (reecordsLogoImg && reecordsLogoImg.width > 0) {
      let logoWidth = min(boxWidth * 0.6, boxHeight * 0.2);
      let logoHeight = (reecordsLogoImg.height / reecordsLogoImg.width) * logoWidth;
      let logoY = boxY + boxHeight * 0.15;
      logoBottomY = logoY + logoHeight/2;
      
      // Check if mouse is over Reecords logo
      if (mouseX > width/2 - logoWidth/2 && mouseX < width/2 + logoWidth/2 &&
          mouseY > logoY - logoHeight/2 && mouseY < logoY + logoHeight/2) {
        cursor('pointer'); // Hand cursor for logo
        return; // Exit early since we found a clickable element
      }
    } else {
      let logoY = boxY + boxHeight * 0.15;
      logoBottomY = logoY + min(boxWidth * 0.08, boxHeight * 0.06) / 2;
    }
    
    let availableSpace = boxY + boxHeight - logoBottomY - boxHeight * 0.15;
    let gap = max(boxHeight * 0.08, availableSpace * 0.2);
    let vibecheckY = logoBottomY + gap;
    let subtitleY;
    
    if (vibecheckTaglineImg) {
      let imgWidth = min(boxWidth * 0.7, 400);
      let imgHeight = (vibecheckTaglineImg.height / vibecheckTaglineImg.width) * imgWidth;
      subtitleY = vibecheckY + imgHeight/2 + gap * 0.1;
    } else {
      let subtitleGap = gap * 0.5;
      let vibecheckTextSize = min(boxWidth * 0.08, boxHeight * 0.06);
      subtitleY = vibecheckY + vibecheckTextSize * 0.8 + subtitleGap;
    }
    
    let instructionsY = subtitleY + gap * 0.3;
    let instructionBoxHeight = boxHeight * 0.08;
    let instructionGap = boxHeight * 0.015;
    let thirdBoxY = instructionsY + (instructionBoxHeight + instructionGap) * 2;
    let buttonY = thirdBoxY + instructionBoxHeight + gap * 0.5;
    
    // Check if mouse is over Start Game button (use base size, not pulsing size for consistent hover)
    let buttonWidth = min(boxWidth * 0.4, 250);
    let buttonHeight = min(boxHeight * 0.08, 50);
    
    if (mouseX > width/2 - buttonWidth/2 && mouseX < width/2 + buttonWidth/2 &&
        mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      cursor('pointer'); // Hand cursor
      return; // Exit early since we found a clickable element
    }
    
    // Check if mouse is over CRXSS credit image
    let staticButtonHeight = min(boxHeight * 0.08, 50);
    let creditY = buttonY + staticButtonHeight + gap * 0.8;
    let creditImageHeight = boxHeight * 0.04;
    
    if (createdByCrxssImg) {
      let crxssWidth = (createdByCrxssImg.width / createdByCrxssImg.height) * creditImageHeight * 1.75;
      let crxssX = width/2;
      
      if (mouseX > crxssX - crxssWidth/2 && mouseX < crxssX + crxssWidth/2 &&
          mouseY > creditY - creditImageHeight * 1.75/2 && mouseY < creditY + creditImageHeight * 1.75/2) {
        cursor('pointer'); // Hand cursor for credit image
        return; // Exit early since we found a clickable element
      }
    }
    
    // If we get here, no clickable elements are hovered
    cursor('default'); // Default arrow cursor
  } else if (!isMobile && gameState === 'gameOver') {
    // Calculate Game Over button positions (same logic as in drawGameOverOverlay)
    let boxWidth = width * 0.6;
    let boxHeight = height * 0.7;
    let boxX = (width - boxWidth) / 2;
    let boxY = (height - boxHeight) / 2;
    let baseBtnWidth = boxWidth * 0.15;
    let baseBtnHeight = boxHeight * 0.08;
    let btnY = boxY + boxHeight * 0.88;
    
    // Check if mouse is over Play Again button (account for pulsing)
    let pulseScale = 1 + sin(frameCount * 0.1) * 0.05;
    let playAgainWidth = baseBtnWidth * pulseScale;
    let playAgainHeight = baseBtnHeight * pulseScale;
    let playAgainLeft = boxX + boxWidth * 0.3 - playAgainWidth/2;
    let playAgainRight = boxX + boxWidth * 0.3 + playAgainWidth/2;
    let playAgainTop = btnY + (baseBtnHeight - playAgainHeight)/2;
    let playAgainBottom = playAgainTop + playAgainHeight;
    
    // Check if mouse is over Main Menu button
    let mainMenuLeft = boxX + boxWidth * 0.7 - baseBtnWidth/2;
    let mainMenuRight = boxX + boxWidth * 0.7 + baseBtnWidth/2;
    let mainMenuTop = btnY;
    let mainMenuBottom = btnY + baseBtnHeight;
    
    if ((mouseX > playAgainLeft && mouseX < playAgainRight && 
         mouseY > playAgainTop && mouseY < playAgainBottom) ||
        (mouseX > mainMenuLeft && mouseX < mainMenuRight && 
         mouseY > mainMenuTop && mouseY < mainMenuBottom)) {
      cursor('pointer'); // Hand cursor
    } else {
      cursor('default'); // Default arrow cursor
    }
  } else {
    cursor('default'); // Default cursor for non-menu states
  }
}

function handleInput(inputX, inputY) {
  // Don't accept input during video playback
  if (videoPlaying) return;
  
  // Ensure audio context is started by user interaction
  userStartAudio();

  console.log("=== CLICK DETECTED ===");
  console.log("Click coordinates:", inputX, inputY);
  console.log("Game state:", gameState);
  console.log("Window size:", width, height);

  if (gameState === 'menu' && !waitingForStartSound) {
    // Calculate button position dynamically (same logic as in drawMainMenu)
    let boxWidth = min(width * 0.9, 900); // Further increased width for image space
    let boxHeight = min(height * 0.8, 700); // Reduced height to move everything up
    let boxY = (height - boxHeight) / 2 - 50; // Move entire box up by 50 pixels
    
    let logoBottomY;
    if (reecordsLogoImg && reecordsLogoImg.width > 0) {
      let logoWidth = min(boxWidth * 0.6, boxHeight * 0.2);
      let logoHeight = (reecordsLogoImg.height / reecordsLogoImg.width) * logoWidth;
      let logoY = boxY + boxHeight * 0.15;
      logoBottomY = logoY + logoHeight/2;
    } else {
      let logoY = boxY + boxHeight * 0.15;
      logoBottomY = logoY + min(boxWidth * 0.08, boxHeight * 0.06) / 2;
    }
    
    let availableSpace = boxY + boxHeight - logoBottomY - boxHeight * 0.15;
    let gap = max(boxHeight * 0.08, availableSpace * 0.2);
    let vibecheckY = logoBottomY + gap;
    let subtitleY;
    
    if (vibecheckTaglineImg) {
      // Account for vibecheck image dimensions
      let imgWidth = min(boxWidth * 0.7, 400);
      let imgHeight = (vibecheckTaglineImg.height / vibecheckTaglineImg.width) * imgWidth;
      subtitleY = vibecheckY + imgHeight/2 + gap * 0.1; // Reduced spacing below image
    } else {
      // Fallback text positioning
      let subtitleGap = gap * 0.5;
      let vibecheckTextSize = min(boxWidth * 0.08, boxHeight * 0.06);
      subtitleY = vibecheckY + vibecheckTextSize * 0.8 + subtitleGap;
    }
    
    // Calculate instructions area to position button after
    let instructionsY = subtitleY + gap * 0.3; // Reduced gap above instructions
    let instructionBoxHeight = boxHeight * 0.08;
    let instructionGap = boxHeight * 0.015; // Reduced gap between instructions
    let thirdBoxY = instructionsY + (instructionBoxHeight + instructionGap) * 2;
    let buttonY = thirdBoxY + instructionBoxHeight + gap * 0.5; // Reduced gap above button
    
    // Check if Start Game button was pressed (account for pulsing)
    let pulseScale = 1 + sin(frameCount * 0.1) * 0.05; // Same pulse calculation as draw
    let buttonWidth = min(boxWidth * 0.4, 250) * pulseScale;
    let buttonHeight = min(boxHeight * 0.08, 50) * pulseScale;
    let buttonX = width/2; // Center of the button
    
    console.log("=== BUTTON BOUNDS ===");
    console.log("Button left:", width/2 - buttonWidth/2);
    console.log("Button right:", width/2 + buttonWidth/2);
    console.log("Button top:", buttonY);
    console.log("Button bottom:", buttonY + buttonHeight);
    console.log("Button width:", buttonWidth);
    console.log("Button height:", buttonHeight);
    console.log("Pulse scale:", pulseScale);
    
    let inXBounds = inputX > width/2 - buttonWidth/2 && inputX < width/2 + buttonWidth/2;
    let inYBounds = inputY > buttonY && inputY < buttonY + buttonHeight;
    
    console.log("Click in X bounds:", inXBounds);
    console.log("Click in Y bounds:", inYBounds);
    
    if (inXBounds && inYBounds) {
      console.log("🎯 BUTTON CLICKED! Starting game...");
      
      // Track start game button click
      trackEngagement('start_game_button_clicked', {
        button_position: { x: buttonX, y: buttonY },
        click_position: { x: inputX, y: inputY }
      });
      
      startGame();
      return; // Exit early since we handled the click
    }
    
    // Check if Reecords logo was clicked
    if (reecordsLogoImg && reecordsLogoImg.width > 0) {
      let logoWidth = min(boxWidth * 0.6, boxHeight * 0.2);
      let logoHeight = (reecordsLogoImg.height / reecordsLogoImg.width) * logoWidth;
      let logoY = boxY + boxHeight * 0.15;
      
      let logoInXBounds = inputX > width/2 - logoWidth/2 && inputX < width/2 + logoWidth/2;
      let logoInYBounds = inputY > logoY - logoHeight/2 && inputY < logoY + logoHeight/2;
      
      if (logoInXBounds && logoInYBounds) {
        console.log("🎯 LOGO CLICKED! Opening Instagram...");
        
        // Track Instagram logo click
        trackEvent('url_click', {
          url: 'https://www.instagram.com/reecords_ofc/',
          context: 'instagram_logo',
          click_position: { x: inputX, y: inputY }
        });
        
        window.open('https://www.instagram.com/reecords_ofc/', '_blank');
        return; // Exit early since we handled the click
      }
    }
    
    // Check if CRXSS credit image was clicked
    if (createdByCrxssImg) {
      let staticButtonHeight = min(boxHeight * 0.08, 50);
      let creditY = buttonY + staticButtonHeight + gap * 0.8;
      let creditImageHeight = boxHeight * 0.04;
      let crxssWidth = (createdByCrxssImg.width / createdByCrxssImg.height) * creditImageHeight * 1.75;
      let crxssX = width/2;
      
      let creditInXBounds = inputX > crxssX - crxssWidth/2 && inputX < crxssX + crxssWidth/2;
      let creditInYBounds = inputY > creditY - creditImageHeight * 1.75/2 && inputY < creditY + creditImageHeight * 1.75/2;
      
      if (creditInXBounds && creditInYBounds) {
        console.log("🎯 CREDIT CLICKED! Opening Linktree...");
        
        // Track CRXSS credit click
        trackEvent('url_click', {
          url: 'https://linktr.ee/c_r_x_s_s',
          context: 'crxss_credit',
          click_position: { x: inputX, y: inputY }
        });
        
        window.open('https://linktr.ee/c_r_x_s_s', '_blank');
        return; // Exit early since we handled the click
      }
    }
    
    console.log("❌ Click outside all clickable areas");
  } else if (gameState === 'playing') {
    console.log("🎮 Playing state - creating record/emoji");
    
    // Calculate direction from DJ's position to input position
    let djX = width / 2;
    let djY = height * 0.85;
    let angle = atan2(inputY - djY, inputX - djX);
    
    // Calculate velocity components from angle
    let speed = 15; // Emoji throw speed (increased to reach top of screen)
    let vx = speed * cos(angle);
    let vy = speed * sin(angle);
    
    console.log("Creating record with:", {x: djX, y: djY, vx: vx, vy: vy});
    
    // Increment emoji throw count
    emojiThrowCount++;
    
    // Determine what to throw
    let emojiType;
    if (throwingWristbands) {
      emojiType = 'wristband';
    } else if (emojiThrowCount % 10 === 0) {
      emojiType = 'sandwich';
    } else {
      emojiType = 'party';
    }
    
    console.log("Throw #" + emojiThrowCount + " - Type: " + emojiType);
    
    // Create new record with appropriate emoji type
    let newRecord = new Record(djX, djY, vx, vy, emojiType);
    records.push(newRecord);
    
    console.log("Records array length:", records.length);
    
    // Track emoji throw
    trackGameEvent('emoji_thrown', {
      emoji_type: emojiType,
      throw_position: { x: djX, y: djY },
      velocity: { x: vx, y: vy },
      click_position: { x: inputX, y: inputY },
      records_count: records.length
    });
    
    // Play throw sound (only if no milestone sounds are playing)
    if (throwSound && throwSound.isLoaded() && !isMilestoneSoundPlaying()) {
      throwSound.play();
    } else if (!throwSound || !throwSound.isLoaded()) {
      console.log("Throw sound not available");
    }
  } else if (gameState === 'gameOver') {
    console.log("🎮 Game Over state - checking button clicks");
    
    // Use the same button positioning logic as drawGameOverOverlay
    let boxWidth = width * 0.6;
    let boxHeight = height * 0.7;
    let boxX = (width - boxWidth) / 2;
    let boxY = (height - boxHeight) / 2;
    let btnWidth = boxWidth * 0.15;
    let btnHeight = boxHeight * 0.08;
    let btnY = boxY + boxHeight * 0.85;
    
    console.log("Game Over button bounds:", {
      playAgainLeft: boxX + boxWidth * 0.3 - btnWidth/2,
      playAgainRight: boxX + boxWidth * 0.3 + btnWidth/2,
      leaderboardLeft: boxX + boxWidth * 0.5 - btnWidth/2,
      leaderboardRight: boxX + boxWidth * 0.5 + btnWidth/2,
      mainMenuLeft: boxX + boxWidth * 0.7 - btnWidth/2,
      mainMenuRight: boxX + boxWidth * 0.7 + btnWidth/2,
      buttonTop: btnY,
      buttonBottom: btnY + btnHeight,
      click: {x: inputX, y: inputY}
    });
    
    // Play Again button
    if (inputX > boxX + boxWidth * 0.3 - btnWidth/2 && inputX < boxX + boxWidth * 0.3 + btnWidth/2 &&
        inputY > btnY && inputY < btnY + btnHeight) {
      console.log("🔄 Play Again button clicked!");
      
      // Track play again button click
      trackEngagement('play_again_button_clicked', {
        final_score: score,
        click_position: { x: inputX, y: inputY }
      });
      
      restartGame();
    }
    // Leaderboard button
    else if (inputX > boxX + boxWidth * 0.5 - btnWidth/2 && inputX < boxX + boxWidth * 0.5 + btnWidth/2 &&
             inputY > btnY && inputY < btnY + btnHeight) {
      console.log("📊 Leaderboard button clicked!");
      
      // Track leaderboard button click
      trackEngagement('leaderboard_button_clicked', {
        final_score: score,
        click_position: { x: inputX, y: inputY }
      });
      
      showLeaderboard();
    }
    // Main Menu button
    else if (inputX > boxX + boxWidth * 0.7 - btnWidth/2 && inputX < boxX + boxWidth * 0.7 + btnWidth/2 &&
             inputY > btnY && inputY < btnY + btnHeight) {
      console.log("🏠 Main Menu button clicked!");
      
      // Track main menu button click
      trackEngagement('main_menu_button_clicked', {
        final_score: score,
        click_position: { x: inputX, y: inputY }
      });
      
      goToMainMenu();
    } else {
      console.log("❌ Click outside game over buttons");
    }
  }
}



// Function to start the game
function startGame() {
  console.log('🎮 startGame() called');
  console.log('🔊 startGameSound loaded:', startGameSound && startGameSound.isLoaded());
  
  // Activate audio context on user interaction
  if (getAudioContext().state !== 'running') {
    console.log('🔊 Activating audio context...');
    getAudioContext().resume().then(() => {
      console.log('🔊 Audio context activated!');
    });
  }
  
  // Play start game sound effect and wait for it to finish
  if (startGameSound && startGameSound.isLoaded()) {
    console.log('🔊 Playing start game sound...');
    if (!soundEffectsMuted) {
      startGameSound.play();
      waitingForStartSound = true;
    } else {
      console.log('🔇 Start game sound muted, skipping to actuallyStartGame()');
      actuallyStartGame();
    }
    
    // Set up callback for when sound finishes
    startGameSound.onended(() => {
      console.log('🔊 Start game sound finished, calling actuallyStartGame()');
      actuallyStartGame();
    });
  } else {
    // If sound not available, start immediately
    console.log('🔊 Sound not available, starting immediately');
    actuallyStartGame();
  }
}

// Function to actually transition to gameplay after sound finishes
function actuallyStartGame() {
  console.log('🚀 actuallyStartGame() called - about to start SoundCloud');
  waitingForStartSound = false;
  gameState = 'playing';
  autopilotMode = false;
  
  // Show SoundCloud widget when gameplay starts
  let soundcloudPlayer = document.getElementById('soundcloud-player');
  if (soundcloudPlayer) {
    soundcloudPlayer.style.display = 'block';
    console.log('🎵 SoundCloud widget displayed');
  }
  
  // Track game start
  trackGameEvent('game_started', {
    autopilot_mode: autopilotMode,
    player_id: playerID,
    session_id: sessionID
  });
  
  // Track device information specifically
  trackEvent('device_info', {
    device_type: deviceInfo.type,
    platform: deviceInfo.platform,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    screen_size: deviceInfo.screenSize,
    viewport_size: deviceInfo.viewportSize,
    pixel_ratio: deviceInfo.pixelRatio,
    is_touch: deviceInfo.isTouch
  });
  
  // Reset game state
  dancers = [];
  records = [];
  score = 0;
  gameOver = false;
  gameOverReason = "";
  dancersLeft = 0;
  milestonesReached = []; // Reset milestones for new game
  emojiThrowCount = 0; // Reset emoji counter
  
  // Reset special effects
  fogParticles = [];
  strobeTimer = 0;
  strobeOn = false;
  strobeCount = 0;
  strobeBurstActive = false;
  strobeCooldown = 0;
  strobeEnabled = false;
  waitingForScore5Sound = false;
  waitingForScore10Sound = false;
  waitingForScore15Video = false;
  smokeActive = false;
  smokeTimer = 0;
  lastStrobeCheck = 0;
  lastSmokeCheck = 0;
  lastDiscoBallCheck = 0; // Reset disco ball trigger check
  trackSwitchTimer = 0; // Reset track switching timer
  beatTimer = 0; // Reset beat timer
  isTrackEnding = false; // Reset track ending flag
  // sugaBagDropped removed - no longer used
  droppedItems = [];
  discoBallChangedAt8 = false;
  girlReachedDJBooth = false;
  mmmGettingDownPlayed = false;
  showSwipeUpText = true;
  
  // Reset swipe detection variables
  isSwipeActive = false;
  swipeStartX = 0;
  swipeStartY = 0;
  swipeStartTime = 0;
  bagPickupTriggered = false;
  bagPickupDancer = null;
  bagPickupTime = 0;
  wristbandThrown = false;
  throwingWristbands = false;
  targetGirlDancer = null;
  girlHitWithWristband = false;
  
  // Reset disco ball effect
  discoBallActive = false;
  discoBallY = -100;
  discoBallLowered = false;
  musicDimmed = false;
  discoBallRotation = 0;
  discoBallLights = [];
  floorLights = [];
  videoPlaying = false;
  lightsEnabled = false;
  
  // Ensure video is hidden and debug video state
  if (partyStartedVideo) {
    partyStartedVideo.hide();
    console.log('🎥 Video hidden on game start');
  }
  console.log('🎮 Game starting - videoPlaying:', videoPlaying);
  
  // Create initial dancers population
  populateDanceFloor();
  console.log('🎮 Initial dancers created:', dancers.length);
  
  // Reset wristband zoom effect
  wristbandZoomPhase = "inactive";
  wristbandZoomProgress = 0;
  wristbandZoomScale = 1;
  wristbandDisplayTimer = 0;
  zoomedWristband = null;
  
  // Reset zoom effects
  zoomActive = false;
  zoomProgress = 0;
  zoomScale = 1;
  
  // Reset dancer leaving zoom effect
  dancerLeaveZoomActive = false;
  dancerLeaveZoomProgress = 0;
  dancerLeaveZoomScale = 1;
  dancerLeavePhase = "inactive"; // Reset to inactive so dancers can trigger zoom effect
  dancerLeaveFreezeTimer = 0;
  dancerLeaveImageTimer = 0;
  dancerLeaveNotificationTimer = 0;
  waitingForDancerLeaveSound = false;
  
  // Hide video if it's showing
  if (partyStartedVideo) {
    partyStartedVideo.hide();
  }
  
  // Randomly select starting track for variety
  currentTrackIndex = Math.floor(Math.random() * tracks.length);
  console.log(`🎲 Random starting track: ${currentTrackIndex + 1} - ${tracks[currentTrackIndex].name}`);
  
  // Start SoundCloud player and music when gameplay begins
  console.log('🎵 About to call startSoundCloudPlayback()');
  startSoundCloudPlayback();
  console.log('🎵 startSoundCloudPlayback() call completed');
}



// Function to restart the game


// Function to go to main menu
function restartGame() {
  console.log("🔄 Restarting game...");
  
  // Stop the game over sound if it's playing
  if (gameOverSound && gameOverSound.isPlaying()) {
    gameOverSound.stop();
  }
  
  // Reset to playing state immediately
  gameState = 'playing';
  autopilotMode = false;
  
  // Reset all game variables
  dancers = [];
  records = [];
  score = 0;
  gameOver = false;
  gameOverReason = "";
  dancersLeft = 0;
  emojiThrowCount = 0; // Reset emoji counter
  
  // Reset special effects
  fogParticles = [];
  strobeTimer = 0;
  strobeOn = false;
  strobeCount = 0;
  strobeBurstActive = false;
  strobeCooldown = 0;
  strobeEnabled = false;
  waitingForScore5Sound = false;
  waitingForScore10Sound = false;
  waitingForScore15Video = false;
  smokeActive = false;
  smokeTimer = 0;
  lastStrobeCheck = 0;
  lastSmokeCheck = 0;
  lastDiscoBallCheck = 0; // Reset disco ball trigger check
  trackSwitchTimer = 0; // Reset track switching timer
  beatTimer = 0; // Reset beat timer
  isTrackEnding = false; // Reset track ending flag
  // sugaBagDropped removed - no longer used
  droppedItems = [];
  discoBallChangedAt8 = false;
  girlReachedDJBooth = false;
  mmmGettingDownPlayed = false;
  showSwipeUpText = true;
  
  // Reset swipe detection variables
  isSwipeActive = false;
  swipeStartX = 0;
  swipeStartY = 0;
  swipeStartTime = 0;
  bagPickupTriggered = false;
  bagPickupDancer = null;
  bagPickupTime = 0;
  wristbandThrown = false;
  throwingWristbands = false;
  targetGirlDancer = null;
  girlHitWithWristband = false;
  
  // Reset disco ball effect
  discoBallActive = false;
  discoBallY = -100;
  discoBallLowered = false;
  musicDimmed = false;
  discoBallRotation = 0;
  discoBallLights = [];
  floorLights = [];
  videoPlaying = false;
  lightsEnabled = false;
  
  // Reset zoom effects
  zoomActive = false;
  zoomProgress = 0;
  zoomScale = 1;
  
  // Reset dancer leaving zoom effect
  dancerLeaveZoomActive = false;
  dancerLeaveZoomProgress = 0;
  dancerLeaveZoomScale = 1;
  dancerLeavePhase = "inactive"; // Reset to inactive so dancers can trigger zoom effect
  dancerLeaveFreezeTimer = 0;
  dancerLeaveImageTimer = 0;
  dancerLeaveNotificationTimer = 0;
  waitingForDancerLeaveSound = false;
  
  // Hide video if it's showing
  if (partyStartedVideo) {
    partyStartedVideo.hide();
  }
  
  // Hide the score submission form if it exists
  if (submitScoreForm) {
    submitScoreForm.style('display', 'none');
  }
  
  // Populate the dance floor with new dancers
  populateDanceFloor();
  
  // Reset wristband zoom effect
  wristbandZoomPhase = "inactive";
  wristbandZoomProgress = 0;
  wristbandZoomScale = 1;
  wristbandDisplayTimer = 0;
  zoomedWristband = null;
  
  // Randomly select starting track for variety on restart
  currentTrackIndex = Math.floor(Math.random() * tracks.length);
  console.log(`🎲 Random restart track: ${currentTrackIndex + 1} - ${tracks[currentTrackIndex].name}`);
  
  // Start SoundCloud player and music when gameplay restarts
  startSoundCloudPlayback();
}

function goToMainMenu() {
  console.log("🏠 Going to main menu...");
  
  // Stop the game over sound if it's playing
  if (gameOverSound && gameOverSound.isPlaying()) {
    gameOverSound.stop();
  }
  
  gameState = 'menu';
  autopilotMode = false;
  gameOver = false;
  
  // Hide the score submission form if it exists
  if (submitScoreForm) {
    submitScoreForm.style('display', 'none');
  }
  
  // Hide SoundCloud player on main menu
  hideSoundCloudPlayer();
}

// Function to share score on mobile
function shareScore() {
  if (navigator.share) {
    navigator.share({
      title: 'Reecords Vibecheck',
      text: `I scored ${score} points in Reecords Vibecheck! Can you beat my score?`,
      url: window.location.href
    })
    .catch(error => console.log('Error sharing:', error));
  }
}



// Record class definition (now displays party emojis and sandwiches)
class Record {
  constructor(x, y, vx, vy, type = 'party') {
    this.id = frameCount + random(1000); // Assign a unique ID
    this.x = x;
    this.y = y;
    this.type = type; // 'party', 'sandwich', or 'wristband'
    
    if (type === 'sandwich') {
      // Sandwich emojis: slower speed and bigger size
      this.vx = vx * 0.7; // 30% slower
      this.vy = vy * 0.7; // 30% slower
      this.size = random(45, 60); // 50% bigger than party emojis (30-40 -> 45-60)
      this.rotationSpeed = 0.025; // 50% slower rotation (0.05 -> 0.025)
    } else if (type === 'wristband') {
      // Wristbands: fast and small
      this.vx = vx * 1.2; // 20% faster
      this.vy = vy * 1.2; // 20% faster
      this.size = random(25, 35); // Smaller than party emojis
      this.rotationSpeed = 0.1; // Faster rotation
    } else {
      // Party emojis: normal speed and size
    this.vx = vx;
    this.vy = vy;
      this.size = random(30, 40); // Normal size
      this.rotationSpeed = 0.05; // Normal rotation speed
    }
    
    this.gravity = 0.08; // Simulates downward acceleration (reduced for better range)
    this.rotation = 0;
    this.markedForRemoval = false;
  }
  
  update() {
    // If this is the wristband being zoomed, and zoom is active, do not update its position or rotation
    if (this === zoomedWristband && wristbandZoomPhase !== "inactive") {
      return;
    }
    this.vy += this.gravity; // Apply gravity
    this.x += this.vx; // Update horizontal position
    this.y += this.vy; // Update vertical position
    this.rotation += this.rotationSpeed; // Use dynamic rotation speed
  }
  
  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    
    // Draw different emoji types
    if (this.type === 'sandwich') {
      // Draw sandwich emoji
      if (sandwichImg && sandwichImg.width > 0) {
        imageMode(CENTER);
        image(sandwichImg, 0, 0, this.size, this.size);
      } else {
        this.drawFallbackSandwich();
      }
    } else if (this.type === 'wristband') {
      // Draw wristband
      if (wristbandImg && wristbandImg.width > 0) {
        imageMode(CENTER);
        // During zoom, don't apply rotation to keep original orientation
        if (wristbandZoomPhase !== "inactive") {
          // Don't rotate during zoom - keep original orientation
          // Apply a fixed rotation to correct the image orientation
          rotate(PI); // Flip the image 180 degrees to correct orientation
          image(wristbandImg, 0, 0, this.size, this.size);
        } else {
          // Normal rotation when not zooming
          image(wristbandImg, 0, 0, this.size, this.size);
        }
      } else {
        this.drawFallbackWristband();
      }
    } else {
      // Draw party emoji (default)
    if (partyEmojiImg && partyEmojiImg.width > 0) {
      imageMode(CENTER);
      image(partyEmojiImg, 0, 0, this.size, this.size);
    } else {
        this.drawFallbackParty();
      }
    }
    
    pop();
  }
  
  drawFallbackParty() {
      // Fallback: draw a bright colorful party projectile if image not loaded
      // Make it very different from the old record design
      
      // Outer glow
      fill(255, 100, 255, 100);
      noStroke();
      ellipse(0, 0, this.size * 1.2, this.size * 1.2);
      
      // Main party circle
      fill(255, 50, 150);
      stroke(255, 255, 0);
      strokeWeight(3);
      ellipse(0, 0, this.size, this.size);
      
      // Add rotating party sparkles
      fill(255, 255, 0);
      noStroke();
      for (let i = 0; i < 8; i++) {
        let angle = (TWO_PI / 8) * i + this.rotation * 2;
        let sparkleX = cos(angle) * (this.size * 0.3);
        let sparkleY = sin(angle) * (this.size * 0.3);
        ellipse(sparkleX, sparkleY, 6, 6);
      }
      
      // Center party symbol - larger and more obvious
      fill(255, 255, 255);
      textAlign(CENTER, CENTER);
      textSize(this.size * 0.6);
      text("🎉", 0, 0);
    }
    
  drawFallbackSandwich() {
    // Fallback: draw a simple sandwich if image not loaded
    
    // Sandwich base (bread)
    fill(222, 184, 135); // Tan/bread color
    stroke(160, 120, 80);
    strokeWeight(2);
    ellipse(0, 0, this.size, this.size * 0.8);
    
    // Filling layers
    fill(34, 139, 34); // Green (lettuce)
    noStroke();
    ellipse(0, -this.size * 0.1, this.size * 0.8, this.size * 0.2);
    
    fill(255, 99, 71); // Red (tomato)
    ellipse(0, 0, this.size * 0.8, this.size * 0.15);
    
    fill(255, 223, 0); // Yellow (cheese)
    ellipse(0, this.size * 0.1, this.size * 0.8, this.size * 0.15);
    
    // Sandwich symbol
    fill(139, 69, 19);
    textAlign(CENTER, CENTER);
    textSize(this.size * 0.4);
    text("🥪", 0, 0);
  }
  
  drawFallbackWristband() {
    // Fallback: draw a wristband shape if image not loaded
    fill(255, 20, 147); // Hot pink color
    stroke(200, 0, 100);
    strokeWeight(2);
    ellipse(0, 0, this.size, this.size * 0.6); // Oval shape for wristband
    
    // Inner band detail
    fill(255, 105, 180); // Lighter pink
    noStroke();
    ellipse(0, 0, this.size * 0.7, this.size * 0.3);
    
    // Sparkle effect
    fill(255);
    ellipse(-this.size * 0.2, -this.size * 0.1, 4, 4);
    ellipse(this.size * 0.2, this.size * 0.1, 4, 4);
  }
}

// Dancer class - club goers who dance but may try to leave
class Dancer {
  constructor(x, y, speed, color, phrase, mood, gender, hairColor) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.color = color;
    this.phrase = phrase;
    this.mood = mood;
    this.gender = gender;
    this.hairColor = hairColor;
    this.legOffset = 0;
    this.armOffset = 0;
    this.dancePhase = random(0, TWO_PI);
    this.danceRadius = random(20, 50);
    this.danceDirection = random([-1, 1]);
    this.danceSpeed = random(0.01, 0.03);
    this.danceAngle = random(0, TWO_PI);
    this.targetY = random(height * 0.3, height * 0.65);
    this.originalX = x;
    this.originalY = y;
    
    // New state system
    this.state = 'dancing'; // 'dancing', 'stopping', 'leaving', 'picking_up', 'going_to_dj', 'at_dj_booth'
    this.stateTimer = 0;
    this.exitDirection = null; // Will be set when starting to leave
    this.isPausedForZoom = false; // Flag to pause dancer during zoom effect
    this.targetPickupX = null; // Target x for bag pickup
    this.targetPickupY = null; // Target y for bag pickup
    this.isSpecialGirl = false; // Flag for the girl who won't turn red
    this.hasWhiteAura = false; // Flag for white aura effect
  }
  
  startLeaving() {
    // Special girl never leaves
    if (this.isSpecialGirl) {
      console.log("🎵 Special girl is immune to leaving!");
      return;
    }
    
    console.log(`👋 Dancer starting to leave! Current state: ${this.state}`);
    if (this.state === 'dancing') {
      this.state = 'stopping';
      this.stateTimer = 60; // Stop for 1 second
      console.log(`🟡 Dancer now in stopping state, timer: ${this.stateTimer}`);
      
      // Choose exit direction (left, right, or back)
      let directions = ['left', 'right', 'back'];
      this.exitDirection = random(directions);
      
      // Track dancer starting to leave
      trackGameEvent('dancer_starting_to_leave', {
        dancer_id: dancers.indexOf(this),
        exit_direction: this.exitDirection,
        current_score: score,
        dancers_remaining: dancers.length
      });
    }
  }
  
  returnToDancing() {
    this.state = 'dancing';
    this.stateTimer = 0;
    this.mood = 'excited'; // Happy to be back!
    this.phrase = random(dancerPhrases);
    
    // Update original position to where they were hit so they dance from this spot
    this.originalX = this.x;
    this.originalY = this.y;
    this.targetY = this.y; // Set target Y to current position
    
    // Reset dance parameters for new position
    this.danceAngle = random(0, TWO_PI);
    this.y += sin(frameCount * 0.1) * 0.5;
  }
  
  startPickingUp(targetX, targetY) {
    console.log(`💃 Female dancer starting to pick up bag!`);
    this.state = 'picking_up';
    this.targetPickupX = targetX;
    this.targetPickupY = targetY;
    this.stateTimer = 180; // 3 seconds to run and pick up
  }
  
  startGoingToDJBooth() {
    console.log(`🎵 Girl going to DJ booth!`);
    this.state = 'going_to_dj';
    this.isSpecialGirl = true; // Mark as special - won't turn red
    this.stateTimer = 300; // 5 seconds to reach DJ booth
  }
  
  update() {
    // Check global pause flag first, but allow the target dancer to be paused independently
    if (isGamePausedForZoom && !this.isPausedForZoom) {
      return; // Freeze dancer if game is paused for another dancer's zoom
    }
    
    if (this.isPausedForZoom) return; // Pause dancer if they are the zoom target

    // Update state timer
    this.stateTimer--;
    
    if (this.state === 'dancing') {
      // Normal dancing behavior
    if (abs(this.y - this.targetY) > 5) {
      this.y += (this.targetY - this.y) * 0.05;
    }
    
    this.danceAngle += this.danceSpeed * this.danceDirection;
    this.x = this.originalX + cos(this.danceAngle) * this.danceRadius;
      this.y = this.originalY + sin(this.danceAngle) * (this.danceRadius * 0.5);
      
      this.x = constrain(this.x, width * 0.05, width * 0.95);
      this.y = constrain(this.y, height * 0.3, height * 0.65);
      
      this.legOffset = sin(frameCount * 0.2 + this.dancePhase) * 8;
      this.armOffset = cos(frameCount * 0.15 + this.dancePhase) * 15;
      
    } else if (this.state === 'stopping') {
      // Standing still, looking tired
      this.legOffset = 0;
      this.armOffset = sin(frameCount * 0.05) * 3; // Small arm movement
      
      if (this.stateTimer <= 0) {
        console.log(`🔄 Dancer transitioning from stopping to leaving`);
        this.state = 'leaving';
        this.stateTimer = 300; // Give time to reach edge
      }
      
    } else if (this.state === 'leaving') {
      // Moving toward exit
      if (this.exitDirection === 'left') {
        this.x -= this.speed;
      } else if (this.exitDirection === 'right') {
        this.x += this.speed;
      } else { // 'back'
        this.y -= this.speed;
      }
      
      // Walking animation
      this.legOffset = sin(frameCount * 0.1 + this.x) * 5;
      this.armOffset = cos(frameCount * 0.1 + this.x) * 5;
      
    } else if (this.state === 'picking_up') {
      // Move toward the bag
      let dx = this.targetPickupX - this.x;
      let dy = this.targetPickupY - this.y;
      let distance = sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        // Run toward the bag
        this.x += (dx / distance) * this.speed * 2; // Run faster
        this.y += (dy / distance) * this.speed * 2;
        
        // Running animation
        this.legOffset = sin(frameCount * 0.3) * 15; // Faster leg movement
        this.armOffset = cos(frameCount * 0.3) * 20; // Faster arm movement
      } else {
        // Reached the bag, pick it up
        this.legOffset = 0;
        this.armOffset = sin(frameCount * 0.1) * 5; // Slight arm movement while picking up
        
        // After a moment, return to dancing
        if (this.stateTimer <= 120) { // After 1 second at the bag
          // Remove the bag from droppedItems
          for (let i = droppedItems.length - 1; i >= 0; i--) {
            if (abs(droppedItems[i].x - this.targetPickupX) < 10 && 
                abs(droppedItems[i].y - this.targetPickupY) < 10) {
              droppedItems.splice(i, 1);
              console.log("💰 Bag picked up!");
              // Record the pickup time
              bagPickupTime = millis();
              break;
            }
          }
          // Return to dancing
          this.returnToDancing();
        }
      }
      
      this.stateTimer--;
      
    } else if (this.state === 'going_to_dj') {
      // Move toward the far right of the DJ booth (no overlap with DJ)
      let targetX = width / 2 + 120; // Far right of DJ booth
      let targetY = height * 0.85; // Behind the DJ booth - correct position
      let dx = targetX - this.x;
      let dy = targetY - this.y;
      let distance = sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        // Walk to DJ booth
        this.x += (dx / distance) * this.speed * 1.5; // Walk faster
        this.y += (dy / distance) * this.speed * 1.5;
        
        // Walking animation
        this.legOffset = sin(frameCount * 0.15) * 8;
        this.armOffset = cos(frameCount * 0.15) * 10;
      } else {
        // Reached DJ booth
        this.state = 'at_dj_booth';
        this.x = targetX;
        this.y = targetY;
        girlReachedDJBooth = true; // Set global flag
        console.log("🎧 Girl reached DJ booth!");
      }
      
      this.stateTimer--;
      
    } else if (this.state === 'at_dj_booth') {
              // Dance behind the DJ booth with back to player - stay in place
        this.danceAngle += 0.02;
        this.x = width / 2 + 120; // Fixed position to the right side of DJ booth
        this.y = height * 0.85; // Fixed position behind DJ booth
      
      // Dancing animation
      this.legOffset = sin(frameCount * 0.2) * 10;
      this.armOffset = cos(frameCount * 0.15) * 15;
    }
  }
  
  draw() {
    push();
    
    // Add glow effect - different colors based on state
    noStroke();
    
    // White aura takes priority over other glows
    if (this.hasWhiteAura) {
      fill(255, 255, 255, 100); // Bright white glow
      ellipse(this.x, this.y + 15, 70, 70); // Slightly larger than normal glow
    } else if (this.state === 'dancing') {
      fill(0, 255, 0, 80); // Green glow when dancing
    } else if (this.state === 'stopping') {
      fill(255, 255, 0, 80); // Yellow glow when stopping
    } else if (this.state === 'picking_up') {
      fill(255, 0, 255, 80); // Purple glow when picking up
    } else if (this.state === 'going_to_dj' || this.state === 'at_dj_booth') {
      fill(255, 20, 147, 80); // Hot pink glow for DJ booth states
    } else { // leaving
      fill(255, 0, 0, 80); // Red glow when leaving
    }
    ellipse(this.x, this.y + 15, 60, 60);
    
    if (this.gender === 'male') {
      this.drawMaleDancer();
    } else {
      if (this.state === 'at_dj_booth') {
        this.drawFemaleDancerBackView();
    } else {
      this.drawFemaleDancer();
      }
    }
    
    // Speech bubbles removed for cleaner interface
    
    pop();
  }
  

  
  drawMaleDancer() {
    // Draw legs with dancing animation
    fill(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7);
    
    // Left leg bent at knee for dancing
    push();
    translate(this.x - 10, this.y + 30);
    rotate(radians(this.legOffset));
    rect(-5, 0, 10, 20); // Left leg
    // Left foot
    fill(40);
    translate(0, 20);
    ellipse(0, 0, 12, 6); // Left foot
    pop();
    
    // Right leg bent at knee for dancing
    push();
    translate(this.x + 10, this.y + 30);
    rotate(radians(-this.legOffset));
    rect(-5, 0, 10, 20); // Right leg
    // Right foot
    fill(40);
    translate(0, 20);
    ellipse(0, 0, 12, 6); // Right foot
    pop();
    
    // Draw body with slight bounce
    fill(this.color);
    ellipse(this.x, this.y + sin(frameCount * 0.2) * 2, 30, 35); // Rounded torso
    
    // Draw arms with dancing animation - more energetic
    fill(this.color[0] * 0.8, this.color[1] * 0.8, this.color[2] * 0.8);
    
    // Left arm raised for dancing
    push();
    translate(this.x - 15, this.y);
    rotate(radians(-60 - this.armOffset));
    rect(-5, 0, 10, 25); // Left arm
    // Left hand
    fill(255, 224, 189);
    translate(0, 25);
    ellipse(0, 0, 8, 8); // Left hand
    pop();
    
    // Right arm raised for dancing
    push();
    translate(this.x + 15, this.y);
    rotate(radians(60 + this.armOffset));
    rect(-5, 0, 10, 25); // Right arm
    // Right hand
    fill(255, 224, 189);
    translate(0, 25);
    ellipse(0, 0, 8, 8); // Right hand
    pop();
    
    // Draw head with slight tilt
    push();
    translate(this.x, this.y - 15);
    rotate(radians(sin(frameCount * 0.1 + this.dancePhase) * 15)); // Head bobbing to music
    
    fill(255, 224, 189);
    ellipse(0, 0, 30, 30); // Head
    
    // Draw short hair
    fill(this.hairColor);
    arc(0, 0, 34, 34, PI, 2*PI, CHORD);
    
    // Draw facial expression based on state and mood
    if (this.state === 'leaving' || this.state === 'stopping') {
      // Tired/leaving expression
      fill(0);
      ellipse(-7, -5, 4, 4); // Left eye
      ellipse(7, -5, 4, 4); // Right eye
      stroke(0);
      line(-5, 5, 5, 5); // Neutral/tired mouth
      noStroke();
    } else if (this.mood === 'happy') {
      fill(0);
      ellipse(-7, -5, 4, 4); // Left eye
      ellipse(7, -5, 4, 4); // Right eye
      noFill();
      stroke(0);
      arc(0, 5, 15, 10, 0, PI); // Smile
      noStroke();
    } else { // excited
      fill(0);
      ellipse(-7, -5, 4, 4); // Left eye
      ellipse(7, -5, 4, 4); // Right eye
      ellipse(0, 5, 8, 8); // Open mouth
      fill(255, 0, 0);
      ellipse(0, 5, 4, 4); // Tongue
    }
    pop();
  }
  
  drawFemaleDancer() {
    // Draw legs with dancing animation
    
    // Draw skirt with movement
    fill(this.color);
    beginShape();
    vertex(this.x - 20 + sin(frameCount * 0.2) * 5, this.y + 30);
    vertex(this.x + 20 + sin(frameCount * 0.2) * -5, this.y + 30);
    vertex(this.x, this.y);
    endShape(CLOSE);
    
    // Left leg bent at knee for dancing
    push();
    translate(this.x - 8, this.y + 30);
    rotate(radians(this.legOffset));
    fill(255, 224, 189);
    rect(-4, 0, 8, 15); // Left leg
    // Left high heel
    fill(0);
    translate(-2, 15);
    rect(0, 0, 10, 5); // Left shoe
    line(0, 5, -3, 5); // Left heel
    pop();
    
    // Right leg bent at knee for dancing
    push();
    translate(this.x + 8, this.y + 30);
    rotate(radians(-this.legOffset));
    fill(255, 224, 189);
    rect(-4, 0, 8, 15); // Right leg
    // Right high heel
    fill(0);
    translate(-2, 15);
    rect(0, 0, 10, 5); // Right shoe
    line(10, 5, 13, 5); // Right heel
    pop();
    
    // Draw upper body with slight bounce
    fill(this.color[0], this.color[1], this.color[2]);
    ellipse(this.x, this.y + sin(frameCount * 0.2) * 2, 24, 30); // Rounded torso
    
    // Draw arms with dancing animation - more raised for female dancers
    fill(255, 224, 189);
    
    // Left arm raised for dancing - more energetic
    push();
    translate(this.x - 12, this.y);
    rotate(radians(-80 - this.armOffset));
    rect(-4, 0, 8, 20); // Left arm
    // Left hand
    translate(0, 20);
    ellipse(0, 0, 8, 8); // Left hand
    pop();
    
    // Right arm raised for dancing - more energetic
    push();
    translate(this.x + 12, this.y);
    rotate(radians(80 + this.armOffset));
    rect(-4, 0, 8, 20); // Right arm
    // Right hand
    translate(0, 20);
    ellipse(0, 0, 8, 8); // Right hand
    pop();
    
    // Draw head with slight tilt
    push();
    translate(this.x, this.y - 15);
    rotate(radians(sin(frameCount * 0.1 + this.dancePhase) * 15)); // Head bobbing to music
    
    fill(255, 224, 189);
    ellipse(0, 0, 28, 28); // Slightly smaller head
    
    // Draw long hair with movement
    fill(this.hairColor);
    arc(0, 0, 34, 34, PI, 2*PI, CHORD); // Hair on top
    
    // Hair strands with movement
    push();
    translate(-17, 0);
    rotate(radians(sin(frameCount * 0.15 + this.dancePhase) * 10)); // Hair swaying more
    rect(0, 0, 7, 30); // Left hair strand
    pop();
    
    push();
    translate(10, 0);
    rotate(radians(sin(frameCount * 0.15 + PI + this.dancePhase) * 10)); // Hair swaying opposite
    rect(0, 0, 7, 30); // Right hair strand
    pop();
    
    // Draw facial expression based on state and mood
    if (this.state === 'leaving' || this.state === 'stopping') {
      // Tired/leaving expression
      fill(0);
      ellipse(-7, -5, 4, 4); // Left eye
      ellipse(7, -5, 4, 4); // Right eye
      stroke(0);
      line(-5, 5, 5, 5); // Neutral/tired mouth
      noStroke();
    } else if (this.mood === 'happy') {
      fill(0);
      ellipse(-7, -5, 4, 4); // Left eye
      ellipse(7, -5, 4, 4); // Right eye
      noFill();
      stroke(0);
      arc(0, 5, 15, 10, 0, PI); // Smile
      noStroke();
    } else { // excited
      fill(0);
      ellipse(-7, -5, 4, 4); // Left eye
      ellipse(7, -5, 4, 4); // Right eye
      ellipse(0, 5, 8, 8); // Open mouth
      fill(255, 0, 0);
      ellipse(0, 5, 4, 4); // Tongue
    }
    pop();
  }
  
  drawFemaleDancerBackView() {
    // Draw legs with dancing animation - same as front view
    
    // Draw skirt with movement
    fill(this.color);
    beginShape();
    vertex(this.x - 20 + sin(frameCount * 0.2) * 5, this.y + 30);
    vertex(this.x + 20 + sin(frameCount * 0.2) * -5, this.y + 30);
    vertex(this.x, this.y);
    endShape(CLOSE);
    
    // Left leg
    push();
    translate(this.x - 8, this.y + 30);
    rotate(radians(this.legOffset));
    fill(255, 224, 189);
    rect(-4, 0, 8, 15);
    fill(0);
    translate(-2, 15);
    rect(0, 0, 10, 5);
    line(0, 5, -3, 5);
    pop();
    
    // Right leg
    push();
    translate(this.x + 8, this.y + 30);
    rotate(radians(-this.legOffset));
    fill(255, 224, 189);
    rect(-4, 0, 8, 15);
    fill(0);
    translate(6, 15);
    rect(0, 0, 10, 5);
    line(10, 5, 13, 5);
    pop();
    
    // Draw body
    fill(this.color[0] * 0.8, this.color[1] * 0.8, this.color[2] * 0.8);
    ellipse(this.x, this.y + sin(frameCount * 0.2) * 2, 28, 32);
    
    // Draw arms - raised up dancing
    fill(255, 224, 189);
    push();
    translate(this.x - 12, this.y - 5);
    rotate(radians(-45 + this.armOffset));
    rect(-4, 0, 8, 20);
    translate(0, 20);
    ellipse(0, 0, 8, 8);
    pop();
    
    push();
    translate(this.x + 12, this.y - 5);
    rotate(radians(45 - this.armOffset));
    rect(-4, 0, 8, 20);
    translate(0, 20);
    ellipse(0, 0, 8, 8);
    pop();
    
    // Draw head from behind
    push();
    translate(this.x, this.y - 15);
    
    // Back of head
    fill(255, 224, 189);
    ellipse(0, 0, 28, 28);
    
    // Hair from behind - covers most of head
    fill(this.hairColor);
    arc(0, 0, 32, 32, PI, 2*PI, CHORD);
    arc(0, 0, 32, 32, 0, PI, OPEN);
    
    // Hair strands
    push();
    translate(-15, 0);
    rotate(radians(sin(frameCount * 0.15) * 5));
    rect(0, 0, 7, 30);
    pop();
    
    push();
    translate(8, 0);
    rotate(radians(sin(frameCount * 0.15 + PI) * 5));
    rect(0, 0, 7, 30);
    pop();
    
    pop();
  }
}

// Function to create the score submission form
function createScoreForm() {
  try {
    submitScoreForm = createDiv('');
    submitScoreForm.class('score-form');
    
    // Center the form horizontally and position it below the score, before leaderboard
    // Use overlay-relative positioning to match drawGameOverOverlay()
    let boxWidth = isMobile ? width * 0.9 : width * 0.6;
    let boxHeight = isMobile ? height * 0.95 : height * 0.7;
    let boxX = (width - boxWidth) / 2;
    let boxY = isMobile ? height * 0.025 : (height - boxHeight) / 2;
    // USE GLOBAL POSITIONS - NO FAKE RULES
    let pos = GLOBAL_POSITIONS || calculateRealPositions();
    let formY = pos.formStart;
    
    submitScoreForm.style('position', 'absolute');
    submitScoreForm.style('left', '50%');
    submitScoreForm.style('transform', 'translateX(-50%)');
    submitScoreForm.style('top', formY + 'px');
    submitScoreForm.style('width', (isMobile ? width * 0.8 : width * 0.5) + 'px');
    submitScoreForm.style('text-align', 'center');
    submitScoreForm.style('z-index', '10001');
    submitScoreForm.style('display', 'none');
    submitScoreForm.style('background-color', 'transparent');
    submitScoreForm.style('padding', '10px');
    submitScoreForm.style('border', 'none');
    submitScoreForm.style('pointer-events', 'all');
    submitScoreForm.style('user-select', 'auto'); // Allow text selection in inputs
    
    console.log('🔧 Form created with styles:', {
      position: 'absolute',
      zIndex: '10001',
      display: 'none (will be shown on game over)',
      pointerEvents: 'all'
    });
    
    // Create a container for the form layout (vertical on mobile, horizontal on desktop)
    let formContainer = createDiv('');
    formContainer.parent(submitScoreForm);
    formContainer.style('display', 'flex');
    formContainer.style('flex-direction', isMobile ? 'column' : 'row');
    formContainer.style('gap', isMobile ? '8px' : '10px');
    formContainer.style('align-items', isMobile ? 'center' : 'flex-start'); // Center on mobile, top align on desktop
    formContainer.style('justify-content', 'center');
    formContainer.style('margin-bottom', '5px');
    
    let nameInput = createInput('').attribute('placeholder', 'Your Name');
    nameInput.parent(formContainer);
    nameInput.style('width', isMobile ? '280px' : '150px');
    nameInput.style('padding', isMobile ? '15px' : '10px');
    nameInput.style('font-size', isMobile ? '18px' : '14px');
    nameInput.style('background-color', '#2a2a2a');
    nameInput.style('border', '2px solid #FFD700');
    nameInput.style('border-radius', '6px');
    nameInput.style('color', 'white');
    nameInput.style('box-sizing', 'border-box');
    nameInput.style('height', '42px'); // Explicit height
    nameInput.style('pointer-events', 'auto');
    nameInput.style('user-select', 'text');
    nameInput.input(() => {
      playerName = nameInput.value();
      console.log('📝 Name input changed:', playerName);
    });
    
    let emailInput = createInput('').attribute('placeholder', 'Email Address');
    emailInput.parent(formContainer);
    emailInput.style('width', isMobile ? '280px' : '150px');
    emailInput.style('padding', isMobile ? '15px' : '10px');
    emailInput.style('font-size', isMobile ? '18px' : '14px');
    emailInput.style('background-color', '#2a2a2a');
    emailInput.style('border', '2px solid #FFD700');
    emailInput.style('border-radius', '6px');
    emailInput.style('color', 'white');
    emailInput.style('box-sizing', 'border-box');
    emailInput.style('height', '42px'); // Explicit height
    emailInput.style('pointer-events', 'auto');
    emailInput.style('user-select', 'text');
    emailInput.input(() => {
      playerEmail = emailInput.value();
      console.log('📧 Email input changed:', playerEmail);
    });
    
    let submitButton = createButton('Save Score');
    submitButton.parent(formContainer);
    submitButton.style('padding', isMobile ? '15px 25px' : '10px 15px');
    submitButton.style('font-size', isMobile ? '18px' : '14px');
    submitButton.style('background-color', '#1E90FF'); // Darker blue color
    submitButton.style('border', '2px solid transparent');
    submitButton.style('border-radius', '6px');
    submitButton.style('color', 'white');
    submitButton.style('cursor', 'pointer');
    submitButton.style('box-sizing', 'border-box');
    submitButton.style('height', '42px'); // Explicit height to match inputs
    submitButton.style('line-height', '1'); // Reset line height to prevent text offset
    submitButton.style('pointer-events', 'auto');
    submitButton.style('user-select', 'none');
    submitButton.mousePressed(() => {
      console.log('🔘 Submit button clicked!');
      submitScore();
    });
    
    // View Leaderboard button removed - leaderboard shows by default
  } catch (error) {
    console.error("Error creating score form:", error);
    // Continue without the score form
  }
}

// Function to submit score to Supabase or local storage
async function submitScore() {
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
    console.log('Supabase not available, storing score locally');
    storeScoreLocally();
    showSuccessMessage('Score saved locally!');
    return;
  }
  
  try {
    console.log("Attempting to submit score:", score, "for email:", playerEmail);
    
    // Check if Supabase client is properly initialized
    if (!supabaseClient.from) {
      console.error("Supabase client is not properly initialized");
      alert('Error: Database connection issue. Your score: ' + score);
      return;
    }
    
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .insert([
        { 
          player_name: playerName,
          player_email: playerEmail,
          score: score,
          created_at: new Date().toISOString()
        }
      ]);
      
    if (error) {
      console.error("Supabase error details:", error);
      
      // Handle specific error types - fall back to local storage
      if (error.message && error.message.includes('Failed to fetch')) {
        console.log('Database connection failed, storing score locally');
        storeScoreLocally();
        showSuccessMessage('Score saved locally!');
      } else {
        console.log('Database error, storing score locally');
        storeScoreLocally();
        showSuccessMessage('Score saved locally!');
      }
      return; // Don't throw, just return gracefully
    }
    
    console.log("Score submitted successfully:", data);
    
    // Show success message for online submission
    showSuccessMessage('Score saved to leaderboard!');
    
    // Refresh leaderboard to show new score
    await fetchLeaderboard();
    
    // Hide the score submission form
    submitScoreForm.style('display', 'none');
    
    // Add a Retry button
    let retryButton = createButton('Retry');
    retryButton.position(width/2 - 50, height/2 + 150);
    retryButton.size(100, 40);
    retryButton.style('background-color', '#4CAF50');
    retryButton.style('color', 'white');
    retryButton.style('border', 'none');
    retryButton.style('border-radius', '4px');
    retryButton.style('font-size', '16px');
    retryButton.style('cursor', 'pointer');
    retryButton.mousePressed(restartGame);
    
    // Fetch and update leaderboard data (no need to show separate overlay)
    fetchLeaderboard();
  } catch (error) {
    console.error('Error submitting score:', error);
    
    // Provide user-friendly success messages and store locally
    console.log('Catch block error, storing score locally');
    storeScoreLocally();
    showSuccessMessage('Score saved locally!');
    
    // Hide the score submission form even on error
    if (submitScoreForm) {
      submitScoreForm.style('display', 'none');
    }
  }
}

// Function to update form positioning to match current overlay layout
function updateFormPosition() {
  if (!submitScoreForm) return;
  
  let boxWidth = isMobile ? width * 0.9 : width * 0.6;
  let boxHeight = isMobile ? height * 0.95 : height * 0.7;
  let boxY = isMobile ? height * 0.025 : (height - boxHeight) / 2;
  // USE GLOBAL POSITIONS - NO FAKE RULES
  let pos = GLOBAL_POSITIONS || calculateRealPositions();
  let formY = pos.formStart;
  
  // DEBUG: Log calculated positions
  if (isMobile && pos) {
    console.log('🔧 Overlap Prevention Debug:', {
      formStart: pos.formStart,
      formEnd: pos.formEnd,
      leaderboardTitle: pos.leaderboardTitle,
      gap: pos.leaderboardTitle - pos.formEnd
    });
  }
  
  submitScoreForm.style('top', formY + 'px');
  submitScoreForm.style('width', (isMobile ? width * 0.8 : width * 0.5) + 'px');
}

// Function to store score locally when database is unavailable
function storeScoreLocally() {
  try {
    // Get existing local scores
    let localScores = JSON.parse(localStorage.getItem('vibecheck_scores') || '[]');
    
    // Add new score
    const newScore = {
      name: playerName,
      email: playerEmail,
      score: score,
      date: new Date().toISOString()
    };
    
    localScores.push(newScore);
    
    // Sort by score (highest first) and keep only top 10
    localScores.sort((a, b) => b.score - a.score);
    localScores = localScores.slice(0, 10);
    
    // Store back to localStorage
    localStorage.setItem('vibecheck_scores', JSON.stringify(localScores));
    
    console.log('Score stored locally:', newScore);
    
    // Update the display with local scores
    leaderboardData = localScores;
    
    // Hide the score submission form
    if (submitScoreForm) {
      submitScoreForm.style('display', 'none');
    }
    
  } catch (error) {
    console.error('Error storing score locally:', error);
  }
}

// Function to show a success message overlay instead of alert
function showSuccessMessage(message) {
  // Create a success message overlay
  let successOverlay = createDiv('');
  successOverlay.style('position', 'fixed');
  successOverlay.style('top', '50%');
  successOverlay.style('left', '50%');
  successOverlay.style('transform', 'translate(-50%, -50%)');
  successOverlay.style('background-color', 'rgba(76, 175, 80, 0.95)'); // Green background
  successOverlay.style('color', 'white');
  successOverlay.style('padding', '20px 30px');
  successOverlay.style('border-radius', '10px');
  successOverlay.style('font-size', '18px');
  successOverlay.style('font-weight', 'bold');
  successOverlay.style('text-align', 'center');
  successOverlay.style('z-index', '2000');
  successOverlay.style('box-shadow', '0 4px 8px rgba(0,0,0,0.3)');
  successOverlay.style('border', '2px solid #4CAF50');
  
  // Add checkmark and message
  successOverlay.html('✓ ' + message);
  
  // Auto-remove after 2 seconds
  setTimeout(() => {
    if (successOverlay && successOverlay.remove) {
      successOverlay.remove();
    }
  }, 2000);
}

// Function to load local scores
function loadLocalScores() {
  try {
    const localScores = JSON.parse(localStorage.getItem('vibecheck_scores') || '[]');
    if (localScores.length > 0) {
      console.log('Loaded local scores:', localScores);
      leaderboardData = localScores;
      return true;
    }
  } catch (error) {
    console.error('Error loading local scores:', error);
  }
  return false;
}

// Function to fetch leaderboard data from Supabase
async function fetchLeaderboard() {
  if (!supabaseClient) {
    console.log('Supabase client not available, loading local scores');
    loadLocalScores();
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    
    leaderboardData = data;
    updateLeaderboardDisplay();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    console.log('Online leaderboard unavailable, loading local scores');
    loadLocalScores();
  }
}

// Function to update the leaderboard display
function updateLeaderboardDisplay() {
  const leaderboardBody = document.getElementById('leaderboard-body');
  leaderboardBody.innerHTML = '';
  
  leaderboardData.forEach((entry, index) => {
    const row = document.createElement('tr');
    
    // Rank column
    const rankCell = document.createElement('td');
    rankCell.textContent = index + 1;
    row.appendChild(rankCell);
    
    // Player column (show name or first part of email for privacy)
    const playerCell = document.createElement('td');
    const displayName = entry.player_name || entry.player_email.split('@')[0] + '@...';
    playerCell.textContent = displayName;
    row.appendChild(playerCell);
    
    // Score column
    const scoreCell = document.createElement('td');
    scoreCell.textContent = entry.score;
    row.appendChild(scoreCell);
    
    // Date column
    const dateCell = document.createElement('td');
    const date = new Date(entry.created_at);
    dateCell.textContent = date.toLocaleDateString();
    row.appendChild(dateCell);
    
    leaderboardBody.appendChild(row);
  });
}

// Function to show the leaderboard
function showLeaderboard() {
  const leaderboardContainer = document.getElementById('leaderboard-container');
  leaderboardContainer.style.display = 'block';
  leaderboardContainer.style.position = 'fixed';
  leaderboardContainer.style.top = '50%';
  leaderboardContainer.style.left = '50%';
  leaderboardContainer.style.transform = 'translate(-50%, -50%)';
  leaderboardContainer.style.maxHeight = '80vh';
  leaderboardContainer.style.overflowY = 'auto';
  leaderboardContainer.style.zIndex = '1000'; // Higher z-index to ensure it's on top
  
  // Don't redraw the Game Over text here - it's already drawn in the draw function
  
  showingLeaderboard = true;
  fetchLeaderboard(); // Refresh the data
}

// Function to hide the leaderboard
function hideLeaderboard() {
  document.getElementById('leaderboard-container').style.display = 'none';
  showingLeaderboard = false;
}

// Function to draw the game over screen
function drawGameOverScreen() {
  // Dark gradient background
  for (let i = 0; i <= height; i++) {
    let alpha = map(i, 0, height, 0.3, 1.0);
    stroke(20 * alpha, 20 * alpha, 40 * alpha);
    line(0, i, width, i);
  }
  
  // Draw the custom game over image
  if (gameOverImg && gameOverImg.width > 0) {
    let imgWidth = 300;
    let imgHeight = (gameOverImg.height / gameOverImg.width) * imgWidth;
    imageMode(CENTER);
    image(gameOverImg, width/2, height/2 - 120, imgWidth, imgHeight);
  } else {
    // Fallback text if image doesn't load
    fill(255, 200, 0);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width/2, height/2 - 120);
  }
  
  // Score display with golden styling
  fill(255, 215, 0);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("Score: " + score, width/2, height/2 - 40);
  
  // Show the score submission form
  if (supabaseClient && submitScoreForm) {
    updateFormPosition(); // Update positioning for current screen size
    submitScoreForm.style('display', 'block');
    console.log('🎮 Game over form shown:', {
      formExists: !!submitScoreForm,
      display: 'block',
      isMobile: isMobile
    });
  } else {
    console.log('❌ Form not shown:', {
      supabaseClient: !!supabaseClient,
      submitScoreForm: !!submitScoreForm
    });
  }
  
  // Show leaderboard if available
  if (leaderboardData && leaderboardData.length > 0) {
    drawCompactLeaderboard();
  }
}

// Function to draw a compact leaderboard on the game over screen
function drawCompactLeaderboard() {
  fill(255, 215, 0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("Highest Scores", width/2, height/2 + 50);
  
  // Show top 5 scores
  let displayCount = min(5, leaderboardData.length);
  for (let i = 0; i < displayCount; i++) {
    let entry = leaderboardData[i];
    let yPos = height/2 + 80 + (i * 25);
    
    fill(255, 255, 255);
    textSize(14);
    textAlign(LEFT, CENTER);
    
    // Rank
    text("#" + (i + 1), width/2 - 140, yPos);
    
    // Name (truncated if too long)
    let displayName = entry.player_name || entry.player_email.split('@')[0];
    if (displayName.length > 15) {
      displayName = displayName.substring(0, 12) + "...";
    }
    text(displayName, width/2 - 100, yPos);
    
    // Score
    textAlign(RIGHT, CENTER);
    text(entry.score, width/2 + 140, yPos);
  }
  
  // Buttons
  fill(255, 165, 0);
  rect(width/2 - 160, height/2 + 210, 120, 40, 10);
  rect(width/2 - 20, height/2 + 210, 120, 40, 10);
  rect(width/2 + 120, height/2 + 210, 120, 40, 10);
  
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Play Again", width/2 - 100, height/2 + 230);
  text("Leaderboard", width/2 + 100, height/2 + 230);
  text("Main Menu", width/2 + 220, height/2 + 230);
}

// Function to draw main menu
// Helper function to draw actual game sprite red aura dancer
function drawGameRedDancer(x, y, size) {
  push();
  
  // Scale everything to the size parameter
  let scaleFactor = size / 60; // 60 is approximate size of normal dancer
  
  // Red glow effect (same as game)
  fill(255, 0, 0, 80);
  noStroke();
  ellipse(x, y + 15 * scaleFactor, 60 * scaleFactor, 60 * scaleFactor);
  
  // Draw male dancer (simplified but accurate to game sprite)
  // Draw legs with dancing animation
  fill(100, 100, 150); // Pants color
  
  // Left leg
  push();
  translate(x - 10 * scaleFactor, y + 30 * scaleFactor);
  rotate(radians(15)); // Static dance pose
  rect(-5 * scaleFactor, 0, 10 * scaleFactor, 20 * scaleFactor);
  // Left foot
  fill(40);
  translate(0, 20 * scaleFactor);
  ellipse(0, 0, 12 * scaleFactor, 6 * scaleFactor);
  pop();
  
  // Right leg
  push();
  translate(x + 10 * scaleFactor, y + 30 * scaleFactor);
  rotate(radians(-15)); // Static dance pose
  fill(100, 100, 150);
  rect(-5 * scaleFactor, 0, 10 * scaleFactor, 20 * scaleFactor);
  // Right foot
  fill(40);
  translate(0, 20 * scaleFactor);
  ellipse(0, 0, 12 * scaleFactor, 6 * scaleFactor);
  pop();
  
  // Body (torso)
  fill(255, 100, 100); // Shirt color
  rect(x - 15 * scaleFactor, y - 10 * scaleFactor, 30 * scaleFactor, 40 * scaleFactor, 5 * scaleFactor);
  
  // Arms in dance position
  fill(255, 224, 189); // Skin color
  // Left arm
  push();
  translate(x - 15 * scaleFactor, y + 5 * scaleFactor);
  rotate(radians(-30));
  rect(0, -5 * scaleFactor, 25 * scaleFactor, 10 * scaleFactor, 3 * scaleFactor);
  pop();
  
  // Right arm
  push();
  translate(x + 15 * scaleFactor, y + 5 * scaleFactor);
  rotate(radians(30));
  rect(-25 * scaleFactor, -5 * scaleFactor, 25 * scaleFactor, 10 * scaleFactor, 3 * scaleFactor);
  pop();
  
  // Head
  fill(255, 224, 189);
  ellipse(x, y - 25 * scaleFactor, 25 * scaleFactor, 30 * scaleFactor);
  
  // Hair
  fill(100, 70, 50);
  ellipse(x, y - 35 * scaleFactor, 28 * scaleFactor, 15 * scaleFactor);
  
  // Facial expression (tired/leaving)
  fill(0);
  ellipse(x - 7 * scaleFactor, y - 30 * scaleFactor, 3 * scaleFactor, 3 * scaleFactor); // Left eye
  ellipse(x + 7 * scaleFactor, y - 30 * scaleFactor, 3 * scaleFactor, 3 * scaleFactor); // Right eye
  
  // Tired/sad mouth
  stroke(0);
  strokeWeight(1);
  noFill();
  arc(x, y - 20 * scaleFactor, 8 * scaleFactor, 6 * scaleFactor, 0, PI);
  noStroke();
  
  pop();
}

// Helper function to draw mini party emoji
function drawMiniPartyEmoji(x, y, size) {
  push();
  translate(x, y);
  
  // Emoji base (yellow circle)
  fill(255, 220, 0);
  stroke(0);
  strokeWeight(1);
  ellipse(0, 0, size, size);
  
  // Party hat
  fill(255, 100, 200);
  triangle(-size * 0.2, -size * 0.3, size * 0.2, -size * 0.3, 0, -size * 0.6);
  
  // Eyes
  fill(0);
  ellipse(-size * 0.15, -size * 0.1, size * 0.1, size * 0.1);
  ellipse(size * 0.15, -size * 0.1, size * 0.1, size * 0.1);
  
  // Happy mouth
  noFill();
  stroke(0);
  strokeWeight(1);
  arc(0, size * 0.05, size * 0.3, size * 0.2, 0, PI);
  
  noStroke();
  pop();
}

function drawMainMenu() {
  // Draw animated background gameplay
  background(30, 30, 50);
  
  // Enable autopilot mode for background animation
  let wasAutopilot = autopilotMode;
  autopilotMode = true;
  
  // Draw the game elements in the background
  drawDanceFloor();
  drawDJBooth();
  drawDJ();
  
  // Update and draw dancers for background animation
  for (let i = 0; i < dancers.length; i++) {
    dancers[i].update();
    dancers[i].draw();
  }
  
  // Update and draw records for background animation
  for (let i = records.length - 1; i >= 0; i--) {
    records[i].update();
    records[i].draw();
  }
  
  // Restore autopilot state
  autopilotMode = wasAutopilot;
  
  // Draw translucent overlay
  fill(0, 0, 0, 120); // Lighter translucent overlay for brighter background
  rect(0, 0, width, height);
  
  // Calculate menu content box dimensions - increased for image space
  let boxWidth = min(width * 0.9, 900); // Further increased width for image space
  let boxHeight = min(height * 0.8, 700); // Reduced height to move everything up
  let boxX = (width - boxWidth) / 2;
  let boxY = (height - boxHeight) / 2 - 50; // Move entire box up by 50 pixels
  
  // Draw translucent menu content box
  fill(0, 0, 0, 120); // Semi-transparent black
  noStroke(); // Remove border
  rect(boxX, boxY, boxWidth, boxHeight, 20); // Rounded corners
  
  // Game title with logo - positioned within the content box
  let logoBottomY;
  if (reecordsLogoImg && reecordsLogoImg.width > 0) {
    // Responsive logo sizing that fits within the box
    let logoWidth = min(boxWidth * 0.6, boxHeight * 0.2); // Size relative to box
    let logoHeight = (reecordsLogoImg.height / reecordsLogoImg.width) * logoWidth;
    
    // Position logo at top of content box
    let logoY = boxY + boxHeight * 0.15;
    
    imageMode(CENTER);
    image(reecordsLogoImg, width/2, logoY, logoWidth, logoHeight);
    logoBottomY = logoY + logoHeight/2; // Calculate bottom edge of logo
    

  } else {
    // Fallback text if logo doesn't load
    fill(255, 215, 0);
    textSize(min(boxWidth * 0.08, boxHeight * 0.06)); // Size relative to box
    textAlign(CENTER, CENTER);
    let logoY = boxY + boxHeight * 0.15;
    text("REECORDS", width/2, logoY);
    logoBottomY = logoY + textSize() / 2; // Use actual text size
  }
  
  // Dynamic gap sizing within the content box
  let availableSpace = boxY + boxHeight - logoBottomY - boxHeight * 0.15; // Space within box
  let gap = max(boxHeight * 0.08, availableSpace * 0.2); // Increased gap to prevent overlap
  
  // VIBECHECK & tagline image - positioned dynamically below logo within box
  let vibecheckY = logoBottomY + gap;
  let subtitleY;
  
  if (vibecheckTaglineImg) {
    // Use the vibecheck&tagline image
    let imgWidth = min(boxWidth * 0.7, 400);
    let imgHeight = (vibecheckTaglineImg.height / vibecheckTaglineImg.width) * imgWidth;
    imageMode(CENTER);
    image(vibecheckTaglineImg, width/2, vibecheckY, imgWidth, imgHeight);
    subtitleY = vibecheckY + imgHeight/2 + gap * 0.1; // Reduced spacing below image
  } else {
    // Fallback to text if image doesn't load
    fill(255, 215, 0);
    textSize(min(boxWidth * 0.08, boxHeight * 0.06)); // Box-relative text size
    textAlign(CENTER, CENTER);
    text("VIBECHECK", width/2, vibecheckY);
    
    // Subtitle - positioned below VIBECHECK with smaller gap
    let subtitleGap = gap * 0.5; // Smaller gap for subtitle
    subtitleY = vibecheckY + textSize() * 0.8 + subtitleGap; // Account for text height
    fill(255, 255, 255);
    textSize(min(boxWidth * 0.025, boxHeight * 0.03)); // Box-relative subtitle size
    text("Keep the party alive!", width/2, subtitleY);
  }
  

  
  // Instructions - clean aesthetic like screenshot  
  let instructionsY = subtitleY + gap * 0.3; // Reduced gap above instructions
  let instructionBoxWidth = boxWidth * 0.6; // Much narrower to prevent text overlap
  let instructionBoxHeight = boxHeight * 0.08;
  let instructionBoxX = width/2 - instructionBoxWidth/2;
  let instructionGap = boxHeight * 0.015; // Reduced gap between instructions
  
  // First instruction box - Red dancers leaving
  fill(0, 0, 0, 120); // Clean black translucent background
  noStroke();
  rect(instructionBoxX, instructionsY, instructionBoxWidth, instructionBoxHeight, 8);
  
  // First instruction with simple centered text
  fill(255, 255, 255);
  textSize(min(boxWidth * 0.03, boxHeight * 0.035)); // Increased font size
  textAlign(CENTER, CENTER);
  
  let instructionText = "If the dancers' aura turns red they are bored and leaving the dancefloor";
  text(instructionText, width/2, instructionsY + instructionBoxHeight/2);
  
  // Position image at the far right of the main container
  let imageSize = instructionBoxHeight * 0.8;
  let imageX = boxX + boxWidth - imageSize/2 - 20;
  
  if (redAuraDancerImg) {
    imageMode(CENTER);
    image(redAuraDancerImg, imageX, instructionsY + instructionBoxHeight/2, imageSize, imageSize);
  } else {
    // Fallback to drawn dancer if image not loaded
    drawGameRedDancer(imageX, instructionsY + instructionBoxHeight/2, imageSize);
  }
  
  // Second instruction box - Hit with emoji
  let secondBoxY = instructionsY + instructionBoxHeight + instructionGap;
  fill(0, 0, 0, 120); // Clean black translucent background
  rect(instructionBoxX, secondBoxY, instructionBoxWidth, instructionBoxHeight, 8);
  
  // Second instruction with simple centered text
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  
  let secondInstructionText = "Hit them with a party emoji to bring them back";
  text(secondInstructionText, width/2, secondBoxY + instructionBoxHeight/2);
  
  // Position emoji at the far right of the main container
  let emojiSize = instructionBoxHeight * 0.8;
  let emojiX = boxX + boxWidth - emojiSize/2 - 20;
  
  if (partyEmojiImg) {
    imageMode(CENTER);
    image(partyEmojiImg, emojiX, secondBoxY + instructionBoxHeight/2, emojiSize, emojiSize);
  } else {
    // Fallback to drawn emoji if image not loaded
    drawMiniPartyEmoji(emojiX, secondBoxY + instructionBoxHeight/2, emojiSize);
  }
  
  // Third instruction box - Game over condition
  let thirdBoxY = secondBoxY + instructionBoxHeight + instructionGap;
  fill(0, 0, 0, 120); // Clean black translucent background
  rect(instructionBoxX, thirdBoxY, instructionBoxWidth, instructionBoxHeight, 8);
  
  // Third instruction with simple centered text
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  
  let thirdInstructionText = "If three leave then the party is dead";
  text(thirdInstructionText, width/2, thirdBoxY + instructionBoxHeight/2);
  
  // Position dead emoji at the far right of the main container
  let deadEmojiSize = instructionBoxHeight * 0.8;
  let deadEmojiX = boxX + boxWidth - deadEmojiSize/2 - 20;
  
  if (deadEmojiImg) {
    imageMode(CENTER);
    image(deadEmojiImg, deadEmojiX, thirdBoxY + instructionBoxHeight/2, deadEmojiSize, deadEmojiSize);
  } else {
    // Fallback to text if image not loaded
    fill(255, 0, 0);
    textSize(deadEmojiSize * 0.8);
    text("💀", deadEmojiX, thirdBoxY + instructionBoxHeight/2);
  }
  
  // Start button - positioned below instructions with animation
  let buttonY = thirdBoxY + instructionBoxHeight + gap * 0.5; // Reduced gap above button
  
  let buttonWidth, buttonHeight, buttonText, buttonColor;
  
  if (waitingForStartSound) {
    // When waiting for sound to finish - strobe effect and different text
    let strobeIntensity = sin(frameCount * 0.5) * 0.5 + 0.5; // Fast strobe between 0 and 1
    let strobeColors = [
      [255, 0, 0],     // Red
      [0, 255, 0],     // Green
      [0, 0, 255],     // Blue
      [255, 255, 0],   // Yellow
      [255, 0, 255],   // Magenta
      [0, 255, 255]    // Cyan
    ];
    let colorIndex = floor(frameCount * 0.2) % strobeColors.length;
    let currentColor = strobeColors[colorIndex];
    
    buttonWidth = min(boxWidth * 0.4, 250);
    buttonHeight = min(boxHeight * 0.08, 50);
    buttonText = "LET'S PARTY!";
    buttonColor = [currentColor[0] * strobeIntensity, currentColor[1] * strobeIntensity, currentColor[2] * strobeIntensity];
  } else {
    // Normal pulsing animation for button
    let pulseScale = 1 + sin(frameCount * 0.1) * 0.05; // Gentle pulse between 0.95 and 1.05
    buttonWidth = min(boxWidth * 0.4, 250) * pulseScale; // Box-relative button width with pulse
    buttonHeight = min(boxHeight * 0.08, 50) * pulseScale; // Box-relative button height with pulse
    buttonText = "START GAME";
    buttonColor = [255, 165, 0]; // Orange
  }
  
  fill(buttonColor[0], buttonColor[1], buttonColor[2]);
  rect(width/2 - buttonWidth/2, buttonY, buttonWidth, buttonHeight, 15);
  
  fill(255);
  textAlign(CENTER, CENTER); // Ensure text alignment is set
  let textScale = waitingForStartSound ? 1 : (1 + sin(frameCount * 0.1) * 0.05); // Pulse text only when not waiting
  textSize(min(boxWidth * 0.03, boxHeight * 0.04) * textScale);
  text(buttonText, width/2, buttonY + buttonHeight/2);
  
  // Credit images below start button - centered with Start Game button
  // Use static button height to prevent pulsing of credit image
  let staticButtonHeight = min(boxHeight * 0.08, 50);
  let creditY = buttonY + staticButtonHeight + gap * 0.8;
  let creditImageHeight = boxHeight * 0.04; // Small credit images
  
  if (createdByCrxssImg) {
    // Make the image 75% bigger and ensure it's centered with the Start Game button
    let crxssWidth = (createdByCrxssImg.width / createdByCrxssImg.height) * creditImageHeight * 1.75;
    let crxssX = width/2; // Center exactly with the Start Game button (no offset)
    imageMode(CENTER);
    image(createdByCrxssImg, crxssX, creditY, crxssWidth, creditImageHeight * 1.75);
    

  }
  

  
  noStroke();
}


// SINGLE SOURCE OF TRUTH - NO FAKE RULES
let GLOBAL_POSITIONS = null;

function calculateRealPositions() {
  if (!isMobile) {
    // Desktop uses simple positioning
    return {
      gameOverImage: height * 0.3,
      score: height * 0.4,
      formStart: height * 0.45,
      leaderboardTitle: height * 0.65,
      buttons: height * 0.8
    };
  }
  
  // MOBILE: REAL ENFORCED POSITIONING
  let boxHeight = height * 0.95;
  let boxY = height * 0.025;
  let currentY = boxY + boxHeight * 0.2;
  
  let positions = {};
  
  // Game Over Image
  positions.gameOverImage = currentY;
  currentY += boxHeight * 0.08;
  
  // Score
  positions.score = currentY;
  currentY += boxHeight * 0.05;
  
  // MASSIVE form space - NO COMPROMISES
  positions.formStart = currentY;
  currentY += boxHeight * 0.30; // 30% of screen for form
  
  // ENFORCED gap after form
  currentY += boxHeight * 0.05;
  
  // Leaderboard title
  positions.leaderboardTitle = currentY;
  currentY += boxHeight * 0.04;
  
  // Leaderboard entries
  positions.leaderboardEntries = currentY;
  currentY += boxHeight * 0.12;
  
  // Buttons
  positions.buttons = currentY;
  
  console.log('📍 REAL POSITIONS:', positions);
  return positions;
}

// REAL ENFORCEMENT - NO FAKE RULES
function enforceNoOverlaps() {
  // Calculate positions ONCE and use them EVERYWHERE
  GLOBAL_POSITIONS = calculateRealPositions();
  
  console.log('✅ ENFORCED POSITIONS SET:', GLOBAL_POSITIONS);
  return GLOBAL_POSITIONS;
}

// Function to draw game over overlay
function drawGameOverOverlay() {
  // Semi-transparent overlay
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
  
  // SINGLE SOURCE OF TRUTH - NO FAKE RULES
  let pos = enforceNoOverlaps();
  
  // Main overlay box - larger on mobile, full height if needed
  let boxWidth = isMobile ? width * 0.9 : width * 0.6;
  let boxHeight = isMobile ? height * 0.95 : height * 0.7; // Almost full height on mobile
  let boxX = (width - boxWidth) / 2;
  let boxY = isMobile ? height * 0.025 : (height - boxHeight) / 2; // Start near top on mobile
  
  fill(30, 30, 30, 240);
  stroke(255, 215, 0);
  strokeWeight(3);
  rect(boxX, boxY, boxWidth, boxHeight, 20);
  noStroke();
  
  // Game Over image
  if (gameOverImg && gameOverImg.width > 0) {
    let imgWidth = boxWidth * 0.4;
    let imgHeight = (gameOverImg.height / gameOverImg.width) * imgWidth;
    imageMode(CENTER);
    image(gameOverImg, width/2, pos.gameOverImage, imgWidth, imgHeight);
  } else {
    fill(255, 215, 0);
    textSize(isMobile ? boxWidth * 0.12 : boxWidth * 0.08);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width/2, pos.gameOverImage);
  }
  
  // Score - using calculated position
  fill(255, 215, 0);
  textSize(isMobile ? boxWidth * 0.08 : boxWidth * 0.04);
  text("Score: " + score, width/2, pos.score);
  
  // Form positioned dynamically (calculated in positions)
  
  // ENFORCED LEADERBOARD POSITIONING - NO OVERLAPS ALLOWED
  if (leaderboardData && leaderboardData.length > 0) {
    fill(255, 215, 0);
    textSize(isMobile ? boxWidth * 0.06 : boxWidth * 0.035);
    
    // USE GLOBAL POSITIONS - NO SAFETY CHECKS NEEDED
    let leaderboardY = pos.leaderboardTitle;
    
    text("Highest Scores", width/2, leaderboardY);
    
    // Show top 3 scores to save space
    let displayCount = min(3, leaderboardData.length);
    for (let i = 0; i < displayCount; i++) {
      let entry = leaderboardData[i];
      // USE GLOBAL POSITIONS - NO CALCULATIONS NEEDED
      let yPos = pos.leaderboardEntries + (i * boxHeight * 0.03);
      
      fill(255, 255, 255);
      textSize(isMobile ? boxWidth * 0.05 : boxWidth * 0.025);
      textAlign(LEFT, CENTER);
      
      // Rank
      text("#" + (i + 1), boxX + boxWidth * 0.1, yPos);
      
      // Name only (no email)
      let displayName = entry.player_name || "Anonymous";
      if (displayName.length > 20) {
        displayName = displayName.substring(0, 17) + "...";
      }
      text(displayName, boxX + boxWidth * 0.2, yPos);
      
      // Score
      textAlign(RIGHT, CENTER);
      text(entry.score, boxX + boxWidth * 0.9, yPos);
    }
  }
  
  // Buttons - using calculated position to ensure no overlap
  fill(255, 165, 0);
  let baseBtnWidth = isMobile ? boxWidth * 0.25 : boxWidth * 0.15; // Wider buttons on mobile
  let baseBtnHeight = isMobile ? boxHeight * 0.06 : boxHeight * 0.08; // Slightly shorter on mobile to fit
  let btnY = pos.buttons; // USE GLOBAL POSITIONS
  
  // Play Again button with pulsing animation
  let pulseScale = 1 + sin(frameCount * 0.1) * 0.05; // Same pulse as Start Game button
  let playAgainWidth = baseBtnWidth * pulseScale;
  let playAgainHeight = baseBtnHeight * pulseScale;
  rect(boxX + boxWidth * 0.3 - playAgainWidth/2, btnY + (baseBtnHeight - playAgainHeight)/2, playAgainWidth, playAgainHeight, 10);
  
  // Main Menu button (no pulsing)
  rect(boxX + boxWidth * 0.7 - baseBtnWidth/2, btnY, baseBtnWidth, baseBtnHeight, 10);
  
  fill(255);
  textAlign(CENTER, CENTER);
  
  // Play Again text with pulsing size
  textSize((isMobile ? boxWidth * 0.04 : boxWidth * 0.025) * pulseScale);
  text("Play Again", boxX + boxWidth * 0.3, btnY + baseBtnHeight/2);
  
  // Main Menu text (normal size)
  textSize(isMobile ? boxWidth * 0.04 : boxWidth * 0.025);
  text("Main Menu", boxX + boxWidth * 0.7, btnY + baseBtnHeight/2);
}

// Handle window resize to update form positioning
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (gameState === 'gameOver' && submitScoreForm) {
    updateFormPosition();
  }
}

// SoundCloud player control functions
function showSoundCloudPlayer() {
  const player = document.getElementById('soundcloud-player');
  if (player) {
    player.style.display = 'block';
  }
}

function startSoundCloudPlayback() {
  console.log('🎵 startSoundCloudPlayback() called');
  const player = document.getElementById('soundcloud-player');
  if (player) {
    console.log('🎵 SoundCloud player found, showing it');
    player.style.display = 'block';
    // Load the current track and start playback
    loadCurrentTrack(true); // true = autoplay
  } else {
    console.log('❌ SoundCloud player element not found!');
  }
}

function loadCurrentTrack(autoplay = false) {
  console.log('🎵 loadCurrentTrack() called, autoplay:', autoplay);
  const iframe = document.getElementById('soundcloud-iframe');
  const trackNameElement = document.getElementById('current-track-name');
  console.log('🎵 iframe found:', !!iframe, 'trackNameElement found:', !!trackNameElement);
  
  if (iframe && trackNameElement && tracks[currentTrackIndex]) {
    const track = tracks[currentTrackIndex];
    
    // Update track name display
    trackNameElement.textContent = track.name;
    
    // Set current BPM and calculate beat interval in frames
    currentBPM = track.bpm || 128; // Default to 128 if BPM is not set
    beatIntervalFrames = (60 / currentBPM) * 60; // (seconds per beat) * (frames per second)
    beatTimer = 0; // Reset beat timer for new song
    
    // Construct the new URL for the iframe
    let newUrl = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${track.id}&color=%23ff5500&auto_play=${autoplay}&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false&buying=false&liking=false&download=false&sharing=false&show_artwork=false&enable_api=true`;
    
    iframe.src = newUrl;
    
    console.log(`🎵 Loaded track ${currentTrackIndex + 1}/${tracks.length}: ${track.name}`);
    console.log(`🔄 Next switch in ${Math.floor(trackSwitchInterval/60)} seconds`);
  }
}

function nextTrack() {
  console.log(`🎵 Switching to track ${(currentTrackIndex + 1) % tracks.length + 1}: ${tracks[(currentTrackIndex + 1) % tracks.length].name}`);
  
  // Move to next track (loop back to first if at end)
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  
  loadCurrentTrack(true); // Start playing the new track
}

function previousTrack() {
  // Move to previous track (loop to last if at beginning)
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadCurrentTrack(true); // Start playing the new track
}

function hideSoundCloudPlayer() {
  const player = document.getElementById('soundcloud-player');
  if (player) {
    player.style.display = 'none';
  }
}

// Add global functions
window.hideLeaderboard = hideLeaderboard;
window.showLeaderboard = showLeaderboard;
window.nextTrack = nextTrack; // Make nextTrack globally accessible for debugging

// Add keyboard shortcut for manual track switching (for testing)
function keyPressed() {
  // Press 'N' to manually switch to next track (for testing)
  if (key === 'n' || key === 'N') {
    console.log('🔧 Manual track switch triggered');
    nextTrack();
  }
  
  // Press 'T' to check timer status
  if (key === 't' || key === 'T') {
    console.log(`🕐 Timer Status - Current: ${trackSwitchTimer}, Target: ${trackSwitchInterval}, Track: ${currentTrackIndex + 1}, GameState: ${gameState}, Autopilot: ${autopilotMode}`);
  }
}
