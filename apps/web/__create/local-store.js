/**
 * Local file-based user store for development.
 * Stores users and hashed passwords in .data/users.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), '.data');
const USERS_FILE = join(DATA_DIR, 'users.json');

function ensureDataDir() {
    if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
    }
}

function readUsers() {
    ensureDataDir();
    if (!existsSync(USERS_FILE)) {
        return [];
    }
    try {
        return JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

function writeUsers(users) {
    ensureDataDir();
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export function getUserByEmail(email) {
    const users = readUsers();
    return users.find(u => u.email === email) ?? null;
}

export function createUser({ email, name, password }) {
    const users = readUsers();
    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const newUser = {
        id,
        email,
        name: name ?? email.split('@')[0],
        password,         // already hashed
        emailVerified: null,
        image: null,
        createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeUsers(users);
    return newUser;
}

export function getAllUsers() {
    return readUsers();
}
