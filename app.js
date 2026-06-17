import {
  addEquipment,
  addLocation,
  getSyncMode,
  initStore
} from "./shared-store.js";

const refs = {
  syncStatus: document.querySelector("#sync-status"),
  locationForm: document.querySelector("#location-form"),
  locationInput: document.querySelector("#location-input"),
  locationsList: document.querySelector("#locations-list"),
  equipmentForm: document.querySelector("#equipment-form"),
  name: document.querySelector("#name"),
  category: document.querySelector("#category"),
  image: document.querySelector("#image"),
  startLocation: document.querySelector("#start-location"),
  grid: document.querySelector("#equipment-grid"),
  template: document.querySelector("#equipment-card-template")
};

let state = { locations: [], equipments: [] };

wireEvents();
await initStore(onStateChange);

function onStateChange(nextState) {
  state = nextState;
  renderAll();
}

function wireEvents() {
  refs.locationForm.addEventListener("submit", onAddLocation);
  refs.equipmentForm.addEventListener("submit", onAddEquipment);
  refs.grid.addEventListener("click", onCardClick);
}

async function onAddLocation(event) {
  event.preventDefault();
  const value = refs.locationInput.value.trim();
  if (!value) {
    return;
  }

  await addLocation(value);
  refs.locationInput.value = "";
}

async function onAddEquipment(event) {
  event.preventDefault();
  if (!state.locations.length) {
    return;
  }

  const equipment = {
    id: crypto.randomUUID(),
    name: refs.name.value.trim(),
    category: refs.category.value.trim(),
    image: refs.image.value.trim(),
    location: refs.startLocation.value,
    status: "beschikbaar",
    updatedAt: new Date().toISOString()
  };

  if (!equipment.name || !equipment.category || !equipment.image) {
    return;
  }

  await addEquipment(equipment);
  refs.equipmentForm.reset();
  refs.startLocation.value = state.locations[0] || "";
}

function onCardClick(event) {
  const card = event.target.closest("[data-id]");
  if (!card) {
    return;
  }

  const equipment = state.equipments.find((item) => item.id === card.dataset.id);
  if (!equipment) {
    return;
  }

  window.location.href = `product.html?id=${encodeURIComponent(equipment.id)}`;
}

function renderAll() {
  renderSyncStatus();
  renderLocations();
  renderLocationSelects();
  renderGrid();
}

function renderSyncStatus() {
  if (getSyncMode() === "cloud") {
    refs.syncStatus.textContent =
      "Cloud sync actief: wijzigingen zijn direct zichtbaar op andere devices.";
    return;
  }

  refs.syncStatus.textContent =
    "Lokale modus actief: vul firebase-config.js in om tussen devices te synchroniseren.";
}

function renderLocations() {
  refs.locationsList.innerHTML = "";
  if (!state.locations.length) {
    refs.locationsList.textContent = "Nog geen locaties toegevoegd.";
    return;
  }

  state.locations.forEach((location) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = location;
    refs.locationsList.appendChild(chip);
  });
}

function renderLocationSelects() {
  refs.startLocation.innerHTML = state.locations
    .map((location) => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`)
    .join("");
}

function renderGrid() {
  refs.grid.innerHTML = "";

  if (!state.equipments.length) {
    refs.grid.innerHTML = "<p>Nog geen equipment toegevoegd.</p>";
    return;
  }

  state.equipments.forEach((equipment) => {
    const card = refs.template.content.firstElementChild.cloneNode(true);
    card.dataset.id = equipment.id;

    const img = card.querySelector("img");
    img.src = equipment.image;
    img.onerror = () => {
      img.src =
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80";
    };

    card.querySelector(".card-type").textContent = equipment.category;
    card.querySelector("h3").textContent = equipment.name;

    const badge = card.querySelector(".badge");
    badge.textContent = equipment.status;
    badge.classList.add(equipment.status);

    card.querySelector(".location").textContent = `Locatie: ${equipment.location}`;
    const borrowerText = equipment.borrowerName
      ? `Lener: ${equipment.borrowerName}`
      : "Nog niemand leent dit product";
    const reservationText = equipment.reservations.length
      ? `Volgende reservering: ${equipment.reservations[0].startDate} t/m ${equipment.reservations[0].endDate}`
      : "Geen reserveringen ingepland";

    card.querySelector(".borrow-state").textContent = `${borrowerText} • ${reservationText}`;

    refs.grid.appendChild(card);
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
