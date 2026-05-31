document
  .getElementById("login-btn")
  .addEventListener("click", doLogin);

document
  .getElementById("password")
  .addEventListener("keydown", e => {
    if (e.key === "Enter") doLogin();
  });

function doLogin() {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  if (login(email, password)) {

    window.location.href =
      "dashboard.html";

  } else {

    document.getElementById(
      "login-error"
    ).style.display = "block";
  }
}