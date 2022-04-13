// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

function updateDateTimeElementContent() {
    let myDate = new Date();
    let timeElement = document.getElementById('time');
    let dateElement = document.getElementById('date');
    timeElement.innerText = myDate.toLocaleTimeString();
    var dateOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
    var dateText = myDate.toLocaleDateString("en-GB", dateOptions);
    dateText = dateText.replace(',', '');
    dateElement.innerText = dateText;
}

setInterval(updateDateTimeElementContent, 250);