import { indexedDB } from 'fake-indexeddb';
import {
  initializeDB,
  getNotesFromStorage,
  getNoteFromStorage,
  saveNoteToStorage,
  deleteNoteFromStorage,
} from '../source/scripts/noteStorage.js';

let db;

describe('Backend: Read/Add notes', () => {
  beforeAll(async () => {
    db = await initializeDB(indexedDB);
  });

  it('getNotesFromStorage: No notes initially in storage', async () => {
    const notes = await getNotesFromStorage(db);
    expect(notes).toEqual([]);
  });

  it('saveNoteToStorage: Successfully save a note', async () => {
    const note = {
      uuid: undefined,
      title: 'My First Note',
      lastModified: '1/1/2001 at 1:00 PM',
      content: 'Hello World!',
      tag: "default"
    };
    const id = await saveNoteToStorage(db, note);
    expect(id).toEqual(1);
  });

  it('getNoteFromStorage: Retrieve saved note', async () => {
    const note = await getNoteFromStorage(db, 1);
    expect(note).toEqual({
      uuid: 1,
      title: 'My First Note',
      lastModified: '1/1/2001 at 1:00 PM',
      content: 'Hello World!',
      tag: "default"
    });
  });

  it('saveNoteToStorage: Multiple notes are saved', async () => {
    const note = {
      uuid: undefined,
      title: 'My First Note',
      lastModified: '1/1/2001 at 1:00 PM',
      content: 'Hello World!',
      tag: "default"
    };
    await Promise.all([0, 1, 2, 3, 4, 5].map(() => saveNoteToStorage(db, note)));
    const notes = await getNotesFromStorage(db);
    expect(notes.length).toBe(7);
  });

  it('saveNoteToStorage: Update previously stored note', async () => {
    const note = {
      uuid: 5,
      title: 'Updated Note',
      lastModified: '2/1/2001 at 2:00 PM',
      content: 'Updated note contents!',
      tag: "default"
    };
    await saveNoteToStorage(db, note);
    const response = await getNoteFromStorage(db, 5);
    expect(response).toEqual(note);
  });

  it('getNoteFromStorage: Returns undefined when no note is found', async () => {
    const response = await getNoteFromStorage(db, 100);
    expect(response).toEqual(undefined);
  });
});

describe('Backend: Delete notes', () => {
  beforeAll(async () => {
    if (!db) {
      db = await initializeDB(indexedDB);
    }
  });


  it('deleteNoteFromStorage: deleting with invalid input returns an error', async () => {
    expect(async () => {
      await deleteNoteFromStorage(db, 5);
    }).rejects.toThrow();
  });


});
