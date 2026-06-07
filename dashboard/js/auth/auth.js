const AUTH_KEY = "reelscale_auth";
const USER_KEY = "reelscale_user";

const USERS_URL =
  "https://script.google.com/macros/s/AKfycbx4ZaU3l-XsieGxzfGg26XRSFb5TmxL3anOxrLHmpXcufsk3O8zMGWZkj-u0VWdPULG/exec";

let USERS = [];

/* =========================
   LOAD USERS
========================= */
async function loadUsers() {
  try {

    const response = await fetch(USERS_URL);
    const data = await response.json();

    // supports both formats
    USERS = data.users || data;

    console.log("Users Loaded:", USERS);

  } catch (error) {

    console.error(
      "Failed to load users:",
      error
    );

    USERS = [];
  }
}

/* =========================
   LOGIN
========================= */
async function login(
  email,
  password
) {

  if (!USERS.length) {
    await loadUsers();
  }

  const user = USERS.find(
    u =>
      u.email.trim().toLowerCase() ===
      email.trim().toLowerCase() &&
      u.password === password
  );

  if (!user) return false;

  localStorage.setItem(
    AUTH_KEY,
    "1"
  );

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

/* =========================
   LOGOUT
========================= */
function logout() {

  localStorage.removeItem(
    AUTH_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );

  localStorage.removeItem(
    "reelscale_current_page"
  );
}

/* =========================
   HELPERS
========================= */
function isLoggedIn() {

  return (
    localStorage.getItem(
      AUTH_KEY
    ) === "1"
  );
}

function getCurrentUser() {

  return JSON.parse(
    localStorage.getItem(
      USER_KEY
    ) || "null"
  );
}

/* =========================
   PRELOAD USERS
========================= */
loadUsers();