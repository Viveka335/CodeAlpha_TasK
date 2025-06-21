const API_URL = 'http://localhost:3000/api';

let currentUser = null;

// Elements
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const welcomeMsg = document.getElementById('welcome-msg');
const logoutBtn = document.getElementById('logout-btn');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const postContent = document.getElementById('post-content');
const postBtn = document.getElementById('post-btn');
const postsContainer = document.getElementById('posts-container');

// Utility functions
function showMessage(message) {
  alert(message);
}

function setCurrentUser(user) {
  if (!user || !user.id) {
    console.warn('Invalid user object passed to setCurrentUser:', user);
    currentUser = null;
    authSection.style.display = 'block';
    mainSection.style.display = 'none';
    welcomeMsg.textContent = '';
    postsContainer.innerHTML = '';
    return;
  }
  currentUser = user;
  authSection.style.display = 'none';
  mainSection.style.display = 'block';
  welcomeMsg.textContent = "Welcome, " + user.name;
  loadPosts();
}

// API calls
async function registerUser(name, username, password) {
  const res = await fetch(API_URL + '/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, password }),
  });
  return res.json();
}

async function loginUser(username, password) {
  const res = await fetch(API_URL + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

async function createPost(userId, content) {
  const res = await fetch(API_URL + '/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, content }),
  });
  return res.json();
}

async function getPosts() {
  const res = await fetch(API_URL + '/posts');
  return res.json();
}

async function likePost(postId, userId) {
  const res = await fetch(API_URL + '/posts/' + postId + '/like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

async function unlikePost(postId, userId) {
  const res = await fetch(API_URL + '/posts/' + postId + '/unlike', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

async function addComment(postId, userId, content) {
  const res = await fetch(API_URL + '/posts/' + postId + '/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, content }),
  });
  return res.json();
}

async function getUserProfile(userId) {
  const res = await fetch(API_URL + '/users/' + userId);
  return res.json();
}

async function followUser(followerId, followingId) {
  const res = await fetch(API_URL + '/users/' + followingId + '/follow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ followerId }),
  });
  return res.json();
}

async function unfollowUser(followerId, followingId) {
  const res = await fetch(API_URL + '/users/' + followingId + '/unfollow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ followerId }),
  });
  return res.json();
}

// Event handlers
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.endsWith('login.html')) {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        if (!username || !password) {
          showMessage('Please enter username and password');
          return;
        }
        const result = await loginUser(username, password);
        if (result.error) {
          showMessage(result.error);
        } else {
          // Redirect to main feed page after login
          window.location.href = 'index.html';
          sessionStorage.setItem('currentUser', JSON.stringify(result.user));
        }
      });
    }
  } else if (path.endsWith('register.html')) {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Register form submitted');
        const name = document.getElementById('register-name').value.trim();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value.trim();
        if (!name || !username || !password) {
          showMessage('Please fill all fields');
          return;
        }
        const registerButton = registerForm.querySelector('button[type="submit"]');
        registerButton.disabled = true;
        try {
          const result = await registerUser(name, username, password);
          console.log('Register API result:', result);
          if (result.error) {
            showMessage(result.error);
          } else {
            showMessage('Registration successful. Please login.');
            registerForm.reset();
            // Redirect to login page after registration
            window.location.href = 'login.html';
          }
        } catch (error) {
          console.error('Register API call failed:', error);
          showMessage('Registration failed due to network error.');
        } finally {
          registerButton.disabled = false;
        }
      });
    }
  } else if (path.endsWith('index.html') || path === '/' || path === '') {
    // Main feed page logic
    const currentUserData = sessionStorage.getItem('currentUser');
    if (!currentUserData) {
      // Redirect to login if not logged in
      window.location.href = 'login.html';
      return;
    }
    const currentUser = JSON.parse(currentUserData);
    setCurrentUser(currentUser);

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
      });
    }

    const postBtn = document.getElementById('post-btn');
    if (postBtn) {
      postBtn.addEventListener('click', async () => {
        const postContent = document.getElementById('post-content');
        const content = postContent.value.trim();
        if (!content) {
          showMessage('Post content cannot be empty');
          return;
        }
        const result = await createPost(currentUser.id, content);
        if (result.error) {
          showMessage(result.error);
        } else {
          postContent.value = '';
          loadPosts();
        }
      });
    }
  }

});

logoutBtn.addEventListener('click', () => {
  setCurrentUser(null);
});

// Post creation
postBtn.addEventListener('click', async () => {
  const content = postContent.value.trim();
  if (!content) {
    showMessage('Post content cannot be empty');
    return;
  }
  const result = await createPost(currentUser.id, content);
  if (result.error) {
    showMessage(result.error);
  } else {
    postContent.value = '';
    loadPosts();
  }
});

// Load posts and render
async function loadPosts() {
  const posts = await getPosts();
  postsContainer.innerHTML = '';
  const userCache = new Map();
  for (const post of posts) {
    let user;
    if (userCache.has(post.userId)) {
      user = userCache.get(post.userId);
    } else {
      user = await getUserProfile(post.userId);
      userCache.set(post.userId, user);
    }
    const postDiv = document.createElement('div');
    postDiv.className = 'post';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'post-header';
    headerDiv.textContent = user.name + ' (@' + user.username + ')';
    postDiv.appendChild(headerDiv);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'post-content';
    contentDiv.textContent = post.content;
    postDiv.appendChild(contentDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'post-actions';

    // Like/unlike button
    const liked = post.likes.includes(currentUser.id);
    const likeBtn = document.createElement('button');
    likeBtn.textContent = liked ? 'Unlike' : 'Like';
    likeBtn.addEventListener('click', async () => {
      if (liked) {
        await unlikePost(post.id, currentUser.id);
      } else {
        await likePost(post.id, currentUser.id);
      }
      loadPosts();
    });
    actionsDiv.appendChild(likeBtn);

    // Delete button (only for post owner)
    if (post.userId === currentUser.id) {
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.marginLeft = '10px';
      deleteBtn.addEventListener('click', async () => {
        const confirmed = confirm('Are you sure you want to delete this post?');
        if (confirmed) {
          console.log('Current user:', currentUser);
          console.log('Current user ID:', currentUser ? currentUser.id : 'undefined');
          const url = API_URL + '/posts/' + post.id + '?userId=' + encodeURIComponent(currentUser.id);
          console.log('Sending DELETE request to:', url);
          const res = await fetch(url, {
            method: 'DELETE',
          });
          console.log('Delete response status:', res.status);
          if (!res.ok) {
            const errorData = await res.json();
            alert('Error deleting post: ' + errorData.error);
          } else {
            loadPosts();
          }
        }
      });
      actionsDiv.appendChild(deleteBtn);
    }

    // Likes count
    const likesCount = document.createElement('span');
    likesCount.textContent = "Likes: " + post.likes.length;
    actionsDiv.appendChild(likesCount);

    // Comments section
    const commentsDiv = document.createElement('div');
    commentsDiv.className = 'comments';

    for (const comment of post.comments) {
      let commentUser;
      if (userCache.has(comment.userId)) {
        commentUser = userCache.get(comment.userId);
      } else {
        commentUser = await getUserProfile(comment.userId);
        userCache.set(comment.userId, commentUser);
      }
      const commentDiv = document.createElement('div');
      commentDiv.className = 'comment';
      commentDiv.innerHTML = "<span class=\"comment-author\">" + commentUser.name + ":</span> " + comment.content;
      commentsDiv.appendChild(commentDiv);
    }

    // Add comment form
    const commentForm = document.createElement('form');
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const commentInput = commentForm.querySelector('input');
      const commentText = commentInput.value.trim();
      if (!commentText) {
        showMessage('Comment cannot be empty');
        return;
      }
      await addComment(post.id, currentUser.id, commentText);
      commentInput.value = '';
      loadPosts();
    });

    const commentInput = document.createElement('input');
    commentInput.type = 'text';
    commentInput.placeholder = 'Add a comment...';
    commentForm.appendChild(commentInput);

    const commentSubmit = document.createElement('button');
    commentSubmit.type = 'submit';
    commentSubmit.textContent = 'Comment';
    commentForm.appendChild(commentSubmit);

    postDiv.appendChild(actionsDiv);
    postDiv.appendChild(commentsDiv);
    postDiv.appendChild(commentForm);

    postsContainer.appendChild(postDiv);
  }
}

// Initialize
setCurrentUser(null);
