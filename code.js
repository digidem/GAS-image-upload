var s3url = "http://s3.amazonaws.com/clearwater-photos/";

// Checks any edited cell to see if it contains a valid URL
// And also whether it already refers to an image stored in our s3 bucket
function checkForUrl(e) {
  var value;
  var values = e.range.getValues();
  var regex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)\.jpg$/g
  
  for (var i=0; i < values.length; i++) {
    for (var j=0; j < values[i].length; j++) {
         value = values[i][j];
         if ((typeof value === "string") && value.split(/[?|#]/)[0].match(regex) && !~value.indexOf(s3url)) {
           uploadPhoto(value, e.range.getCell(i+1, j+1));
         }
    }
  }
}

// Sends the photo to s3 via http://www.blitline.com/ and updates the URL in the cell.
function uploadPhoto(url, range) {
  var outputUrl;
  var blitlineAppId = ScriptProperties.getProperty("blitlineAppId");
  
  // Compute an SHA-1 hash from the source URL, to use as a unique filename for the photo.
  var fileId = bin2String(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, url, Utilities.Charset.US_ASCII));
  
  // Check a file exists at the given URL
  var status = UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getResponseCode();
  if (status < 200 || status >= 300) {
    range.setComment("Original image not found")
    range.setBackground("#ffff00");
    return;
  }
  
  // Create Job request for Blitline.
  var job_data = {
    "application_id": blitlineAppId,
    "src": url,
    "pre_process": {
      "move_original": {
        "s3_destination": s3Destination(fileId + ".jpg")
      }
    },
    "functions": [
      resize(fileId, 2048),
      resize(fileId, 480),
      resize(fileId, 960, true),
      resize(fileId, 150),
      resize(fileId, 300, true)
    ]
  };
  
  var params = {
    method: "post",
    payload: "json=" + JSON.stringify(job_data)
  };
  
  // Submit job to Blitline
  var response = UrlFetchApp.fetch("http://api.blitline.com/job", params);
  
  var responseJson = JSON.parse(response.getContentText());

  // On success update the URL text in the cell, update background color, and add a comment with a link to the original image.
  if (responseJson.results.error) {
    range.setComment("There was an error processing the image: " + responseJson.results.error);
    range.setBackground("#FF0000");
  } else {
    // Poll the job response url to wait for the job to complete (inefficient, but no other way in Google Scripts)
    var jobResponse = UrlFetchApp.fetch("http://cache.blitline.com/listen/" + responseJson.results.job_id);
    range.setBackground("#00ffff");
    range.setValue(s3url + fileId + ".jpg");
    range.setComment("Original image url: " + url);
  }
}

// Creates resize function job parameters for Blitline
function resize(fileId, width, retina) {
  var retinaPostfix = (retina) ? "@2x" : "";
  return {
    "name":"resize_to_fit",
    "params": {
      "width": width,
      "only_shrink_larger": true
    },
    "save": {
      "image_identifier": fileId + "-" + width + retinaPostfix,
      "s3_destination": s3Destination(fileId + "-" + width + retinaPostfix + ".jpg")
    }
  };
}

// Creates AWS S3 job parameters for Blitline
function s3Destination(filename) {
  return {
    "bucket": "clearwater-photos",
    "key": filename,
    "headers": {
      "Cache-Control": "max-age=31536000, public",
      "Content-type": "image/jpeg"
    }
  };
}

// Converts the Byte Array results of Googel Apps Script digest function to a string.
function bin2String(array) {
  var byte, byteStr, result = "";
  for (var i = 0; i < array.length; i++) {
    byte = (array[i] + 256) % 256;
    byteStr = byte.toString(16);
    result += (byteStr.length == 1) ? '0' + byteStr : byteStr;
  }
  return result;
}

// Prompt for the Blitline Application ID when the spreadsheet is opened, if it doesn't exist.
function onOpen() {
  getBlitlineAppId();
}

// Prompt for the Blitline Application ID or return the value stored in ScriptProperties
function getBlitlineAppId() {
  var blitlineAppId = ScriptProperties.getProperty("blitlineAppId");
  if (!blitlineAppId) {
    blitlineAppId = Browser.inputBox("Enter the Application ID from http://www.blitline.com");
    ScriptProperties.setProperty("blitlineAppId", blitlineAppId);
  }
  return blitlineAppId;
}

function deleteBlitlineAppId() {
  ScriptProperties.deleteProperty("blitlineAppId");
}
