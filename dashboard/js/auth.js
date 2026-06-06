const AUTH_KEY = "reelscale_auth";
const USER_KEY = "reelscale_user";

const USERS_URL = "https://script.google.com/macros/s/AKfycbx4ZaU3l-XsieGxzfGg26XRSFb5TmxL3anOxrLHmpXcufsk3O8zMGWZkj-u0VWdPULG/exec";
let USERS = [];

async function loadUsers() {
    try {
        const response = await fetch(USERS_URL);
        const data = await response.json();

        USERS = data.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role
        }));

        console.log("Users Loaded:", USERS);

    } catch (error) {
        console.error("Failed to load users:", error);
    }
}

async function login(email, password) {

    if (!USERS.length) {
        await loadUsers();
    }

    const user = USERS.find(
        u =>
            u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
            u.password === password
    );

    if (!user) return false;

    localStorage.setItem(AUTH_KEY, "1");

    localStorage.setItem(
        USER_KEY,
        JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        })
    );

    return true;
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
}

function isLoggedIn() {
    return localStorage.getItem(AUTH_KEY) === "1";
}

function getCurrentUser() {
    return JSON.parse(
        localStorage.getItem(USER_KEY) || "null"
    );
}

// Preload users when page loads
loadUsers();