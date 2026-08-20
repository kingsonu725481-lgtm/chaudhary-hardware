const loginView = document.querySelector("#loginView");
const adminDashboard = document.querySelector("#adminDashboard");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const adminMessage = document.querySelector("#adminMessage");
const adminEmail = document.querySelector("#adminEmail");
const logoutButton = document.querySelector("#logoutButton");
const productForm = document.querySelector("#productForm");
const productId = document.querySelector("#productId");
const productName = document.querySelector("#productName");
const productBrand = document.querySelector("#productBrand");
const productCategory = document.querySelector("#productCategory");
const productSize = document.querySelector("#productSize");
const productPrice = document.querySelector("#productPrice");
const productIcon = document.querySelector("#productIcon");
const formTitle = document.querySelector("#formTitle");
const saveProductButton = document.querySelector("#saveProductButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const adminProducts = document.querySelector("#adminProducts");
const productCount = document.querySelector("#productCount");

let products = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function formatPrice(price) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

function setMessage(element, message = "", type = "") {
  element.textContent = message;
  element.className = `form-message${type ? ` ${type}` : ""}`;
}

function resetProductForm() {
  productForm.reset();
  productId.value = "";
  productIcon.value = "🛠️";
  formTitle.textContent = "Add Product";
  saveProductButton.textContent = "Save Product";
  cancelEditButton.hidden = true;
}

function renderProducts() {
  productCount.textContent = products.length;

  if (!products.length) {
    adminProducts.innerHTML = `<p class="empty-admin">No products found.</p>`;
    return;
  }

  adminProducts.innerHTML = products.map((product) => `
    <article class="admin-product">
      <div class="admin-product-icon" aria-hidden="true">${product.icon || "🛠️"}</div>

      <div class="admin-product-info">
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.category)} • ${escapeHtml(product.brand || "—")}</p>
        <p>Size: ${escapeHtml(product.size || "—")}</p>
        <p class="admin-price">${formatPrice(product.price)}</p>
      </div>

      <div class="product-row-actions">
        <button class="edit-product" type="button" data-edit-id="${product.id}">Edit</button>
        <button class="delete-product" type="button" data-delete-id="${product.id}">Delete</button>
      </div>
    </article>
  `).join("");
}

async function loadProducts() {
  adminProducts.innerHTML = `<p class="empty-admin">Loading products...</p>`;

  const { data, error } = await storeSupabase
    .from("store_products")
    .select("id, name, brand, category, size, price, icon")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    products = [];
    productCount.textContent = "0";
    adminProducts.innerHTML = `<p class="empty-admin">Products could not load.</p>`;
    setMessage(adminMessage, error.message, "error");
    return;
  }

  products = data || [];
  renderProducts();
}

function startEditing(product) {
  productId.value = product.id;
  productName.value = product.name || "";
  productBrand.value = product.brand || "";
  productCategory.value = product.category || "Pipes & Fittings";
  productSize.value = product.size || "";
  productPrice.value = product.price;
  productIcon.value = product.icon || "🛠️";

  formTitle.textContent = "Edit Product";
  saveProductButton.textContent = "Update Product";
  cancelEditButton.hidden = false;

  document.querySelector(".product-form-card").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function showDashboard(session) {
  loginView.hidden = true;
  adminDashboard.hidden = false;
  adminEmail.textContent = session.user.email || "";
  setMessage(adminMessage);
  await loadProducts();

  if (typeof loadPurchaseList === "function") {
    loadPurchaseList(session.user.id);
  }
}

function showLogin() {
  adminDashboard.hidden = true;
  loginView.hidden = false;
  resetProductForm();

  if (typeof switchAdminTab === "function") {
    switchAdminTab("products");
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;
  const submitButton = loginForm.querySelector("button[type='submit']");

  submitButton.disabled = true;
  setMessage(loginMessage, "Logging in...");

  const { data, error } = await storeSupabase.auth.signInWithPassword({
    email,
    password
  });

  submitButton.disabled = false;

  if (error) {
    setMessage(loginMessage, "Incorrect email or password.", "error");
    return;
  }

  setMessage(loginMessage);
  await showDashboard(data.session);
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  const { error } = await storeSupabase.auth.signOut();

  logoutButton.disabled = false;

  if (error) {
    setMessage(adminMessage, error.message, "error");
    return;
  }

  showLogin();
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = productId.value;
  const payload = {
    name: productName.value.trim(),
    brand: productBrand.value.trim(),
    category: productCategory.value,
    size: productSize.value.trim(),
    price: Number(productPrice.value),
    icon: productIcon.value.trim() || "🛠️"
  };

  saveProductButton.disabled = true;
  setMessage(adminMessage, id ? "Updating product..." : "Adding product...");

  let error;

  if (id) {
    ({ error } = await storeSupabase
      .from("store_products")
      .update(payload)
      .eq("id", Number(id)));
  } else {
    ({ error } = await storeSupabase
      .from("store_products")
      .insert(payload));
  }

  saveProductButton.disabled = false;

  if (error) {
    console.error(error);
    setMessage(adminMessage, error.message, "error");
    return;
  }

  resetProductForm();
  setMessage(
    adminMessage,
    id ? "Product updated successfully." : "Product added successfully.",
    "success"
  );

  await loadProducts();
});

cancelEditButton.addEventListener("click", () => {
  resetProductForm();
  setMessage(adminMessage);
});

adminProducts.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-id]");
  const deleteButton = event.target.closest("[data-delete-id]");

  if (editButton) {
    const product = products.find((item) => item.id === Number(editButton.dataset.editId));
    if (product) startEditing(product);
    return;
  }

  if (deleteButton) {
    const id = Number(deleteButton.dataset.deleteId);
    const product = products.find((item) => item.id === id);

    if (!product || !confirm(`Delete "${product.name}"?`)) {
      return;
    }

    setMessage(adminMessage, "Deleting product...");

    const { error } = await storeSupabase
      .from("store_products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMessage(adminMessage, error.message, "error");
      return;
    }

    setMessage(adminMessage, "Product deleted successfully.", "success");
    await loadProducts();
  }
});

async function initialiseAdmin() {
  const { data, error } = await storeSupabase.auth.getSession();

  if (error || !data.session) {
    showLogin();
    return;
  }

  await showDashboard(data.session);
}

initialiseAdmin();