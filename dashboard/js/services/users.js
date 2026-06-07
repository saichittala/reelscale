const USERS_URL =
  "https://script.google.com/macros/s/AKfycbx4ZaU3l-XsieGxzfGg26XRSFb5TmxL3anOxrLHmpXcufsk3O8zMGWZkj-u0VWdPULG/exec";

let users = [];

/* =========================
   LOAD USERS
========================= */
async function loadUsers() {

  try {

    usersLoaded = false;
    render();

    const response =
      await fetch(USERS_URL);

    const data =
      await response.json();

    console.log("Users:", data);

    if (data.success) {
      users = data.users || [];
    } else {
      users = [];
    }

    usersLoaded = true;
    render();

  } catch (error) {

    console.error(
      "Users Load Error:",
      error
    );

    users = [];
    usersLoaded = true;

    render();
  }
}

/* =========================
   ADD USER
========================= */
async function addUser(data) {

  try {

    const response =
      await fetch(USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          action: "add",
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role
        })
      });

    const result =
      await response.json();

    if (!result.success) {
      throw new Error(
        result.message ||
        "Add failed"
      );
    }

    await loadUsers();

    showToast(
      "User added successfully"
    );

  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      "Failed to add user",
      "error"
    );
  }
}

/* =========================
   UPDATE USER
========================= */
async function updateUser(
  id,
  data
) {

  const index =
    users.findIndex(
      x =>
        String(x.id) ===
        String(id)
    );

  if (index === -1) return;

  const oldData = {
    ...users[index]
  };

  users[index] = {
    ...users[index],
    ...data
  };

  render();

  try {

    const response =
      await fetch(USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          action: "update",
          id,
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role
        })
      });

    const result =
      await response.json();

    if (!result.success) {

      throw new Error(
        result.message ||
        "Update failed"
      );
    }

    await loadUsers();

    showToast(
      "User updated successfully"
    );

  } catch (error) {

    users[index] =
      oldData;

    render();

    showToast(
      error.message ||
      "Failed to update user",
      "error"
    );

    console.error(error);
  }
}

/* =========================
   DELETE USER
========================= */
async function deleteUser(id) {

  const deletedUser =
    users.find(
      x =>
        String(x.id) ===
        String(id)
    );

  users =
    users.filter(
      x =>
        String(x.id) !==
        String(id)
    );

  render();

  try {

    const response =
      await fetch(USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          action: "delete",
          id
        })
      });

    const result =
      await response.json();

    if (!result.success) {

      throw new Error(
        result.message ||
        "Delete failed"
      );
    }

    await loadUsers();

    showToast(
      "User deleted successfully"
    );

  } catch (error) {

    if (deletedUser) {
      users.unshift(
        deletedUser
      );
    }

    render();

    showToast(
      error.message ||
      "Failed to delete user",
      "error"
    );

    console.error(error);
  }
}