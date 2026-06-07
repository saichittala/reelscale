const SALES_URL =
  "https://script.google.com/macros/s/AKfycbyofRzBP8UpOX5Nt-l8C6Mj5rw5dHQH8YAt5sBPiltzyfndAiEKZh_4xyVhsV11lBb0/exec";

/* =========================
   LOAD SALES
========================= */
async function loadSales() {

  try {

    salesLoaded = false;

    render();

    const response =
      await fetch(SALES_URL);

    const result =
      await response.json();

    sales =
      result.leads || [];

    salesLoaded = true;
    dataLoaded = true;

    render();

  } catch (error) {

    console.error(
      "Sales Load Error:",
      error
    );

    salesLoaded = true;

    render();
  }
}

/* =========================
   ADD SALE
========================= */
async function addSale(data) {

  const tempLead = {
    id: Date.now(),
    createdDate:
      new Date().toLocaleDateString(),
    ...data
  };

  sales.unshift(tempLead);

  render();

  try {

    await fetch(SALES_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "add",
        category: data.category,
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        phoneNumber: data.phoneNumber,
        notes: data.notes,
        contacted: data.contacted
      })
    });

    showToast(
      "Lead added successfully"
    );

  } catch (error) {

    sales =
      sales.filter(
        x => x.id !== tempLead.id
      );

    render();

    showToast(
      "Failed to add lead",
      "error"
    );

    console.error(error);
  }
}

/* =========================
   UPDATE SALE
========================= */
async function updateSale(
  id,
  data
) {

  const index =
    sales.findIndex(
      x =>
        String(x.id) ===
        String(id)
    );

  if (index === -1) return;

  const oldData = {
    ...sales[index]
  };

  sales[index] = {
    ...sales[index],
    ...data
  };

  render();

  try {

    await fetch(SALES_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "update",
        id,
        category: data.category,
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        phoneNumber: data.phoneNumber,
        notes: data.notes,
        contacted: data.contacted
      })
    });

    showToast(
      "Lead updated successfully"
    );

  } catch (error) {

    sales[index] =
      oldData;

    render();

    showToast(
      "Failed to save changes",
      "error"
    );

    console.error(error);
  }
}

/* =========================
   DELETE SALE
========================= */
async function deleteSale(id) {

  const deletedLead =
    sales.find(
      x =>
        String(x.id) ===
        String(id)
    );

  sales =
    sales.filter(
      x =>
        String(x.id) !==
        String(id)
    );

  render();

  try {

    await fetch(SALES_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "delete",
        id
      })
    });

    showToast(
      "Lead deleted successfully"
    );

  } catch (error) {

    if (deletedLead) {
      sales.unshift(deletedLead);
    }

    render();

    showToast(
      "Failed to delete lead",
      "error"
    );

    console.error(error);
  }
}

/* =========================
   IMPORT SALES XLS
========================= */
async function handleSalesImport(
  event
) {

  const file =
    event.target.files[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload =
    async (e) => {

      const workbook =
        XLSX.read(
          e.target.result,
          { type: "array" }
        );

      const sheet =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      const rows =
        XLSX.utils.sheet_to_json(
          sheet
        );

      if (!rows.length) {

        showToast(
          "No records found",
          "error"
        );

        return;
      }

      showToast(
        `Importing ${rows.length} leads...`
      );

      for (const row of rows) {

        await addSale({
          category:
            row.Category || "",

          companyName:
            row.CompanyName ||
            row.Company ||
            "",

          contactPerson:
            row.ContactPerson || "",

          phoneNumber:
            row.PhoneNumber ||
            row.Phone ||
            "",

          notes:
            row.Notes || "",

          contacted:
            row.Contacted ||
            "No"
        });
      }

      showToast(
        `${rows.length} leads imported successfully`
      );
    };

  reader.readAsArrayBuffer(file);
}