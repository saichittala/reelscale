const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbylr9KMErADMLGAmqoUZa9lIzhoIwOqw3mAWfPPGUpRQjIimzAqnzfGJYGX8LLKsSoC/exec";

/* =========================
   LOAD CLIENTS
========================= */
async function loadGoogleSheetData() {

  try {

    clientsLoaded = false;
    render();

    const response =
      await fetch(SCRIPT_URL);

    const data =
      await response.json();

    localStorage.setItem(
      "clients_cache",
      JSON.stringify(data)
    );

    clients = data.map(row => ({
      id: row.id,
      name: row.clientName,
      business: row.business,
      phone: row.phone,
      instagram: row.instagram,
      reels: row.reels,
      ppr: row.pricePerReel,
      image: row.image
    }));

    clientsLoaded = true;

    render();

  } catch (error) {

    console.error(
      "Clients Load Error:",
      error
    );

    clientsLoaded = true;

    render();
  }
}

/* =========================
   ADD CLIENT
========================= */
async function addClient(data) {

  try {

    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "add",
        clientName: data.name,
        business: data.business,
        phone: data.phone,
        instagram: data.instagram,
        reels: Number(data.reels),
        pricePerReel: Number(data.ppr),
        image: data.image || ""
      })
    });

    await loadGoogleSheetData();

    showToast(
      "Client added successfully"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Failed to add client",
      "error"
    );
  }
}

/* =========================
   UPDATE CLIENT
========================= */
async function updateClient(
  id,
  data
) {

  try {

    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "update",
        id,
        clientName: data.name,
        business: data.business,
        phone: data.phone,
        instagram: data.instagram,
        reels: Number(data.reels),
        pricePerReel: Number(data.ppr),
        image: data.image || ""
      })
    });

    await loadGoogleSheetData();

    showToast(
      "Client updated successfully"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Failed to update client",
      "error"
    );
  }
}

/* =========================
   DELETE CLIENT
========================= */
async function deleteClient(id) {

  try {

    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "delete",
        id
      })
    });

    await loadGoogleSheetData();

    showToast(
      "Client deleted successfully"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Failed to delete client",
      "error"
    );
  }
}