const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Watchlist = require('./models/Watchlist');
const WatchHistory = require('./models/WatchHistory');
const Favorite = require('./models/Favorite');
const Comment = require('./models/Comment');
const AdminMessage = require('./models/AdminMessage');
const ActivityLog = require('./models/ActivityLog');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gnwexuyvbjcyggnmpbfp.supabase.co',
  'sb_publishable_yTzl54l-ioSt9vo75Tuu4Q_tYgbNqQ6'
);

const { getEnrichedMovieData } = require('./movieService');

const app = express();

// Manual CORS middleware (reliable, no wildcard issues)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5174'];
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;
const TMDB_URL = 'https://api.themoviedb.org/3';
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/filmz';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const isAdminUser = (decoded) => decoded?.role === 'admin' || decoded?.isAdminPanel === true;

const requireAdmin = (req, res) => {
  const token = req.cookies?.token || (req.headers?.authorization ? req.headers.authorization.split(' ')[1] : null);
  const decoded = getUserFromToken(token);
  if (!decoded || !isAdminUser(decoded)) {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return decoded;
};

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected');
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    await User.create({
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'Flims_store Admin',
      role: 'admin'
    });
    console.log('Admin user created');
  }
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const getUserFromToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

app.get('/api/trending/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const page = req.query.page || 1;

        const response = await axios.get(`${TMDB_URL}/trending/${type}/day`, {
            params: {
                api_key: process.env.TMDB_KEY,
                page: page
            }
        });

        res.set('Cache-Control', 'public, max-age=3600');
        res.json(response.data);
    } catch (error) {
        console.error('TMDB API Error:', error.message);
        res.status(500).json({ error: 'Failed to connect to TMDB' });
    }
});

app.get('/api/movie/:id', async (req, res) => {
    try {
        const data = await getEnrichedMovieData(req.params.id);
        res.json(data);
    } catch (error) {
        console.error('Enrichment Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch enriched movie data' });
    }
});

app.get('/api/trailer/:title', async (req, res) => {
    try {
        const { title } = req.params;
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: `${title} official trailer`,
                key: process.env.YOUTUBE_KEY,
                maxResults: 1,
                type: 'video'
            }
        });

        const videoId = response.data.items[0]?.id?.videoId || null;
        res.json({ videoId });
    } catch (error) {
        console.error('YouTube API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch trailer from YouTube' });
    }
});

app.get('/api/comments/:movieId', async (req, res) => {
  try {
    const movieComments = await Comment.find({ movieId: req.params.movieId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(movieComments.map(comment => ({
      id: comment._id,
      movieId: comment.movieId,
      userName: comment.userName,
      name: comment.userName,
      text: comment.text,
      date: new Date(comment.createdAt).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    })));
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json([]);
  }
});

app.post('/api/comments', async (req, res) => {
  const { movieId, userName, text } = req.body;
  if (!userName || !text || !movieId) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    const result = await Comment.create({
      movieId: String(movieId),
      userName,
      text
    });

    await ActivityLog.create({
      type: 'comment',
      description: `${userName} commented on movie #${movieId}`
    });

    res.json({
      id: result._id,
      movieId: result.movieId,
      userName: result.userName,
      name: result.userName,
      text: result.text,
      date: new Date(result.createdAt).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    });
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Register in Supabase
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password
    });

    if (supabaseError) {
      console.error('Supabase registration error:', supabaseError);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name: '',
      bio: '',
      role: 'user'
    });

    await ActivityLog.create({
      type: 'register',
      description: `New user registered: ${email.toLowerCase()}`
    });

    const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });

    res.json({
      user: {
        id: newUser._id,
        email: newUser.email,
        createdAt: newUser.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, username, password } = req.body;
  const loginId = (email || username || '').trim().toLowerCase();

  if (!loginId || !password) {
    return res.status(400).json({ error: 'Login ID and password are required' });
  }

  try {
    // Quick admin login: admin / admin
    if (loginId === 'admin' && password === 'admin') {
      const adminToken = jwt.sign({
        id: 'admin-panel',
        email: ADMIN_EMAIL || 'admin',
        role: 'admin',
        isAdminPanel: true
      }, JWT_SECRET, { expiresIn: '24h' });

      return res.json({
        user: { id: 'admin-panel', email: ADMIN_EMAIL || 'admin', role: 'admin' },
        token: adminToken
      });
    }

    // Regular user login via email
    if (loginId.includes('@')) {
      // Try Supabase auth
      const { error: supabaseError } = await supabase.auth.signInWithPassword({
        email: loginId,
        password: password
      });
      if (supabaseError) {
        console.warn('Supabase login fell back to MongoDB:', supabaseError.message);
      }
    }

    const user = await User.findOne({ email: loginId });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await ActivityLog.create({
      type: 'login',
      description: `User logged in: ${loginId}`
    });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Admin panel JWTs have id 'admin-panel' – return generic admin user
  if (decoded.isAdminPanel || decoded.id === 'admin-panel') {
    return res.json({
      user: { id: 'admin-panel', email: ADMIN_EMAIL || 'admin', role: 'admin' }
    });
  }

  try {
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.json({ success: true });
});

// Admin panel login endpoint
app.post('/api/auth/admin-login', async (req, res) => {
  const { username, password } = req.body;

  // Accept admin/admin or env-configured credentials
  const validAdmin = (username === 'admin' && password === 'admin') ||
                     (username === ADMIN_EMAIL && password === ADMIN_PASSWORD);

  if (validAdmin) {
    const token = jwt.sign({
      id: 'admin-panel',
      email: ADMIN_EMAIL || 'admin',
      role: 'admin',
      isAdminPanel: true
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: { id: 'admin-panel', email: ADMIN_EMAIL || 'admin', role: 'admin' }
    });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  res.json({ message: 'A reset link has been sent to your email (simulated).' });
});

// Profile endpoints
app.get('/api/profile', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const watchHistory = await WatchHistory.find({ user: user._id }).sort({ watchedAt: -1 }).lean();
    const watchlists = await Watchlist.find({ user: user._id }).lean();
    const favorites = await Favorite.find({ user: user._id }).lean();

    res.json({
      profile: {
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || null
      },
      watchHistory: watchHistory.map(h => ({
        movieId: h.movieId,
        movieTitle: h.movieTitle,
        watchedAt: h.watchedAt
      })),
      watchlists: watchlists.map(w => ({
        id: w._id,
        name: w.name,
        movies: w.movies || []
      })),
      favorites: favorites.map(f => ({
        movieId: f.movieId,
        movieTitle: f.movieTitle,
        posterPath: f.posterPath
      }))
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/profile', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.bio = req.body.bio || user.bio;
    if (req.body.avatar !== undefined) {
      user.avatar = req.body.avatar;
    }
    await user.save();

    res.json({
      profile: {
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || null
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Watch history
app.post('/api/watch-history', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });

  const { movieId, movieTitle } = req.body;
  if (!movieId) return res.status(400).json({ error: 'Movie ID required' });

  try {
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await WatchHistory.findOne({ user: user._id, movieId });
    if (!existing) {
      await WatchHistory.create({
        user: user._id,
        movieId,
        movieTitle: movieTitle || '',
        watchedAt: new Date()
      });
      await ActivityLog.create({
        type: 'watch',
        description: `User watched: ${movieTitle || 'Movie #' + movieId}`
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Watch history error:', error);
    res.status(500).json({ error: 'Failed to save watch history' });
  }
});

app.get('/api/watch-history', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const watchHistory = await WatchHistory.find({ user: user._id }).sort({ watchedAt: -1 }).lean();
    res.json({ watchHistory });
  } catch (error) {
    console.error('Watch history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch watch history' });
  }
});

// Watchlists
app.post('/api/watchlists', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'List name required' });

  try {
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await Watchlist.create({
      user: user._id,
      name,
      movies: []
    });

    res.json({
      id: result._id,
      name: result.name,
      movies: result.movies || []
    });
  } catch (error) {
    console.error('Watchlist creation error:', error);
    res.status(500).json({ error: 'Failed to create watchlist' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;

  try {
    const allUsers = await User.find().lean();
    res.json({ users: allUsers.map(u => ({ id: u._id, email: u.email, createdAt: u.createdAt })) });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ users: [] });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;

  const userId = req.params.id;
  try {
    await User.findByIdAndDelete(userId);
    await Watchlist.deleteMany({ user: userId });
    await WatchHistory.deleteMany({ user: userId });
    await Favorite.deleteMany({ user: userId });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete user failed:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Admin: Get all comments
app.get('/api/admin/comments', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;

  try {
    const comments = await Comment.find().sort({ createdAt: -1 }).lean().limit(100);
    res.json({
      comments: comments.map(c => ({
        id: c._id,
        userName: c.userName,
        movieId: c.movieId,
        text: c.text,
        date: new Date(c.createdAt).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      }))
    });
  } catch (error) {
    console.error('Admin comments fetch error:', error);
    res.status(500).json({ comments: [] });
  }
});

// Admin: Delete comment
app.delete('/api/admin/comments/:id', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;

  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Admin: Get messages from users
app.get('/api/admin/messages', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;

  try {
    const messages = await AdminMessage.find().sort({ createdAt: -1 }).lean();
    res.json({ messages });
  } catch (error) {
    console.error('Admin messages fetch error:', error);
    res.status(500).json({ messages: [] });
  }
});

// Admin: Delete message
app.delete('/api/admin/messages/:id', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;

  try {
    await AdminMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Admin: Reply to message
app.post('/api/admin/messages/:id/reply', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;

  try {
    const { reply } = req.body;
    await AdminMessage.findByIdAndUpdate(req.params.id, { reply, isRead: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin reply error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// Admin: Get activity log
app.get('/api/admin/activity', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;

  try {
    const activity = await ActivityLog.find().sort({ createdAt: -1 }).lean().limit(50);
    res.json({ activity });
  } catch (error) {
    console.error('Admin activity fetch error:', error);
    res.status(500).json({ activity: [] });
  }
});

// Update stats to include total comments
app.get('/api/admin/stats', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;

  try {
    const totalUsers = await User.countDocuments();
    const totalWatchRecords = await WatchHistory.countDocuments();
    const totalComments = await Comment.countDocuments();

    const viewStatsRaw = await WatchHistory.aggregate([
      { $group: { _id: '$movieTitle', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topMovieViews = viewStatsRaw.map(item => ({ movieTitle: item._id || 'Unknown movie', views: item.count }));

    res.json({
      totalUsers,
      totalWatchRecords,
      totalComments,
      topMovieViews
    });
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// User sends message to admin
app.post('/api/admin/messages', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    await AdminMessage.create({ name, email, subject, message });
    await ActivityLog.create({
      type: 'message',
      description: `New message from ${name} (${email}): ${subject}`
    });
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Admin message create error:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});


app.get('/api/watchlists', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const watchlists = await Watchlist.find({ user: user._id }).lean();
    res.json({ watchlists: watchlists.map(w => ({ id: w._id, name: w.name, movies: w.movies || [] })) });
  } catch (error) {
    console.error('Watchlists fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch watchlists' });
  }
});

app.post('/api/watchlists/:listId/items', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });

  const { listId } = req.params;
  const { movieId, movieTitle, posterPath } = req.body;

  if (!movieId) return res.status(400).json({ error: 'Movie ID required' });

  try {
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const watchlist = await Watchlist.findOne({ _id: listId, user: user._id });
    if (!watchlist) return res.status(404).json({ error: 'Watchlist not found' });

    if (!watchlist.movies.some(m => m.movieId === movieId)) {
      watchlist.movies.push({ movieId, movieTitle: movieTitle || '', posterPath: posterPath || '' });
      await watchlist.save();
    }

    res.json({ watchlist });
  } catch (error) {
    console.error('Watchlist update error:', error);
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

// Favorites
app.post('/api/favorites', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });

  const { movieId, movieTitle, posterPath } = req.body;
  if (!movieId) return res.status(400).json({ error: 'Movie ID required' });

  try {
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await Favorite.findOne({ user: user._id, movieId });
    if (!existing) {
      await Favorite.create({
        user: user._id,
        movieId,
        movieTitle: movieTitle || '',
        posterPath: posterPath || ''
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Favorites error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

app.get('/api/favorites', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const favorites = await Favorite.find({ user: user._id }).lean();
    res.json({ favorites });
  } catch (error) {
    console.error('Favorites fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

app.delete('/api/favorites/:movieId', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await Favorite.deleteOne({ user: user._id, movieId: req.params.movieId });
    const favorites = await Favorite.find({ user: user._id }).lean();
    res.json({ favorites });
  } catch (error) {
    console.error('Favorites delete error:', error);
    res.status(500).json({ error: 'Failed to delete favorite' });
  }
});

// Recommendations (simple: based on watch history genres)
app.get('/api/recommendations', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const response = await axios.get(`${TMDB_URL}/trending/movie/week`, {
      params: { api_key: process.env.TMDB_KEY, page: 1 }
    });
    res.json({ recommendations: response.data.results.slice(0, 10) });
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Advanced search
app.get('/api/search/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { query, genre, year, rating, sort_by } = req.query;
    const page = req.query.page || 1;

    let endpoint = `/search/${type}`;
    let params = { api_key: process.env.TMDB_KEY, query: query || '', page };

    if (!query) {
      endpoint = `/discover/${type}`;
      params = { api_key: process.env.TMDB_KEY, page, sort_by: sort_by || 'popularity.desc' };
      if (genre) params.with_genres = genre;
      if (year) params.primary_release_year = year;
      if (rating) params['vote_average.gte'] = rating;
    }

    const response = await axios.get(`${TMDB_URL}${endpoint}`, { params });
    res.json(response.data);
  } catch (error) {
    console.error('Search API Error:', error.message);
    res.status(500).json({ error: 'Failed to search' });
  }
});

// Similar movies
app.get('/api/movie/:id/similar', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_URL}/movie/${req.params.id}/similar`, {
      params: { api_key: process.env.TMDB_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch similar movies' });
  }
});

// Reviews (using TMDB)
app.get('/api/movie/:id/reviews', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_URL}/movie/${req.params.id}/reviews`, {
      params: { api_key: process.env.TMDB_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.get('/api/download/:type/:id', (req, res) => {
  const { type, id } = req.params;
  if (!['movie', 'tv'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  // Provide multiple download/streaming options
  const downloadOptions = {
    streamUrl: `https://vidsrc.to/${type}/${id}`,
    embedUrl: `https://vidsrc.to/embed/${type}/${id}`,
    alternativeStreams: [
      `https://www.2embed.cc/${type}/${id}`,
      `https://player.smashy.stream/${type}/${id}`
    ]
  };

  res.json({
    url: downloadOptions.streamUrl,
    embedUrl: downloadOptions.embedUrl,
    alternatives: downloadOptions.alternativeStreams,
    message: 'Use browser developer tools or video download extensions to download from the streaming page.'
  });
});

app.listen(PORT, () => {
    console.log(`?? Ka_samuel@250 Backend Active on port ${PORT}`);
    console.log(`?? YouTube Trailer system ready`);
    console.log(`?? Comment System initialized (In-Memory)`);
});
