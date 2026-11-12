// LAVADOS PREMIUM - DEMO V1

const STORAGE_KEY = "lavados_premium_v1";
const PRICE_KEY = "lavados_premium_prices_v1";

const vehicleTypes = ["Moto", "Auto", "Camioneta"];
const washTypes = ["Exterior", "Completo", "Premium"];

const defaultPrices = {
  Moto: {
    Exterior: 5000,
    Completo: 7000,
    Premium: 10000
  },
  Auto: {
    Exterior: 10000,
    Completo: 15000,
    Premium: 20000
  },
  Camioneta: {
    Exterior: 15000,
    Completo: 20000,
    Premium: 28000
  }
};

let washes = loadData(STORAGE_KEY, []);
let prices = loadData(PRICE_KEY, defaultPrices);

function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(washes));
}

function savePriceData() {
  localStorage.setItem(PRICE_KEY, JSON.stringify(prices));
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// NAVEGACIÓN

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(section => {
    section.classList.add("hidden");
  });

  document.getElementById(sectionId).classList.remove("hidden");

  document.querySelectorAll(".navigation button").forEach(button => {
    button.classList.remove("active");
  });

  const sections = [
    "dashboard",
    "newWash",
    "clients",
    "admin"
  ];

  const index = sections.indexOf(sectionId);

  if (index >= 0) {
    document.querySelectorAll(".navigation button")[index]
      .classList.add("active");
  }

  renderAll();
}

// PRECIOS

function updateSuggestedPrice() {
  const vehicle = document.getElementById("vehicleType").value;
  const service = document.getElementById("washType").value;
  const priceInput = document.getElementById("washPrice");

  if (vehicle && service && prices[vehicle]) {
    priceInput.value = prices[vehicle][service] ?? 0;
  }
}

function renderPriceSettings() {
  const container = document.getElementById("priceSettings");

  container.innerHTML = vehicleTypes.map(vehicle => `
    <div class="card">
      <h3>${vehicle}</h3>

      ${washTypes.map(service => `
        <div class="price-row">
          <label>${service}</label>
          <input
            type="number"
            min="0"
            data-vehicle="${vehicle}"
            data-service="${service}"
            value="${prices[vehicle]?.[service] ?? 0}">
        </div>
      `).join("")}
    </div>
  `).join("");
}

function savePrices() {
  document.querySelectorAll("#priceSettings input").forEach(input => {
    const vehicle = input.dataset.vehicle;
    const service = input.dataset.service;

    if (!prices[vehicle]) {
      prices[vehicle] = {};
    }

    prices[vehicle][service] = Number(input.value) || 0;
  });

  savePriceData();
  updateSuggestedPrice();

  alert("Precios actualizados correctamente.");
}

// REGISTRO DE LAVADOS

function registerWash(event) {
  event.preventDefault();

  const name = document.getElementById("clientName").value.trim();
  const phone = document.getElementById("clientPhone").value.trim();
  const vehicle = document.getElementById("vehicleType").value;
  const plate = document.getElementById("licensePlate").value
    .trim().toUpperCase();
  const description = document.getElementById("vehicleDescription")
    .value.trim();
  const service = document.getElementById("washType").value;
  const price = Number(document.getElementById("washPrice").value);
  const payment = document.getElementById("paymentStatus").value;
  const method = document.getElementById("paymentMethod").value;

  if (!name || !phone || !vehicle || !service) {
    alert("Completá los campos obligatorios.");
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    alert("Ingresá un precio válido.");
    return;
  }

  const wash = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
    clientName: name,
    clientPhone: phone,
    vehicleType: vehicle,
    licensePlate: plate,
    vehicleDescription: description,
    washType: service,
    price: price,
    paymentStatus: payment,
    paymentMethod: payment === "Pagado" ? method : "",
    status: "Recibido"
  };

  washes.unshift(wash);
  saveData();

  document.getElementById("washForm").reset();

  alert("Lavado registrado correctamente.");
  showSection("dashboard");
}

// ESTADOS

const statusFlow = [
  "Recibido",
  "En lavado",
  "En secado",
  "Listo",
  "Entregado"
];

function advanceStatus(id) {
  const wash = washes.find(item => item.id === id);

  if (!wash) return;

  const currentIndex = statusFlow.indexOf(wash.status);

  if (currentIndex < statusFlow.length - 1) {
    wash.status = statusFlow[currentIndex + 1];
    saveData();
    renderAll();
  }
}

// PAGOS

function markAsPaid(id) {
  const wash = washes.find(item => item.id === id);

  if (!wash) return;

  const method = prompt(
    "Medio de pago: escribí Efectivo o Transferencia",
    "Transferencia"
  );

  if (method === null) return;

  const normalized = method.trim().toLowerCase();

  if (!["efectivo", "transferencia"].includes(normalized)) {
    alert("Ingresá Efectivo o Transferencia.");
    return;
  }

  wash.paymentStatus = "Pagado";
  wash.paymentMethod =
    normalized === "efectivo" ? "Efectivo" : "Transferencia";

  saveData();
  renderAll();
}

// WHATSAPP

function sendWhatsApp(id) {
  const wash = washes.find(item => item.id === id);

  if (!wash) return;

  let phone = wash.clientPhone.replace(/\D/g, "");

  // Números argentinos: se admite 11... o 54911...
  if (phone.startsWith("0")) {
    phone = phone.substring(1);
  }

  if (!phone.startsWith("54")) {
    phone = "549" + phone;
  } else if (phone.startsWith("54") && !phone.startsWith("549")) {
    phone = "549" + phone.substring(2);
  }

  const vehicle = wash.vehicleDescription ||
    wash.vehicleType.toLowerCase();

  const message =
    `Hola ${wash.clientName}, te avisamos de Lavados Premium ` +
    `que tu vehículo (${vehicle}) ya está listo para retirar. ` +
    `¡Muchas gracias!`;

  const url =
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}

// PANEL PRINCIPAL

function renderDashboard() {
  const today = new Date().toLocaleDateString("en-CA");

  const todayWashes = washes.filter(wash => {
    return new Date(wash.createdAt)
      .toLocaleDateString("en-CA") === today;
  });

  const active = todayWashes.filter(wash =>
    wash.status !== "Entregado"
  );

  const revenue = todayWashes
    .filter(wash => wash.paymentStatus === "Pagado")
    .reduce((sum, wash) => sum + wash.price, 0);

  const pending = todayWashes
    .filter(wash => wash.paymentStatus !== "Pagado")
    .reduce((sum, wash) => sum + wash.price, 0);

  document.getElementById("totalWashes").textContent =
    todayWashes.length;

  document.getElementById("activeWashes").textContent =
    active.length;

  document.getElementById("revenue").textContent =
    formatMoney(revenue);

  document.getElementById("pendingPayments").textContent =
    formatMoney(pending);

  const container = document.getElementById("washList");

  if (todayWashes.length === 0) {
    container.innerHTML = `
      <div class="card">
        <p>No hay lavados registrados hoy.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = todayWashes.map(wash => {
    const statusClass = wash.status === "Listo"
      ? "ready"
      : "progress";

    return `
      <div class="wash-card">

        <h3>
          ${escapeHTML(wash.vehicleType)}
          ${wash.licensePlate
            ? "· " + escapeHTML(wash.licensePlate)
            : ""}
        </h3>

        <p>
          <strong>Cliente:</strong>
          ${escapeHTML(wash.clientName)}
        </p>

        <p>
          <strong>Vehículo:</strong>
          ${escapeHTML(wash.vehicleDescription || wash.vehicleType)}
        </p>

        <p>
          <strong>Servicio:</strong>
          ${escapeHTML(wash.washType)}
        </p>

        <p>
          <strong>Precio:</strong>
          ${formatMoney(wash.price)}
        </p>

        <p>
          <strong>Pago:</strong>
          ${escapeHTML(wash.paymentStatus)}
          ${wash.paymentMethod
            ? " · " + escapeHTML(wash.paymentMethod)
            : ""}
        </p>

        <p>
          <span class="status ${statusClass}">
            ${escapeHTML(wash.status)}
          </span>
        </p>

        <div class="wash-actions">

          ${wash.status !== "Entregado" ? `
            <button
              class="secondary"
              onclick="advanceStatus('${wash.id}')">
              Siguiente estado
            </button>
          ` : ""}

          ${wash.paymentStatus !== "Pagado" ? `
            <button
              class="secondary"
              onclick="markAsPaid('${wash.id}')">
              Registrar pago
            </button>
          ` : ""}

          ${wash.status === "Listo" ? `
            <button
              class="whatsapp"
              onclick="sendWhatsApp('${wash.id}')">
              Avisar por WhatsApp
            </button>
          ` : ""}

        </div>

      </div>
    `;
  }).join("");
}

// CLIENTES

function renderClients() {
  const search = document.getElementById("clientSearch")
    .value.trim().toLowerCase();

  const clients = new Map();

  washes.forEach(wash => {
    const key = wash.clientPhone.replace(/\D/g, "");

    if (!clients.has(key)) {
      clients.set(key, {
        name: wash.clientName,
        phone: wash.clientPhone,
        visits: 0,
        lastVisit: wash.createdAt
      });
    }

    clients.get(key).visits++;
  });

  const filtered = [...clients.values()].filter(client => {
    return client.name.toLowerCase().includes(search) ||
      client.phone.includes(search);
  });

  const container = document.getElementById("clientList");

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card">
        <p>No se encontraron clientes.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(client => `
    <div class="client-card">
      <h3>${escapeHTML(client.name)}</h3>
      <p>Teléfono: ${escapeHTML(client.phone)}</p>
      <p>Visitas registradas: ${client.visits}</p>
    </div>
  `).join("");
}

// ACTUALIZACIÓN GENERAL

function renderAll() {
  renderDashboard();
  renderClients();
  renderPriceSettings();
}

// INICIALIZACIÓN

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("washForm")
    .addEventListener("submit", registerWash);

  document.getElementById("vehicleType")
    .addEventListener("change", updateSuggestedPrice);

  document.getElementById("washType")
    .addEventListener("change", updateSuggestedPrice);

  document.getElementById("clientSearch")
    .addEventListener("input", renderClients);

  showSection("dashboard");

  // Registro del service worker para modo offline.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .catch(error => console.log("Offline no disponible:", error));
  }

});
