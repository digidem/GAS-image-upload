GAS Image Upload
================

A Google Apps Script for Google Sheets that will scrape any image urls (jpgs only for now) pasted into the spreadsheet and send the image to http://www.blitline.com for resizing and copying to AWS S3

# What it does

Whenever you edit a cell in the spreadsheet it will:

1. Check if the contents are a valid URL
2. Check if the URL ends in .jpg
3. Send a job request to http://www.blitline.com/
4. Update the contents of the cell with the URL pointing to the processed image
5. Change the background color and set a comment on the cell with the original URL
 
# Why?

We are using Google Sheets to manage data on a website. We want an easy way for users to upload images and resize them. With this method, they upload images with any service they want (Dropbox, Google Drive, Flickr) and paste a public link to the image into the spreadsheet. This script will copy the image to our AWS S3 and make copies at different sizes. Check http://www.blitline.com/docs/api for more details on what image processing can be done.

# How to use

From a Google Spreadsheet create a new Script project, and paste in the code from `code.gs`. Select the menu option "Resources --> Current Project Triggers" and add a new trigger for `checkForUrl` for the event `From spreadsheet` `On edit` and click save. You will be asked to give the script permissions.

The first time you open the sheet or try to edit, it will ask for your Blitline Application ID. You can sign up for a developer account at http://www.blitline.com/ which gives you 2 hours of free processing time, which is plenty for this application.

