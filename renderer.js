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

window.api.receive("clockDataResult", (data) => {
    // let debugElement = document.getElementById('debug');
    // debugElement.innerText = JSON.stringify(data);
    let currentWeather = data["Weather"]["Current"];
    let temp = currentWeather["Temperature"];
    let feelsLike = currentWeather["FeelsLikeTemperature"];
    let description = currentWeather["Description"];
    let descriptionElement = document.getElementById('weather-description');
    let tempElement = document.getElementById('temperature');
    let feelsLikeElement = document.getElementById('feels-like-temperature');
    descriptionElement.innerText = capitalizeFirstLetter(description);
    feelsLikeElement.innerText = absoluteTempToCelsiusText(feelsLike);
    tempElement.innerText = absoluteTempToCelsiusText(temp);
});

function absoluteTempToCelsiusText(absTemp) {
    let celsius = absTemp - 273.15;
    let celsiusText = celsius.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1})
    return `${celsiusText}°c`
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

window.api.send("getClockData");

updateDateTimeElementContent();
setInterval(updateDateTimeElementContent, 250);
updateWeatherContent();
setInterval(updateWeatherContent(), 1000 * 60 * 10)


// https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}


55.953251, -3.188267