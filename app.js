// Client ID from the Google API Console
const CLIENT_ID = '822294311071-t9gbejt6htl7imrq6untbg8s3p7qgfhs.apps.googleusercontent.com';
// API key from the Google API Console
const API_KEY = 'AIzaSyBjxB1qId-aY1KgPD09vqJerXtopnrbb_8';
// Discovery document URL for Google Drive API v3
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
// Authorization scopes required for the Google Drive API
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let selectedFiles = [];

// DOM Elements
const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const uploadContainer = document.getElementById('upload-container');
const uploadButton = document.getElementById('upload-button');
const fileInput = document.getElementById('file-input');
const dropArea = document.getElementById('drop-area');
const imageGallery = document.getElementById('image-gallery');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const noImagesMessage = document.getElementById('no-images-message');

// GitHub Pages configuration
const GITHUB_USERNAME = 'YOUR_GITHUB_USERNAME';
const REPO_NAME = 'YOUR_REPO_NAME';

// Document ready
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Initialize the Google API client
    gapiLoaded();
    gisLoaded();
    
    // Event listeners
    authorizeButton.addEventListener('click', handleAuthClick);
    signoutButton.addEventListener('click', handleSignoutClick);
    uploadButton.addEventListener('click', uploadFiles);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    dropArea.addEventListener('drop', handleDrop, false);
}

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        authorizeButton.disabled = false;
    }
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        
        signoutButton.style.display = 'inline-block';
        authorizeButton.style.display = 'none';
        uploadContainer.style.display = 'block';
        
        // Load images after authentication
        loadImages();
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        authorizeButton.style.display = 'inline-block';
        signoutButton.style.display = 'none';
        uploadContainer.style.display = 'none';
        imageGallery.innerHTML = '';
        imageGallery.appendChild(noImagesMessage);
        selectedFiles = [];
    }
}

// Function to handle file selection from input
function handleFileSelect(event) {
    const files = event.target.files;
    handleFiles(files);
}

// Function to handle dropped files
function handleDrop(event) {
    const dt = event.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Process selected files
function handleFiles(files) {
    selectedFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    // Show selected file names
    if (selectedFiles.length > 0) {
        let fileNames = selectedFiles.map(file => file.name).join('<br>');
        dropArea.innerHTML = `<p>Selected files:</p><div>${fileNames}</div>`;
    } else {
        dropArea.innerHTML = `<p>Drag & drop images here or</p>
        <input type="file" id="file-input" accept="image/*" multiple>
        <label for="file-input" class="button">Select Files</label>`;
        
        // Reattach event listener to the new file input
        document.getElementById('file-input').addEventListener('change', handleFileSelect);
    }
}

// Prevent default drag behaviors
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area when item is dragged over it
function highlight() {
    dropArea.classList.add('highlight');
}

// Remove highlight when item is no longer over drop area
function unhighlight() {
    dropArea.classList.remove('highlight');
}

// Upload files to Google Drive
async function uploadFiles() {
    if (selectedFiles.length === 0) {
        alert('Please select at least one image to upload.');
        return;
    }
    
    // Create a folder for our app if it doesn't exist
    let folderId = await getOrCreateAppFolder();
    
    progressContainer.style.display = 'block';
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = Math.round((i / selectedFiles.length) * 100);
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${progress}%`;
        
        try {
            await uploadFile(file, folderId);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert(`Error uploading ${file.name}: ${error.message}`);
        }
    }
    
    // Complete progress bar
    progressBar.style.width = '100%';
    progressBar.textContent = '100%';
    
    // Reset the upload area
    setTimeout(() => {
        progressContainer.style.display = 'none';
        progressBar.style.width = '0%';
        progressBar.textContent = '';
        
        dropArea.innerHTML = `<p>Drag & drop images here or</p>
        <input type="file" id="file-input" accept="image/*" multiple>
        <label for="file-input" class="button">Select Files</label>`;
        
        // Reattach event listener to the new file input
        document.getElementById('file-input').addEventListener('change', handleFileSelect);
        
        selectedFiles = [];
        
        // Refresh the image gallery
        loadImages();
    }, 1000);
}

// Create or get the app folder in Google Drive
async function getOrCreateAppFolder() {
    const folderName = 'ImageUploaderApp';
    
    try {
        // Search for existing folder
        const response = await gapi.client.drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)'
        });
        
        const folders = response.result.files;
        
        if (folders && folders.length > 0) {
            return folders[0].id;
        } else {
            // Create a new folder
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            };
            
            const folderResponse = await gapi.client.drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            });
            
            return folderResponse.result.id;
        }
    } catch (error) {
        console.error('Error getting or creating folder:', error);
        throw error;
    }
}

// Upload a single file to Google Drive
async function uploadFile(file, folderId) {
    // Get the file content
    const content = await readFileAsArrayBuffer(file);
    
    // Set up the file metadata
    const fileMetadata = {
        name: file.name,
        parents: [folderId]
    };
    
    // Set up the media
    const media = {
        mimeType: file.type,
        body: content
    };
    
    try {
        // Upload the file to Google Drive
        const response = await gapi.client.drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name, webContentLink'
        });
        
        // Make the file public so it can be accessed with a direct link
        await makeFilePublic(response.result.id);
        
        return response.result;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// Make a file public so it can be accessed with a direct link
async function makeFilePublic(fileId) {
    try {
        await gapi.client.drive.permissions.create({
            fileId: fileId,
            resource: {
                role: 'reader',
                type: 'anyone'
            }
        });
    } catch (error) {
        console.error('Error making file public:', error);
        throw error;
    }
}

// Read a file as ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e.target.error);
        reader.readAsArrayBuffer(file);
    });
}

// Load images from Google Drive
async function loadImages() {
    try {
        const folderName = 'ImageUploaderApp';
        
        // Search for the app folder
        const folderResponse = await gapi.client.drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)'
        });
        
        const folders = folderResponse.result.files;
        
        if (folders && folders.length > 0) {
            const folderId = folders[0].id;
            
            // Get all image files from the folder
            const response = await gapi.client.drive.files.list({
                q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name, webContentLink, thumbnailLink)'
            });
            
            const files = response.result.files;
            
            // Clear the gallery
            imageGallery.innerHTML = '';
            
            if (files && files.length > 0) {
                // Display each image
                files.forEach(file => {
                    const directLink = `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/images/${file.name}`;
                    
                    const imageItem = document.createElement('div');
                    imageItem.className = 'image-item';
                    
                    // Create direct link to image on Google Drive
                    const directGDriveLink = `https://drive.google.com/uc?export=view&id=${file.id}`;
                    
                    imageItem.innerHTML = `
                        <img src="${directGDriveLink}" alt="${file.name}">
                        <div class="image-info">
                            <h3 title="${file.name}">${file.name}</h3>
                            <div class="image-link-container">
                                <input class="image-link" type="text" value="${directLink}" readonly>
                                <button class="copy-link" data-link="${directLink}">Copy</button>
                            </div>
                            <a href="${directGDriveLink}" target="_blank" class="button">View Image</a>
                        </div>
                    `;
                    
                    // Add event listener to the copy button
                    imageItem.querySelector('.copy-link').addEventListener('click', function() {
                        const link = this.getAttribute('data-link');
                        navigator.clipboard.writeText(link).then(() => {
                            this.textContent = 'Copied!';
                            setTimeout(() => {
                                this.textContent = 'Copy';
                            }, 2000);
                        });
                    });
                    
                    imageGallery.appendChild(imageItem);
                });
            } else {
                imageGallery.innerHTML = '<div class="no-images">No images found. Upload some images!</div>';
            }
        } else {
            imageGallery.innerHTML = '<div class="no-images">No images found. Upload some images!</div>';
        }
    } catch (error) {
        console.error('Error loading images:', error);
        imageGallery.innerHTML = `<div class="no-images">Error loading images: ${error.message}</div>`;
    }
}