Google Drive Image Uploader
A web application that allows you to upload images to Google Drive and provides direct links to those images. The app also displays all images in a gallery with their links.
Features

Sign in with Google authentication
Upload images to Google Drive
Generate direct links to images
Display all uploaded images in a gallery
Copy image links to clipboard
Drag and drop file upload
Mobile responsive design

Setup Instructions
1. Create a GitHub Repository

Create a new repository on GitHub
Clone the repository to your local machine

2. Set Up Google Cloud Project

Go to the Google Cloud Console
Create a new project
Enable the Google Drive API
Create OAuth 2.0 credentials

Set the application type to "Web application"
Add your GitHub Pages URL as an authorized JavaScript origin (https://your-username.github.io)
Add your GitHub Pages URL as an authorized redirect URI (https://your-username.github.io/your-repo-name)


Create an API key

3. Configure the Application

Open app.js and replace the placeholder values:

Replace YOUR_CLIENT_ID_HERE with your OAuth client ID
Replace YOUR_API_KEY_HERE with your API key
Replace YOUR_GITHUB_USERNAME with your GitHub username
Replace YOUR_REPO_NAME with your repository name



4. Deploy to GitHub Pages

Push your code to GitHub
Go to your repository settings
Scroll down to the GitHub Pages section
Select the branch you want to deploy (usually main or master)
Click Save

5. Create Images Directory
Create an images directory in your repository. This directory will be used to store the direct links to your images.
How It Works

The user signs in with their Google account
The app creates a folder named "ImageUploaderApp" in the user's Google Drive
When images are uploaded, they are stored in this folder
The app generates direct links to the images using the GitHub Pages URL
All uploaded images are displayed in a gallery with their links

Customization
You can customize the app by modifying the style.css file. You can change colors, fonts, and layout to match your preferences.
Troubleshooting

If you're having issues with authentication, make sure your OAuth credentials are set up correctly
If images are not displaying, check if the files are properly uploaded to Google Drive
If the direct links are not working, make sure the images directory exists in your repository

License
This project is licensed under the MIT License - see the LICENSE file for details.
Acknowledgments

Google Drive API
GitHub Pages
