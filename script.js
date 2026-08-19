const categories = [
  {name:"Pipes & Fittings", icon:"🔧", desc:"PVC pipes, elbows, valves and plumbing fittings."},
  {name:"Bathroom Products", icon:"🚿", desc:"Taps, showers, basins and bathroom accessories."},
  {name:"Electrical Products", icon:"⚡", desc:"Switches, sockets, wires, MCBs and accessories."},
  {name:"Hardware Tools", icon:"🛠️", desc:"Spanners, screwdrivers, pliers and tools."},
  {name:"Paint & Chemicals", icon:"🎨", desc:"Paints, primers, putty and related chemicals."}
];

const products = [
  {id:1,name:"PVC Pipe",brand:"Sample Brand",category:"Pipes & Fittings",size:"1 inch",price:120,icon:"🪠"},
  {id:2,name:"PVC Elbow",brand:"Sample Brand",category:"Pipes & Fittings",size:"1 inch",price:35,icon:"🔩"},
  {id:3,name:"Bathroom Tap",brand:"Sample Brand",category:"Bathroom Products",size:"Standard",price:450,icon:"🚰"},
  {id:4,name:"Shower Set",brand:"Sample Brand",category:"Bathroom Products",size:"Standard",price:799,icon:"🚿"},
  {id:5,name:"Modular Switch",brand:"Sample Brand",category:"Electrical Products",size:"6A",price:85,icon:"💡"},
  {id:6,name:"MCB",brand:"Sample Brand",category:"Electrical Products",size:"16A",price:220,icon:"⚡"},
  {id:7,name:"Adjustable Spanner",brand:"Sample Brand",category:"Hardware Tools",size:"10 inch",price:280,icon:"🔧"},
  {id:8,name:"Wall Paint",brand:"Sample Brand",category:"Paint & Chemicals",size:"20 L",price:2450,icon:"🪣"}
];

const categoryGrid = document.querySelector("#categoryGrid");
const productGrid = document.querySelector("#productGrid");
const search = document.querySelector("#search");
const filter = document.querySelector("#categoryFilter");
const empty = document.querySelector("#emptyState");

categories.forEach(c => {
  categoryGrid.innerHTML += `<article class="category-card">
    <div class="category-icon">${c.icon}</div>
    <h3>${c.name}</h3><p>${c.desc}</p>
  </article>`;
  filter.innerHTML += `<option value="${c.name}">${c.name}</option>`;
});

function renderProducts() {
  const q = search.value.trim().toLowerCase();
  const cat = filter.value;
  const list = products.filter(p => {
    const matchesText = [p.name,p.brand,p.category,p.size].join(" ").toLowerCase().includes(q);
    return matchesText && (cat === "All" || p.category === cat);
  });
  productGrid.innerHTML = "";
  empty.hidden = list.length > 0;
  list.forEach(p => {
    const message = encodeURIComponent(`Hello Chaudhary Hardware & General Store, I want to enquire about ${p.name}. Price: ₹${p.price}. Quantity: `);
    productGrid.innerHTML += `<article class="product-card">
      <div class="product-img" aria-label="${p.name}">${p.icon}</div>
      <div class="product-body">
        <small>${p.category} • ${p.brand}</small>
        <h3>${p.name}</h3>
        <small>Size: ${p.size} • <strong>In Stock</strong></small>
        <div class="price">₹${p.price.toLocaleString("en-IN")}</div>
        <div class="product-actions">
          <a href="https://wa.me/916203007753?text=${message}" target="_blank" rel="noopener">WhatsApp</a>
          <button type="button" onclick="alert('Product details can be expanded here when you connect a database/admin panel.')">Details</button>
        </div>
      </div>
    </article>`;
  });
}

search.addEventListener("input", renderProducts);
filter.addEventListener("change", renderProducts);
renderProducts();

document.querySelector(".menu-btn").addEventListener("click", () => {
  document.querySelector("#navLinks").classList.toggle("open");
});
document.querySelectorAll("#navLinks a").forEach(a => a.addEventListener("click", () => document.querySelector("#navLinks").classList.remove("open")));
document.querySelector("#year").textContent = new Date().getFullYear();
