import { queryClientInstance } from '@/lib/query-client';

const USERS_KEY         = 'auracycle_users';
const CURRENT_USER_KEY  = 'auracycle_current_user';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function hashPassword(password) {
  const msgBuffer  = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null'); }
  catch { return null; }
}

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export async function register(username, password) {
  if (!username?.trim()) throw new Error('Username is required');
  if (!password || password.length < 4) throw new Error('Password must be at least 4 characters');

  const users = getUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Username already taken');
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id:           generateId(),
    username:     username.trim(),
    passwordHash,
    createdAt:    new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);

  const session = { id: user.id, username: user.username };
  setCurrentUser(session);
  queryClientInstance.clear();
  return session;
}

export async function login(username, password) {
  if (!username?.trim()) throw new Error('Username is required');
  if (!password) throw new Error('Password is required');

  const users = getUsers();
  const user  = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) throw new Error('User not found');

  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) throw new Error('Incorrect password');

  const session = { id: user.id, username: user.username };
  setCurrentUser(session);
  queryClientInstance.clear();
  return session;
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  queryClientInstance.clear();
}

export function hasCompletedOnboarding(userId) {
  return !!localStorage.getItem(`auracycle_onboarded_${userId}`);
}

export function setOnboardingComplete(userId) {
  localStorage.setItem(`auracycle_onboarded_${userId}`, 'true');
}
