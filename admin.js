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
const productImage = document.querySelector("#productImage");
const productImageUrl = document.querySelector("#productImageUrl");
const imagePreviewImg = document.querySelector("#imagePreviewImg");
const imagePreviewText = document.querySelector("#imagePreviewText");
const removeImageButton = document.querySelector("#removeImageButton");
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

function setImagePreview(url = "") {
  productImageUrl.value = url || "";

  if (url) {
    imagePreviewImg.src = url;
    imagePreviewImg.hidden = false;
    imagePreviewText.hidden = true;
    removeImageButton.hidden = false;
    return;
  }

  imagePreviewImg.removeAttribute("src");
  imagePreviewImg.hidden = true;
  imagePreviewText.hidden = false;
  removeImageButton.hidden = true;
}

function resetProductForm() {
  productForm.reset();
  productId.value = "";
  productIcon.value = "🛠️";
  setImagePreview("");
  formTitle.textContent = "Add Product";
  saveProductButton.textContent = "Save Product";
  cancelEditButton.hidden = true;
}

function productThumb(product) {
  if (product.image_url) {
    return `<img class="admin-product-photo" src="${escapeHtml(product.image_url)}" alt="">`;
  }

  return `<div class="admin-product-icon" aria-hidden="true">${product.icon || "🛠️"}</div>`;
}

function renderProducts() {
  productCount.textContent = products.length;

  if (!products.length) {
    adminProducts.innerHTML = `<p class="empty-admin">No products found.</p>`;
    return;
  }

  adminProducts.innerHTML = products.map((product) => `
    <article class="admin-product">
      ${productThumb(product)}

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

  let { data, error } = await storeSupabase
    .from("store_products")
    .select("id, name, brand, category, size, price, icon, image_url")
    .order("id", { ascending: true });

  if (error && /image_url/i.test(error.message || "")) {
    ({ data, error } = await storeSupabase
      .from("store_products")
      .select("id, name, brand, category, size, price, icon")
      .order("id", { ascending: true }));
  }

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
  setImagePreview(product.image_url || "");
  productImage.value = "";

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

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const maxSize = 900;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Photo compress nahi ho saki."));
      }, "image/jpeg", 0.74);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Photo padhi nahi ja saki."));
    };

    image.src = objectUrl;
  });
}

async function uploadProductImage(file) {
  const blob = await compressImage(file);
  const path = `${Date.now()}-${file.name.replace(/[^\w.-]+/g, "-").toLowerCase()}.jpg`;

  const { error } = await storeSupabase.storage
    .from("product-images")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });

  if (!error) {
    const { data } = storeSupabase.storage.from("product-images").getPublicUrl(path);
    if (data?.publicUrl) return data.publicUrl;
  }

  return blobToDataUrl(blob);
}

productImage.addEventListener("change", async () => {
  const file = productImage.files[0];
  if (!file) return;

  setMessage(adminMessage, "Photo ready kar rahe hain...");
  try {
    const url = await uploadProductImage(file);
    setImagePreview(url);
    setMessage(adminMessage, "Photo add ho gayi. Save Product dabao.", "success");
  } catch (error) {
    console.error(error);
    setMessage(adminMessage, error.message || "Photo add nahi ho saki.", "error");
  }
});

removeImageButton.addEventListener("click", () => {
  productImage.value = "";
  setImagePreview("");
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
    icon: productIcon.value.trim() || "🛠️",
    image_url: productImageUrl.value || null
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

  if (error && /image_url/i.test(error.message || "")) {
    delete payload.image_url;
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

    if (!error) {
      saveProductButton.disabled = false;
      resetProductForm();
      setMessage(
        adminMessage,
        "Product save ho gaya, lekin photo ke liye Supabase SQL Editor mein ye run karo: alter table store_products add column if not exists image_url text;",
        "error"
      );
      await loadProducts();
      return;
    }
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