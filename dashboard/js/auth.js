const CREDENTIALS = {
    email: "admin@reelscale.com",
    password: "surya@123"
};

document
.getElementById("loginBtn")
.addEventListener("click", () => {

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;

    if (
        email === CREDENTIALS.email &&
        password === CREDENTIALS.password
    ) {

        localStorage.setItem(
            "reelscale_auth",
            "1"
        );

        window.location.href =
            "dashboard.html";

    } else {

        document.getElementById("error")
        .innerText =
        "Invalid Credentials";

    }

});