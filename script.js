const categories = [
  { name: "Pipes & Fittings", icon: "🔧", desc: "PVC pipes, elbows, valves and plumbing fittings." },
  { name: "Bathroom Products", icon: "🚿", desc: "Taps, showers, basins and bathroom accessories." },
  { name: "Electrical Products", icon: "⚡", desc: "Switches, sockets, wires, MCBs and accessories." },
  { name: "Hardware Tools", icon: "🛠️", desc: "Spanners, screwdrivers, pliers and tools." },
  { name: "Paint & Chemicals", icon: "🎨", desc: "Paints, primers, putty and related chemicals." }
];

const categoryGrid = document.querySelector("#categoryGrid");
const productGrid = document.querySelector("#productGrid");
const search = document.querySelector("#search");
const filter = document.querySelector("#categoryFilter");
const emptyState = document.querySelector("#emptyState");
const menuButton = document.querySelector(".menu-btn");
const navLinks = document.querySelector("#navLinks");

const productModal = document.querySelector("#productModal");
const modalMedia = document.querySelector("#modalMedia");
const modalMeta = document.querySelector("#modalMeta");
const modalTitle = document.querySelector("#modalTitle");
const modalSize = document.querySelector("#modalSize");
const modalPrice = document.querySelector("#modalPrice");
const modalWhatsapp = document.querySelector("#modalWhatsapp");
const closeProductModal = document.querySelector("#closeProductModal");

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

function productMedia(product, className) {
  if (product.image_url) {
    return `<img class="${className}" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">`;
  }

  return `<div class="${className} product-img-fallback" aria-hidden="true">${product.icon || "🛠️"}</div>`;
}

function formatPrice(price) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

function whatsappLink(product) {
  const message = `Hello Chaudhary Hardware & General Store, I want to enquire about ${product.name}. Price: ${formatPrice(product.price)}. Quantity: `;
  return `https://wa.me/916203007753?text=${encodeURIComponent(message)}`;
}

function updateCategoryButtons() {
  document.querySelectorAll(".category-card").forEach((card) => {
    card.setAttribute("aria-pressed", String(card.dataset.category === filter.value));
  });
}

function renderCategories() {
  categoryGrid.innerHTML = categories.map((category) => `
    <button type="button" class="category-card" data-category="${escapeHtml(category.name)}" aria-pressed="false">
      <span class="category-icon" aria-hidden="true">${category.icon}</span>
      <h3>${escapeHtml(category.name)}</h3>
      <p>${escapeHtml(category.desc)}</p>
    </button>
  `).join("");

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = category.name;
    filter.appendChild(option);
  });
}

function showProductDetails(product) {
  modalMedia.innerHTML = productMedia(product, "modal-photo");
  modalMeta.textContent = `${product.category} • ${product.brand || "—"}`;
  modalTitle.textContent = product.name;
  modalSize.textContent = `Size: ${product.size || "—"}`;
  modalPrice.textContent = formatPrice(product.price);
  modalWhatsapp.href = whatsappLink(product);
  productModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function hideProductDetails() {
  productModal.hidden = true;
  document.body.style.overflow = "";
}

function renderProducts() {
  const query = search.value.trim().toLowerCase();
  const selectedCategory = filter.value;

  const matchingProducts = products.filter((product) => {
    const searchableText = [
      product.name,
      product.brand,
      product.category,
      product.size
    ].join(" ").toLowerCase();

    return searchableText.includes(query) &&
      (selectedCategory === "All" || product.category === selectedCategory);
  });

  productGrid.innerHTML = matchingProducts.map((product) => `
    <article class="product-card">
      <div class="product-img" aria-label="${escapeHtml(product.name)}">${productMedia(product, "product-photo")}</div>
      <div class="product-body">
        <small>${escapeHtml(product.category)} • ${escapeHtml(product.brand || "—")}</small>
        <h3>${escapeHtml(product.name)}</h3>
        <small>Size: ${escapeHtml(product.size || "—")}</small>
        <div class="price">${formatPrice(product.price)}</div>
        <div class="product-actions">
          <a href="${whatsappLink(product)}" target="_blank" rel="noopener">WhatsApp</a>
          <button type="button" data-details-id="${product.id}">Details</button>
        </div>
      </div>
    </article>
  `).join("");

  emptyState.hidden = matchingProducts.length > 0;
  emptyState.textContent = "No products found. Try another search or category.";
  updateCategoryButtons();
}

async function loadProducts() {
  productGrid.setAttribute("aria-busy", "true");

  let query = storeSupabase
    .from("store_products")
    .select("id, name, brand, category, size, price, icon, image_url")
    .order("id", { ascending: true });

  let { data, error } = await query;

  if (error && /image_url/i.test(error.message || "")) {
    ({ data, error } = await storeSupabase
      .from("store_products")
      .select("id, name, brand, category, size, price, icon")
      .order("id", { ascending: true }));
  }

  productGrid.removeAttribute("aria-busy");

  if (error) {
    console.error(error);
    products = [];
    productGrid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.textContent = "Products could not load. Please refresh the page.";
    return;
  }

  products = data || [];
  renderProducts();
}

function closeMenu() {
  if (!menuButton || !navLinks) return;

  navLinks.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
}

search.addEventListener("input", renderProducts);
filter.addEventListener("change", renderProducts);

categoryGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".category-card");
  if (!card) return;

  filter.value = card.dataset.category;
  renderProducts();
  document.querySelector("#products").scrollIntoView({ behavior: "smooth", block: "start" });
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-details-id]");
  if (!button) return;

  const product = products.find((item) => item.id === Number(button.dataset.detailsId));
  if (product) showProductDetails(product);
});

closeProductModal.addEventListener("click", hideProductDetails);
productModal.addEventListener("click", (event) => {
  if (event.target === productModal) hideProductDetails();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideProductDetails();
});

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

document.querySelector("#year").textContent = new Date().getFullYear();

renderCategories();
loadProducts();