document
  .getElementById("login-btn")
  .addEventListener("click", doLogin);

document
  .getElementById("password")
  .addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      doLogin();
    }
  });

async function doLogin() {

  const email = document
    .getElementById("email")
    .value
    .trim();

  const password = document
    .getElementById("password")
    .value;

  const errorEl =
    document.getElementById("login-error");

  errorEl.style.display = "none";

  try {

    const success = await login(
      email,
      password
    );

    if (success) {

      const user = getCurrentUser();

      if (user?.role === "sales") {
        window.location.href = "dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }

    } else {

      errorEl.style.display = "block";

    }

  } catch (error) {

    console.error("Login Error:", error);

    errorEl.innerText =
      "Unable to login. Please try again.";

    errorEl.style.display = "block";
  }
}