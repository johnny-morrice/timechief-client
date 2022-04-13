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

function updateWeatherContent() {
    // let url = 'https://api.openweathermap.org/data/2.5/weather?lat=55.953251&lon=-3.188267&appid=' + window.clockData.OPEN_WEATHER_API_KEY;
    let debugElement = document.getElementById('debug');
      debugElement.innerText = responseText;
}

window.api.receive("weatherResult", (data) => {
    let debugElement = document.getElementById('debug');
    let resultText = String.fromCharCode(...data);
    let json = JSON.parse(resultText);
    debugElement.innerText = resultText;
});

window.api.send("getWeather");

updateDateTimeElementContent();
setInterval(updateDateTimeElementContent, 250);
updateWeatherContent();


// https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}


55.953251, -3.188267