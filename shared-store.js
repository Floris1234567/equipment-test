import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  doc,
  getFirestore,
  onSnapshot,
  runTransaction,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { FIREBASE_CONFIG, isFirebaseConfigured } from "./firebase-config.js";

const STORAGE_KEY = "equipment-management-v1";
const DOC_COLLECTION = "equipmentManagement";
const DOC_ID = "sharedState";

const defaultData = {
  locations: ["Magazijn", "Studio A", "Klas 2.3"],
  equipments: [
    {
      id: crypto.randomUUID(),
      name: "Canon R6",
      category: "Camera",
      image:
        "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1200&q=80",
      location: "Studio A",
      status: "beschikbaar",
      borrowerName: "",
      reservations: [],
      updatedAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: "Dell XPS 15",
      category: "Laptop",
      image:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
      location: "Magazijn",
      status: "gereserveerd",
      borrowerName: "",
      reservations: [],
      updatedAt: new Date().toISOString()
    }
  ]
};

let state = loadLocalState();
let db = null;
let stateRef = null;
let cloudMode = false;

export function getSyncMode() {
  return cloudMode ? "cloud" : "local";
}

export function getState() {
  return structuredClone(state);
}

export async function initStore(onChange) {
  if (!isFirebaseConfigured()) {
    cloudMode = false;
    state = loadLocalState();
    persistLocalState();
    onChange(getState());
    return () => {};
  }

  try {
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    stateRef = doc(db, DOC_COLLECTION, DOC_ID);

    cloudMode = true;

    const stop = onSnapshot(stateRef, async (snapshot) => {
      if (!snapshot.exists()) {
        await setDoc(stateRef, structuredClone(defaultData));
        return;
      }

      state = sanitizeState(snapshot.data());
      onChange(getState());
    });

    return stop;
  } catch (error) {
    console.error("Cloud sync kon niet starten, fallback naar lokaal.", error);
    cloudMode = false;
    state = loadLocalState();
    persistLocalState();
    onChange(getState());
    return () => {};
  }
}

export async function addLocation(locationName) {
  await mutateState((draft) => {
    const exists = draft.locations.some(
      (location) => location.toLowerCase() === locationName.toLowerCase()
    );
    if (!exists) {
      draft.locations.push(locationName);
    }
  });
}

export async function addEquipment(item) {
  await mutateState((draft) => {
    draft.equipments.unshift(item);
  });
}

export async function updateEquipment(id, updates) {
  await mutateState((draft) => {
    const equipment = draft.equipments.find((item) => item.id === id);
    if (!equipment) {
      return;
    }

    if (typeof updates.location === "string") {
      equipment.location = updates.location;
    }
    if (typeof updates.status === "string") {
      equipment.status = updates.status;
    }
    if (typeof updates.borrowerName === "string") {
      equipment.borrowerName = updates.borrowerName;
    }
    if (Array.isArray(updates.reservations)) {
      equipment.reservations = updates.reservations;
    }

    equipment.updatedAt = new Date().toISOString();
  });
}

async function mutateState(mutator) {
  if (!cloudMode || !db || !stateRef) {
    const next = structuredClone(state);
    mutator(next);
    state = sanitizeState(next);
    persistLocalState();
    return;
  }

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(stateRef);
    const draft = snapshot.exists()
      ? sanitizeState(snapshot.data())
      : structuredClone(defaultData);

    mutator(draft);
    transaction.set(stateRef, sanitizeState(draft));
  });
}

function sanitizeState(raw) {
  const locations = Array.isArray(raw?.locations) && raw.locations.length
    ? raw.locations.filter((value) => typeof value === "string")
    : structuredClone(defaultData.locations);

  const equipments = Array.isArray(raw?.equipments)
    ? raw.equipments
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
          name: typeof item.name === "string" ? item.name : "Onbekend",
          category: typeof item.category === "string" ? item.category : "Onbekend",
          image: typeof item.image === "string" ? item.image : "",
          location:
            typeof item.location === "string" && item.location
              ? item.location
              : locations[0],
          status: normalizeStatus(item.status),
          borrowerName: typeof item.borrowerName === "string" ? item.borrowerName : "",
          reservations: normalizeReservations(item.reservations),
          updatedAt:
            typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString()
        }))
    : [];

  return { locations, equipments };
}

function normalizeStatus(value) {
  if (value === "beschikbaar" || value === "gereserveerd" || value === "uitgeleend") {
    return value;
  }
  return "beschikbaar";
}

function normalizeReservations(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
      name: typeof item.name === "string" ? item.name : "",
      startDate: typeof item.startDate === "string" ? item.startDate : "",
      endDate: typeof item.endDate === "string" ? item.endDate : ""
    }))
    .filter((item) => item.startDate && item.endDate);
}

function loadLocalState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(defaultData);
  }

  try {
    return sanitizeState(JSON.parse(saved));
  } catch {
    return structuredClone(defaultData);
  }
}

function persistLocalState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
