/*
 * noteStorage.js initializes the main notes database and provides general
 * CRUD functions
 *
 * Functions inside this file:
 *   - initilizeDB()
 *   - getNotesFromStorage()
 *   - getNoteFromStorage()
 *   - saveNoteToStorage()
 *   - deleteNoteFromStorage()
 */
import { pageData } from './Routing.js';

export const DBNAME = 'NotesDB';
export const OBJECT_STORE_NAME = 'NotesOS';
let db;

/**
 * Sets up and returns a reference to our IndexedDB notes storage.
 * @returns A reference to our IndexedDB notes storage.
 */
export function initializeDB(indexedDB) {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    const openRequest = indexedDB.open(DBNAME, 1);
    openRequest.onupgradeneeded = (event) => {
      // Set up the database table if it hasn't been initialized yet.
      db = event.target.result;
      const objectStore = db.createObjectStore(OBJECT_STORE_NAME, {
        keyPath: 'uuid',
        autoIncrement: true,
      });
      objectStore.createIndex('note_tags', 'tags', { unique: false, multiEntry: true });
    };
    openRequest.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    openRequest.onerror = (event) => {
      reject(new Error(`Error opening database! ${event.target.errorCode}`));
    };
  });
}

/**
 * Gets all notes stored in 'NotesDB' from IndexedDB.
 * @param {*} database The initialized indexedDB object
 * @returns A list of note objects.
 */
export function getNotesFromStorage(database) {
  return new Promise((resolve, reject) => {
    const objectStore = database.transaction(OBJECT_STORE_NAME).objectStore(OBJECT_STORE_NAME);
    const notes = [];
    const getNotesRequest = objectStore.openCursor();
    const temp = pageData.tags; // For some reason pageData.tags gets deleted on next line
    getNotesRequest.onsuccess = (event) => {
      // Iterate through all the notes received and add them to be returned.
      const cursor = event.target.result;
      if (cursor) {
        notes.push(cursor.value);
        cursor.continue();
      } else {
        pageData.tags = temp;
        resolve(notes);
      }
    };
    getNotesRequest.onerror = (event) => {
      reject(new Error(`Error fetching notes from storage: ${event.target.errorCode}`));
    };
  });
}

/**
 * Gets a single note from storage, if it exists.
 * @param {*} database The initialized indexedDB object.
 * @param {*} id UUID of the note.
 * @returns The note object stored with the given UUID.
 */
export function getNoteFromStorage(database, id) {
  return new Promise((resolve, reject) => {
    const objectStore = database.transaction(OBJECT_STORE_NAME).objectStore(OBJECT_STORE_NAME);
    const getNoteRequest = objectStore.get(id);
    getNoteRequest.onsuccess = () => {
      resolve(getNoteRequest.result);
    };
    getNoteRequest.onerror = () => {
      reject(new Error(`Error fetching note with id ${id} from storage.`));
    };
  });
}

/**
 * Takes the given note and saves it to the database. To make a new note,
 * pass in a Note object where the UUID is undefined and a new note will be made.
 * @param {*} database The initialized indexedDB object.
 * @param {*} note The note object to save.
 * @returns Promise<int> The UUID of the newly saved note.
 */
export function saveNoteToStorage(database, note) {
  if (!note.uuid) {
    return new Promise((resolve, reject) => {
      const objectStore = database.transaction(OBJECT_STORE_NAME, 'readwrite').objectStore(OBJECT_STORE_NAME);
      const saveNoteRequest = objectStore.add(note);
      saveNoteRequest.onsuccess = () => {
        resolve(saveNoteRequest.result);
      };
      saveNoteRequest.onerror = () => {
        reject(new Error('Error saving new note to storage'));
      };
    });
  }
  return new Promise((resolve, reject) => {
    const objectStore = database.transaction(OBJECT_STORE_NAME, 'readwrite').objectStore(OBJECT_STORE_NAME);
    const saveNoteRequest = objectStore.put(note);
    saveNoteRequest.onsuccess = () => {
      resolve(saveNoteRequest.result);
    };
    saveNoteRequest.onerror = () => {
      reject(new Error(`Error saving note with id ${note.uuid} to storage`));
    };
  });
}

/**
 * Takes the given note and deletes it from storage.
 * @param {*} database The initialized indexedDB object.
 * @param {*} note The note object to delete.
 * @returns Promise<void>
 */
export function deleteNoteFromStorage(database, note) {
  return new Promise((resolve, reject) => {
    const objectStore = database.transaction(OBJECT_STORE_NAME, 'readwrite').objectStore(OBJECT_STORE_NAME);

    const getNoteRequest = objectStore.get(note.uuid);
    getNoteRequest.onsuccess = () => {
      const noteObject = getNoteRequest.result;
      const tags = noteObject.tags;
      const tagDB = pageData.tagDB;
      const tagsObjectStore = tagDB.transaction('tags').objectStore('tags');
      for (let i = 0; i < tags.length; i += 1) {
        const tagGetRequest = tagsObjectStore.get(tags[i]);
        tagGetRequest.onsuccess = () => {
          const tag = tagGetRequest.result;
          tag.num_notes -= 1;
          const tagPutRequest = tagDB.transaction('tags', 'readwrite').objectStore('tags');
          tagPutRequest.put(tag);
        };
      }
    };
    const deleteNoteRequest = objectStore.delete(note.uuid);
    deleteNoteRequest.onsuccess = () => {
      resolve();
    };
    deleteNoteRequest.onerror = () => {
      reject(new Error(`Error deleting note with id ${note.uuid} from storage`));
    };
  });
}
