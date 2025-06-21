// Import modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

// Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve login.html
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve register.html
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// Serve main feed page
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// In-memory data stores
let users = [];
let posts = [];
let follows = []; // { followerId, followingId }
let currentUserId = 1;
let currentPostId = 1;
let currentCommentId = 1;

// Helper functions
function findUserByUsername(username) {
  return users.find(u => u.username === username);
}

function findUserById(id) {
  return users.find(u => u.id === id);
}

// Routes

// User registration
app.post('/api/register', (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (findUserByUsername(username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  const newUser = { id: currentUserId++, username, password, name };
  users.push(newUser);
  res.json({ message: 'User registered successfully', user: { id: newUser.id, username, name } });
});

// User login (simple, no token)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = findUserByUsername(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ message: 'Login successful', user: { id: user.id, username: user.username, name: user.name } });
});

// Get user profile by id
app.get('/api/users/:id', (req, res) => {
  const user = findUserById(parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  // Count followers and following
  const followersCount = follows.filter(f => f.followingId === user.id).length;
  const followingCount = follows.filter(f => f.followerId === user.id).length;
  res.json({ id: user.id, username: user.username, name: user.name, followersCount, followingCount });
});

// Follow user
app.post('/api/users/:id/follow', (req, res) => {
  const followerId = parseInt(req.body.followerId);
  const followingId = parseInt(req.params.id);
  if (followerId === followingId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  if (!findUserById(followerId) || !findUserById(followingId)) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (follows.find(f => f.followerId === followerId && f.followingId === followingId)) {
    return res.status(400).json({ error: 'Already following' });
  }
  follows.push({ followerId, followingId });
  res.json({ message: 'Followed successfully' });
});

// Unfollow user
app.post('/api/users/:id/unfollow', (req, res) => {
  const followerId = parseInt(req.body.followerId);
  const followingId = parseInt(req.params.id);
  const index = follows.findIndex(f => f.followerId === followerId && f.followingId === followingId);
  if (index === -1) {
    return res.status(400).json({ error: 'Not following' });
  }
  follows.splice(index, 1);
  res.json({ message: 'Unfollowed successfully' });
});

// Create post
app.post('/api/posts', (req, res) => {
  const { userId, content } = req.body;
  if (!userId || !content) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (!findUserById(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }
  const newPost = { id: currentPostId++, userId, content, likes: [], comments: [] };
  posts.push(newPost);
  res.json({ message: 'Post created', post: newPost });
});

// Get all posts (latest first)
app.get('/api/posts', (req, res) => {
  const sortedPosts = posts.slice().sort((a, b) => b.id - a.id);
  res.json(sortedPosts);
});

// Like post
app.post('/api/posts/:id/like', (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = parseInt(req.body.userId);
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  if (!findUserById(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (post.likes.includes(userId)) {
    return res.status(400).json({ error: 'Already liked' });
  }
  post.likes.push(userId);
  res.json({ message: 'Post liked' });
});

// Unlike post
app.post('/api/posts/:id/unlike', (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = parseInt(req.body.userId);
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  const index = post.likes.indexOf(userId);
  if (index === -1) {
    return res.status(400).json({ error: 'Not liked yet' });
  }
  post.likes.splice(index, 1);
  res.json({ message: 'Post unliked' });
});

// Add comment to post
app.post('/api/posts/:id/comments', (req, res) => {
  const postId = parseInt(req.params.id);
  const { userId, content } = req.body;
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  if (!userId || !content) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (!findUserById(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }
  const comment = { id: currentCommentId++, userId, content };
  post.comments.push(comment);
  res.json({ message: 'Comment added', comment });
});

// Get comments for a post
app.get('/api/posts/:id/comments', (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post.comments);
});

app.delete('/api/posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = parseInt(req.query.userId);
  console.log('Delete request received for postId:', postId, 'userId:', userId);
  if (!userId) {
    console.log('User ID missing in delete request');
    return res.status(400).json({ error: 'User ID required' });
  }
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex === -1) {
    console.log('Post not found for deletion:', postId);
    return res.status(404).json({ error: 'Post not found' });
  }
  const post = posts[postIndex];
  if (post.userId !== userId) {
    console.log('Unauthorized delete attempt by user:', userId, 'for post owner:', post.userId);
    return res.status(403).json({ error: 'Not authorized to delete this post' });
  }
  posts.splice(postIndex, 1);
  console.log('Post deleted successfully:', postId);
  res.json({ message: 'Post deleted successfully' });
});

// Clear all users and related data - for testing only
app.delete('/api/users/clear', (req, res) => {
  users = [];
  posts = [];
  follows = [];
  currentUserId = 1;
  currentPostId = 1;
  currentCommentId = 1;
  res.json({ message: 'All users and related data cleared' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
