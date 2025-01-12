import Dexie from "dexie";

// Create IndexedDB instance
const db = new Dexie("TodoAppDB");

// Define the schema for the database
db.version(1).stores({
  tasks: "++id, title, completed, updatedAt, synced",
});

export default db;
