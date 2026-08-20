const categories = [
  { name: "Pipes & Fittings", icon: "🔧", desc: "PVC pipes, elbows, valves and plumbing fittings." },
  { name: "Bathroom Products", icon: "🚿", desc: "Taps, showers, basins and bathroom accessories." },
  { name: "Electrical Products", icon: "⚡", desc: "Switches, sockets, wires, MCBs and accessories." },
  { name: "Hardware Tools", icon: "🛠️", desc: "Spanners, screwdrivers, pliers and tools." },
  { name: "Paint & Chemicals", icon: "🎨", desc: "Paints, primers, putty and related chemicals." }
];

const products = [
  { id: 1, name: "PVC Pipe", brand: "Sample Brand", category: "Pipes & Fittings", size: "1 inch", price: 120, icon: "🪠" },
  { id: 2, name: "PVC Elbow", brand: "Sample Brand", category: "Pipes & Fittings", size: "1 inch", price: 35, icon: "🔩" },
  { id: 3, name: "Bathroom Tap", brand: "Sample Brand", category: "Bathroom Products", size: "Standard", price: 450, icon: "🚰" },
  { id: 4, name: "Shower Set", brand: "Sample Brand", category: "Bathroom Products", size: "Standard", price: 799, icon: "🚿" },
  { id: 5, name: "Modular Switch", brand: "Sample Brand", category: "Electrical Products", size: "6A", price: 85, icon: "💡" },
  { id: 6, name: "MCB", brand: "Sample Brand", category: "Electrical Products", size: "16A", price: 220, icon: "⚡" },
  { id: 7, name: "Adjustable Spanner", brand: "Sample Brand", category: "Hardware Tools", size: "10 inch", price: 280, icon: "🔧" },
  { id: 8, name: "Wall Paint", brand: "Sample Brand", category: "Paint & Chemicals", size: "20 L", price: 2450, icon: "🪣" }
];

const categoryGrid = document.querySelector("#categoryGrid");
const productGrid = document.querySelector("#productGrid");
const search = document.querySelector("#search");
const filter = document.querySelector("#categoryFilter");
const emptyState = document.querySelector("#emptyState");
const menuButton = document.querySelector(".menu-btn");
const navLinks = document.querySelector("#navLinks");

function formatPrice(price) {
  return `₹${price.toLocaleString("en-IN")}`;
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
  const fragment = document.createDocumentFragment();

  categories.forEach((category) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "category-card";
    card.dataset.category = category.name;
    card.setAttribute("aria-pressed", "false");
    card.innerHTML = `
      <span class="category-icon" aria-hidden="true">${category.icon}</span>
      <h3>${category.name}</h3>
      <p>${category.desc}</p>
    `;

    card.addEventListener("click", () => {
      filter.value = category.name;
      renderProducts();
      document.querySelector("#products").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    fragment.appendChild(card);

    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = category.name;
    filter.appendChild(option);
  });

  categoryGrid.appendChild(fragment);
}

function showProductDetails(product) {
  alert(
    `${product.name}\n\n` +
    `Category: ${product.category}\n` +
    `Brand: ${product.brand}\n` +
    `Size: ${product.size}\n` +
    `Price: ${formatPrice(product.price)}\n\n` +
    `Please contact us on WhatsApp for an enquiry.`
  );
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

  const fragment = document.createDocumentFragment();

  matchingProducts.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("div");
    image.className = "product-img";
    image.setAttribute("aria-label", product.name);
    image.textContent = product.icon;

    const body = document.createElement("div");
    body.className = "product-body";
    body.innerHTML = `
      <small>${product.category} • ${product.brand}</small>
      <h3>${product.name}</h3>
      <small>Size: ${product.size}</small>
      <div class="price">${formatPrice(product.price)}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "product-actions";

    const whatsapp = document.createElement("a");
    whatsapp.href = whatsappLink(product);
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener";
    whatsapp.textContent = "WhatsApp";
    whatsapp.setAttribute("aria-label", `Enquire about ${product.name} on WhatsApp`);

    const details = document.createElement("button");
    details.type = "button";
    details.textContent = "Details";
    details.addEventListener("click", () => showProductDetails(product));

    actions.append(whatsapp, details);
    body.appendChild(actions);
    card.append(image, body);
    fragment.appendChild(card);
  });

  productGrid.replaceChildren(fragment);
  emptyState.hidden = matchingProducts.length > 0;
  updateCategoryButtons();
}

function closeMenu() {
  navLinks.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
}

search.addEventListener("input", renderProducts);
filter.addEventListener("change", renderProducts);

menuButton.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();

renderCategories();
renderProducts();