const AUTH_KEY = "reelscale_auth";
const USER_KEY = "reelscale_user";

const USERS = [
    {
        email: "admin@reelscale.com",
        password: "surya@123",
        role: "admin",
        name: "Admin"
    },
    {
        email: "sales@reelscale.com",
        password: "sales@123",
        role: "sales",
        name: "Sales"
    }
];

function login(email, password) {

    const user = USERS.find(
        u =>
            u.email === email &&
            u.password === password
    );

    if (!user) return false;

    localStorage.setItem(AUTH_KEY, "1");
    localStorage.setItem(
        USER_KEY,
        JSON.stringify(user)
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