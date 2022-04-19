// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

// function updateDateTimeElementContent() {
//     let myDate = new Date();
//     let timeElement = document.getElementById('time');
//     let dateElement = document.getElementById('date');
//     timeElement.innerText = myDate.toLocaleTimeString();
//     var dateOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
//     var dateText = myDate.toLocaleDateString("en-GB", dateOptions);
//     dateText = dateText.replace(',', '');
//     dateElement.innerText = dateText;
// }

// function updateWeatherContent() {
//     window.api.send("getClockData");
// }

// window.api.receive("clockDataResult", (data) => {
//     // let debugElement = document.getElementById('debug');
//     // debugElement.innerText = JSON.stringify(data);
//     let currentWeather = data["Weather"]["Current"];
//     let temp = currentWeather["Temperature"];
//     let feelsLike = currentWeather["FeelsLikeTemperature"];
//     let description = currentWeather["Description"];
//     let descriptionElement = document.getElementById('weather-description');
//     let tempElement = document.getElementById('temperature');
//     let feelsLikeElement = document.getElementById('feels-like-temperature');
//     descriptionElement.innerText = capitalizeFirstLetter(description);
//     feelsLikeElement.innerText = absoluteTempToCelsiusText(feelsLike);
//     tempElement.innerText = absoluteTempToCelsiusText(temp);
// });

// function absoluteTempToCelsiusText(absTemp) {
//     let celsius = absTemp - 273.15;
//     let celsiusText = celsius.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1})
//     return `${celsiusText}°c`
// }

// function capitalizeFirstLetter(string) {
//     return string.charAt(0).toUpperCase() + string.slice(1);
//   }

// updateWeatherContent();