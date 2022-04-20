import { render } from "solid-js/web";
import { createSignal, onCleanup } from 'solid-js';
import { initializeIPC, addClockDataCallback } from './ipc';

class HomePageSignals {
  constructor() {
      [this.myTime, this.setMyTime] = createSignal(getTimeText());
      [this.myDate, this.setMyDate] = createSignal(getDateText());
      [this.temp, this.setTemp] = createSignal("");
      [this.feelsLikeTemp, this.setFeelsLikeTemp] = createSignal("");
      [this.weatherDescription, this.setWeatherDescription] = createSignal("");
  }
}

function absoluteTempToCelsiusText(absTemp) {
    let celsius = absTemp - 273.15;
    let celsiusText = celsius.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1})
    return `${celsiusText}°c`
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

function getTimeText() {
    return new Date().toLocaleTimeString();
}
  
function getDateText() {
    let dateOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
    var dateText = new Date().toLocaleDateString("en-GB", dateOptions);
    return dateText.replace(',', '');
}

function updateHomePageSignals(signals, data) {
    let currentWeather = data["Weather"]["Current"];
    let temp = currentWeather["Temperature"];
    let feelsLike = currentWeather["FeelsLikeTemperature"];
    let description = currentWeather["Description"];
    let feelsLikeText = absoluteTempToCelsiusText(feelsLike);
    let tempText = absoluteTempToCelsiusText(temp);
    signals.setWeatherDescription(capitalizeFirstLetter(description));
    signals.setFeelsLikeTemp(`feels like ${feelsLikeText}`);
    signals.setTemp(tempText);
}

const App = () => {
  let signals = new HomePageSignals();

  addClockDataCallback((data) => updateHomePageSignals(signals, data));

  let timeInterval = setInterval(
    () => {
      signals.setMyTime(getTimeText());
      signals.setMyDate(getDateText());
    },
    100
  );

  let ipcInterval = initializeIPC();
  onCleanup(() => {
    clearInterval(timeInterval);
    clearInterval(ipcInterval);
  });

  return <div id="home-screen">
    <div class="column-flex">

      <div class='flex-element'>
        <div id='time'>{signals.myTime}</div>
      </div>
      <div class='flex-element'>
        <div id='date'>{signals.myDate}</div>
      </div>
      
      <div class='row-flex'>
        <div class='flex-element'>
          <div id='temperature'>{signals.temp}</div>
        </div>
        <div class='flex-element'>
          <div id='feels-like-temperature'>{signals.feelsLikeTemp}</div>
        </div>
      </div>
      <div class='flex-element'>
        <div id='weather-description'>{signals.weatherDescription}</div>
      </div>
    </div>
  </div>;
};


render(() => <App />, document.getElementById('app'))
