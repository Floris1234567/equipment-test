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
  borrower: document.querySelector("#detail-borrower"),
  action: document.querySelector("#detail-action"),
  location: document.querySelector("#detail-location"),
  selection: document.querySelector("#detail-selection"),
  save: document.querySelector("#save-detail"),
  url: document.querySelector("#product-url"),
  reservationList: document.querySelector("#reservation-list"),
  calendarGrid: document.querySelector("#calendar-grid"),
  calendarLabel: document.querySelector("#calendar-label"),
  calendarPrev: document.querySelector("#calendar-prev"),
  calendarNext: document.querySelector("#calendar-next")
};

const id = new URLSearchParams(window.location.search).get("id");
const monthNames = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december"
];

let visibleMonth = startOfMonth(new Date());
let calendarSelection = { startDate: "", endDate: "" };

refs.url.textContent = window.location.href;
refs.save.addEventListener("click", onSave);
refs.action.addEventListener("change", onActionChange);
refs.calendarPrev.addEventListener("click", () => {
  visibleMonth = addMonths(visibleMonth, -1);
  renderCalendar();
});
refs.calendarNext.addEventListener("click", () => {
  visibleMonth = addMonths(visibleMonth, 1);
  renderCalendar();
});
refs.calendarGrid.addEventListener("click", onCalendarClick);

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
  renderCalendar(equipment.reservations);
}

function renderEquipment(equipment) {
  refs.name.textContent = equipment.name;
  const borrowerText = equipment.borrowerName ? ` • Lener: ${equipment.borrowerName}` : "";
  refs.meta.textContent = `${equipment.category} • Locatie: ${equipment.location}${borrowerText} • Sync: ${getSyncMode()}`;
  refs.statusBadge.textContent = equipment.status;
  refs.statusBadge.className = `badge ${equipment.status}`;

  refs.image.src = equipment.image || FALLBACK_IMAGE;
  refs.image.onerror = () => {
    refs.image.src = FALLBACK_IMAGE;
  };

  refs.borrower.value = equipment.borrowerName || "";
  renderReservations(equipment.reservations);
}

function renderCalendar(reservations = []) {
  refs.calendarLabel.textContent = `${monthNames[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;

  const reservationRanges = reservations.map((reservation) => ({
    ...reservation,
    start: parseDate(reservation.startDate),
    end: parseDate(reservation.endDate)
  }));

  const start = startOfWeek(new Date(visibleMonth));
  const days = [];
  const cursor = new Date(start);

  for (let index = 0; index < 42; index += 1) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  refs.calendarGrid.innerHTML = ["ma", "di", "wo", "do", "vr", "za", "zo"]
    .map((day) => `<div class="calendar-weekday">${day}</div>`)
    .join("")
    + days
      .map((date) => {
        const iso = formatLocalDate(date);
        const inMonth = date.getMonth() === visibleMonth.getMonth();
        const reservation = reservationRanges.find(
          (item) => date >= item.start && date <= item.end
        );
        const isSelectedStart = calendarSelection.startDate === iso;
        const isSelectedEnd = calendarSelection.endDate === iso;
        const isSelectedRange =
          calendarSelection.startDate &&
          calendarSelection.endDate &&
          iso >= calendarSelection.startDate &&
          iso <= calendarSelection.endDate;

        return `
          <button type="button" class="calendar-day ${inMonth ? "" : "out-month"} ${reservation ? "reserved" : "free"} ${isSelectedRange ? "selected-range" : ""} ${isSelectedStart ? "selected-start" : ""} ${isSelectedEnd ? "selected-end" : ""}" data-date="${iso}" title="${reservation ? escapeHtml(`${reservation.name || "Onbekend"}: ${reservation.startDate} t/m ${reservation.endDate}`) : "Vrij"}">
            <span class="day-number">${date.getDate()}</span>
            <span class="day-note">${reservation ? escapeHtml(reservation.name || "Gereserveerd") : "Vrij"}</span>
          </button>
        `;
      })
      .join("");

  updateSelectionMessage();
}

function onCalendarClick(event) {
  const button = event.target.closest("[data-date]");
  if (!button) {
    return;
  }

  const clickedDate = button.dataset.date;

  if (!calendarSelection.startDate || (calendarSelection.startDate && calendarSelection.endDate)) {
    calendarSelection = { startDate: clickedDate, endDate: "" };
  } else if (clickedDate < calendarSelection.startDate) {
    calendarSelection = { startDate: clickedDate, endDate: "" };
  } else {
    calendarSelection.endDate = clickedDate;
  }

  renderCalendar(getState().equipments.find((item) => item.id === id)?.reservations || []);
}

function renderLocationSelect(locations, selected) {
  refs.location.innerHTML = locations
    .map((location) => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`)
    .join("");

  refs.location.value = selected;
}

function onActionChange() {
  const messages = {
    none: "Je past alleen de locatie aan en kunt ook een naam invullen.",
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

  const borrowerName = refs.borrower.value.trim();
  const currentEquipment = getState().equipments.find((item) => item.id === id);
  const updates = {
    location: refs.location.value,
    borrowerName:
      refs.action.value === "lend"
        ? borrowerName
        : refs.action.value === "return"
          ? ""
          : currentEquipment?.borrowerName || ""
  };

  if (refs.action.value === "reserve") {
    updates.status = "gereserveerd";
    if (!borrowerName) {
      refs.selection.textContent = "Vul je naam in voordat je dit product reserveert.";
      return;
    }

    const startDate = calendarSelection.startDate;
    const endDate = calendarSelection.endDate;
    if (!startDate || !endDate) {
      refs.selection.textContent = "Selecteer een start- en einddatum in de agenda.";
      return;
    }

    if (endDate < startDate) {
      refs.selection.textContent = "De einddatum moet op of na de startdatum liggen.";
      return;
    }

    const state = getState();
    const equipment = state.equipments.find((item) => item.id === id);
    const nextReservations = equipment ? [...equipment.reservations] : [];
    const conflict = nextReservations.some((reservation) =>
      datesOverlap(startDate, endDate, reservation.startDate, reservation.endDate)
    );

    if (conflict) {
      refs.selection.textContent = "Deze datum overlapt met een bestaande reservering.";
      return;
    }

    nextReservations.push({
      id: crypto.randomUUID(),
      name: borrowerName,
      startDate,
      endDate
    });

    updates.reservations = sortReservations(nextReservations);
  }
  if (refs.action.value === "lend") {
    updates.status = "uitgeleend";
    if (!borrowerName) {
      refs.selection.textContent = "Vul je naam in voordat je dit product leent.";
      return;
    }
    updates.borrowerName = borrowerName;
  }
  if (refs.action.value === "return") {
    updates.status = "beschikbaar";
    updates.borrowerName = "";
  }

  await updateEquipment(id, updates);
  refs.action.value = "none";
  refs.selection.textContent = "Wijzigingen opgeslagen.";
  calendarSelection = { startDate: "", endDate: "" };
}

function renderReservations(reservations) {
  if (!reservations.length) {
    refs.reservationList.innerHTML = '<p class="reservation-empty">Geen reserveringen gepland.</p>';
    return;
  }

  refs.reservationList.innerHTML = reservations
    .map(
      (reservation) => `
        <article class="reservation-item">
          <div>
            <strong>${escapeHtml(reservation.name || "Onbekend")}</strong>
            <span>${escapeHtml(reservation.startDate)} t/m ${escapeHtml(reservation.endDate)}</span>
          </div>
          <button type="button" class="reservation-delete" data-reservation-id="${escapeHtml(reservation.id)}">Verwijder</button>
        </article>
      `
    )
    .join("");

  refs.reservationList.querySelectorAll("[data-reservation-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const state = getState();
      const equipment = state.equipments.find((item) => item.id === id);
      if (!equipment) {
        return;
      }

      const nextReservations = equipment.reservations.filter(
        (reservation) => reservation.id !== button.dataset.reservationId
      );

      await updateEquipment(id, {
        reservations: nextReservations,
        status: nextReservations.length ? equipment.status : equipment.status === "gereserveerd" ? "beschikbaar" : equipment.status
      });
    });
  });
}

function updateSelectionMessage() {
  if (!calendarSelection.startDate) {
    return;
  }

  if (!calendarSelection.endDate) {
    refs.selection.textContent = `Geselecteerd: ${calendarSelection.startDate}. Kies nu een einddatum.`;
    return;
  }

  refs.selection.textContent = `Geselecteerd: ${calendarSelection.startDate} t/m ${calendarSelection.endDate}.`;
}

function sortReservations(reservations) {
  return [...reservations].sort((left, right) => left.startDate.localeCompare(right.startDate));
}

function datesOverlap(startA, endA, startB, endB) {
  return startA <= endB && endA >= startB;
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + offset);
  return copy;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
