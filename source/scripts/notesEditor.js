import { initializeDB, saveNoteToStorage, getNotesFromStorage, getNoteFromStorage } from "./noteStorage.js";

window.addEventListener('DOMContentLoaded', init);

/**
 * @description call all the functions after the DOM is loaded
 */
async function init() {
    const db = await initializeDB(indexedDB);
    // detect if there's = in the url
    let url = window.location.href;
    let urlArray = url.split('=');
    let id;
    let preview = false;
    //if preview is not set to true in url
    if(urlArray.length == 2){
        id = urlArray[1];
    }
    //if preview is set to true in url
    if (urlArray.length == 3) {
        id = urlArray[1].split('?')[0];
        preview = true;
    }
    //if id doesn't exist meaning it's a new note, only edit mode
    if (!id){
        let noteObject = {
            "title": "Untitled Note",
            "lastModified": `${getDate()}`,
            "content": "", 
        };
        await addNotesToDocument(noteObject, true);
    } 
    //if id exists meaning it's an existing note, pass preview to toggle edit/view button
    else {
        let note = await getNoteFromStorage(db, parseInt(id));
        await addNotesToDocument(note, !preview);
        addEditToggle(preview, parseInt(id));
    }
    //show save button in edit mode
    if (!preview) {
        addNewNoteButtons(parseInt(id), db);
    }
}

/**
 * @description get the current date
 * @returns {string} current date in format of mm/dd/yyyy
 */
function getDate(){
    let date = new Date();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

/**
 * @description append the edit or view button to the page
 * @param {boolean} preview true if user is in view only mode or not
 * @param {Integer} id unique uuid of current note
 */
function addEditToggle(preview, id){
    let editButton = document.createElement('button');
    editButton.setAttribute('class', 'edit-button');
    console.log(editButton);
    // add edit button
    let buttonSection = document.querySelector('#option-button');
    if (preview) {
        editButton.innerHTML = 'Edit';
    } else {
        editButton.innerHTML = 'View';
    }
    buttonSection.appendChild(editButton);
    editButton.addEventListener('click', () => {
        if (preview) {
            window.location.href = `./notes.html?id=${id}`;
        } else {
            window.location.href = `./notes.html?id=${id}?preview=true`;
        }
    })
    

}

/**
 * @description append the save button to the page
 * @param {Integer} id unique uuid of current note
 * @param {*} db The initialized indexedDB object.
 */
function addNewNoteButtons(id, db) {
    // create a save button
    let saveButton = document.createElement('button');
    saveButton.setAttribute('class', 'button-button');
    saveButton.innerHTML = 'Save';
    let buttonSection = document.querySelector('#option-button');
    buttonSection.appendChild(saveButton);

    // add event listener to save button
    saveButton.addEventListener('click', () => {
        let title = document.querySelector('#title-input').value;
        let content = document.querySelector('#notes-content-input').value;
        let lastModified = getDate();
        let noteObject = {
            "title": title,
            "lastModified": lastModified,
            "content": content,
        };
        if (id) {
            noteObject.uuid = id;
        }
        saveNoteToStorage(db, noteObject);
        if (!id) {
            getNotesFromStorage(db).then(res => {
                window.location.href = `./notes.html?id=${res[res.length - 1].uuid}`;
            })
        }
    });
}


/**
 * @description append the notes title, last modified date, and content to page
 * @param {*} note note object with data
 * @param {boolean} editable false if user is in view only mode
 */
async function addNotesToDocument(note, editable) {
    // select html items
    let title = document.querySelector('#notes-title');
    let lastModified = document.querySelector('#notes-last-modified')
    let content = document.querySelector('#notes-content-input');

    // populate html with notes data
    title.innerHTML = `<label for="title-input">Title:</label>
        <input type="text" id="title-input" name="title-input">
        `;
    let titleInput = document.querySelector('#title-input');
    titleInput.value = note.title;
    lastModified.innerHTML += `${note.lastModified}`;
    content.value += `${note.content}`;

    // disable editing priveleges if in view only mode
    if (!editable) {
        //make input field uneditable
        titleInput.setAttribute('disabled', 'true');
        //make content textarea uneditable
        content.setAttribute('readonly', 'readonly');
    } 
}