import { getSyncMode, getState, initStore, updateEquipment } from "./shared-store.js";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80";

const refs = {
  notFound: document.querySelector("#not-found"),
  detailContent: document.querySelector("#detail-content"),
  name: document.querySelector("#detail-name"),
  meta: document.querySelector("#detail-meta"),
  statusBadge: document.querySelector("#detail-status"),
  image: document.querySelector("#detail-image"),
  action: document.querySelector("#detail-action"),
  location: document.querySelector("#detail-location"),
  selection: document.querySelector("#detail-selection"),
  save: document.querySelector("#save-detail"),
  url: document.querySelector("#product-url")
};

const id = new URLSearchParams(window.location.search).get("id");

refs.url.textContent = window.location.href;
refs.save.addEventListener("click", onSave);
refs.action.addEventListener("change", onActionChange);

await initStore(onStateChange);

function onStateChange() {
  const state = getState();
  const equipment = state.equipments.find((item) => item.id === id);

  if (!equipment) {
    refs.detailContent.classList.add("hidden");
    refs.notFound.classList.remove("hidden");
    return;
  }

  refs.notFound.classList.add("hidden");
  refs.detailContent.classList.remove("hidden");
  renderLocationSelect(state.locations, equipment.location);
  renderEquipment(equipment);
}

function renderEquipment(equipment) {
  refs.name.textContent = equipment.name;
  refs.meta.textContent = `${equipment.category} • Locatie: ${equipment.location} • Sync: ${getSyncMode()}`;
  refs.statusBadge.textContent = equipment.status;
  refs.statusBadge.className = `badge ${equipment.status}`;

  refs.image.src = equipment.image || FALLBACK_IMAGE;
  refs.image.onerror = () => {
    refs.image.src = FALLBACK_IMAGE;
  };
}

function renderLocationSelect(locations, selected) {
  refs.location.innerHTML = locations
    .map((location) => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`)
    .join("");

  refs.location.value = selected;
}

function onActionChange() {
  const messages = {
    none: "Je past alleen de locatie aan.",
    reserve: "Je reserveert dit product.",
    lend: "Je leent dit product nu uit.",
    return: "Je brengt dit product terug (status wordt beschikbaar)."
  };

  refs.selection.textContent = messages[refs.action.value] || messages.none;
}

async function onSave() {
  if (!id) {
    return;
  }

  const updates = {
    location: refs.location.value
  };

  if (refs.action.value === "reserve") {
    updates.status = "gereserveerd";
  }
  if (refs.action.value === "lend") {
    updates.status = "uitgeleend";
  }
  if (refs.action.value === "return") {
    updates.status = "beschikbaar";
  }

  await updateEquipment(id, updates);
  refs.action.value = "none";
  refs.selection.textContent = "Wijzigingen opgeslagen.";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
