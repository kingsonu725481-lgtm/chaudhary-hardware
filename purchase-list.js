const purchaseSheetBody = document.querySelector("#purchaseSheetBody");
const purchaseTotal = document.querySelector("#purchaseTotal");
const purchaseMessage = document.querySelector("#purchaseMessage");
const productsTab = document.querySelector("#productsTab");
const purchaseTab = document.querySelector("#purchaseTab");
const productsPanel = document.querySelector("#productsPanel");
const purchasePanel = document.querySelector("#purchasePanel");

let purchaseUserId = "";
let purchaseRows = [];
let saveTimer = null;

function purchaseStorageKey() {
  return `ch-purchase-list:${purchaseUserId}`;
}

function createPurchaseRow(data = {}) {
  return {
    id: data.id || crypto.randomUUID(),
    date: data.date || new Date().toISOString().slice(0, 10),
    product: data.product || "",
    brand: data.brand || "",
    qty: Number(data.qty) || 0,
    unit: data.unit || "pcs",
    rate: Number(data.rate) || 0,
    supplier: data.supplier || "",
    notes: data.notes || ""
  };
}

function rowAmount(row) {
  return Number(row.qty) * Number(row.rate);
}

function formatAmount(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

function setPurchaseMessage(message = "", type = "") {
  if (!purchaseMessage) return;
  purchaseMessage.textContent = message;
  purchaseMessage.className = `form-message${type ? ` ${type}` : ""}`;
}

function savePurchaseList() {
  if (!purchaseUserId) return;
  localStorage.setItem(purchaseStorageKey(), JSON.stringify(purchaseRows));
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    savePurchaseList();
    setPurchaseMessage("Kharid list save ho gayi.", "success");
  }, 250);
}

function updatePurchaseTotal() {
  const total = purchaseRows.reduce((sum, row) => sum + rowAmount(row), 0);
  purchaseTotal.textContent = formatAmount(total);
}

function renderPurchaseSheet() {
  if (!purchaseRows.length) {
    purchaseRows.push(createPurchaseRow());
  }

  purchaseSheetBody.innerHTML = purchaseRows.map((row) => `
    <tr data-row-id="${row.id}">
      <td><input data-field="date" type="date" value="${escapeHtml(row.date)}"></td>
      <td><input data-field="product" type="text" value="${escapeHtml(row.product)}" placeholder="Product name"></td>
      <td><input data-field="brand" type="text" value="${escapeHtml(row.brand)}"></td>
      <td><input data-field="qty" type="number" min="0" step="0.01" value="${row.qty}"></td>
      <td><input data-field="unit" type="text" value="${escapeHtml(row.unit)}"></td>
      <td><input data-field="rate" type="number" min="0" step="0.01" value="${row.rate}"></td>
      <td class="amount-cell">${formatAmount(rowAmount(row))}</td>
      <td><input data-field="supplier" type="text" value="${escapeHtml(row.supplier)}"></td>
      <td><input data-field="notes" type="text" value="${escapeHtml(row.notes)}"></td>
      <td><button class="delete-row" type="button" data-delete-row="${row.id}">Delete</button></td>
    </tr>
  `).join("");

  updatePurchaseTotal();
}

function switchAdminTab(tab) {
  const showPurchase = tab === "purchase";

  productsTab.classList.toggle("active", !showPurchase);
  purchaseTab.classList.toggle("active", showPurchase);
  productsTab.setAttribute("aria-selected", String(!showPurchase));
  purchaseTab.setAttribute("aria-selected", String(showPurchase));
  productsPanel.hidden = showPurchase;
  purchasePanel.hidden = !showPurchase;
}

window.switchAdminTab = switchAdminTab;

function rowsToSheetData() {
  return [
    ["Date", "Product", "Brand", "Qty", "Unit", "Rate", "Amount", "Supplier", "Notes"],
    ...purchaseRows.map((row) => [
      row.date,
      row.product,
      row.brand,
      row.qty,
      row.unit,
      row.rate,
      rowAmount(row),
      row.supplier,
      row.notes
    ])
  ];
}

function downloadPurchaseExcel() {
  if (typeof XLSX === "undefined") {
    setPurchaseMessage("Excel library load nahi hui. Page refresh karke try karo.", "error");
    return;
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rowsToSheetData());
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 28 },
    { wch: 16 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Kharid List");
  XLSX.writeFile(workbook, "chaudhary-hardware-kharid-list.xlsx");
  setPurchaseMessage("Excel file download ho gayi.", "success");
}

function parseImportedRows(sheetRows) {
  const header = (sheetRows[0] || []).map((cell) => String(cell || "").trim().toLowerCase());
  const indexOf = (names) => header.findIndex((cell) => names.includes(cell));

  const dateIndex = indexOf(["date", "tarikh"]);
  const productIndex = indexOf(["product", "item", "saman"]);
  const brandIndex = indexOf(["brand"]);
  const qtyIndex = indexOf(["qty", "quantity", "qty."]);
  const unitIndex = indexOf(["unit"]);
  const rateIndex = indexOf(["rate", "rate (₹)", "price", "kharid rate"]);
  const supplierIndex = indexOf(["supplier", "dealer"]);
  const notesIndex = indexOf(["notes", "note", "remark"]);

  return sheetRows.slice(1)
    .filter((row) => (row || []).some((cell) => String(cell || "").trim() !== ""))
    .map((row) => createPurchaseRow({
      date: dateIndex >= 0 ? String(row[dateIndex] || "").slice(0, 10) : "",
      product: productIndex >= 0 ? String(row[productIndex] || "") : String(row[0] || ""),
      brand: brandIndex >= 0 ? String(row[brandIndex] || "") : "",
      qty: qtyIndex >= 0 ? Number(row[qtyIndex]) || 0 : 0,
      unit: unitIndex >= 0 ? String(row[unitIndex] || "pcs") : "pcs",
      rate: rateIndex >= 0 ? Number(row[rateIndex]) || 0 : 0,
      supplier: supplierIndex >= 0 ? String(row[supplierIndex] || "") : "",
      notes: notesIndex >= 0 ? String(row[notesIndex] || "") : ""
    }));
}

function importPurchaseExcel(file) {
  if (!file || typeof XLSX === "undefined") return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const workbook = XLSX.read(event.target.result, { type: "array", cellDates: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false });
    const importedRows = parseImportedRows(sheetRows);

    if (!importedRows.length) {
      setPurchaseMessage("Excel file mein koi row nahi mili.", "error");
      return;
    }

    purchaseRows = importedRows;
    savePurchaseList();
    renderPurchaseSheet();
    setPurchaseMessage("Excel file load ho gayi.", "success");
  };
  reader.readAsArrayBuffer(file);
}

window.loadPurchaseList = function loadPurchaseList(userId) {
  purchaseUserId = userId || "";
  try {
    const saved = localStorage.getItem(purchaseStorageKey());
    purchaseRows = saved ? JSON.parse(saved).map(createPurchaseRow) : [createPurchaseRow()];
  } catch (error) {
    console.error(error);
    purchaseRows = [createPurchaseRow()];
  }
  renderPurchaseSheet();
  setPurchaseMessage();
};

productsTab.addEventListener("click", () => switchAdminTab("products"));
purchaseTab.addEventListener("click", () => switchAdminTab("purchase"));

document.querySelector("#addPurchaseRow").addEventListener("click", () => {
  purchaseRows.push(createPurchaseRow());
  savePurchaseList();
  renderPurchaseSheet();
  setPurchaseMessage("Nayi row add ho gayi.", "success");
});

document.querySelector("#downloadPurchaseExcel").addEventListener("click", downloadPurchaseExcel);

document.querySelector("#uploadPurchaseExcel").addEventListener("change", (event) => {
  const file = event.target.files[0];
  importPurchaseExcel(file);
  event.target.value = "";
});

purchaseSheetBody.addEventListener("input", (event) => {
  const input = event.target.closest("[data-field]");
  const rowElement = event.target.closest("tr[data-row-id]");
  if (!input || !rowElement) return;

  const row = purchaseRows.find((item) => item.id === rowElement.dataset.rowId);
  if (!row) return;

  const field = input.dataset.field;
  row[field] = field === "qty" || field === "rate" ? Number(input.value) || 0 : input.value;
  rowElement.querySelector(".amount-cell").textContent = formatAmount(rowAmount(row));
  updatePurchaseTotal();
  scheduleSave();
});

purchaseSheetBody.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-row]");
  if (!deleteButton) return;

  const id = deleteButton.dataset.deleteRow;
  purchaseRows = purchaseRows.filter((row) => row.id !== id);
  if (!purchaseRows.length) {
    purchaseRows.push(createPurchaseRow());
  }
  savePurchaseList();
  renderPurchaseSheet();
  setPurchaseMessage("Row delete ho gayi.", "success");
});
