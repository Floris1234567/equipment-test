export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCh4bH2wOnbBytrxpsk49gIbQkxq4KBrHE",
  authDomain: "equipment-managment-a4377.firebaseapp.com",
  projectId: "equipment-managment-a4377",
  storageBucket: "equipment-managment-a4377.firebasestorage.app",
  messagingSenderId: "1076497692505",
  appId: "1:1076497692505:web:7b22647bc7a7cc6ed13e48",
  measurementId: "G-ZN3VV0JM4B"
};

export function isFirebaseConfigured() {
  return Object.values(FIREBASE_CONFIG).every(
    (value) => typeof value === "string" && value.trim() && !value.includes("VUL_HIER_")
  );
}
