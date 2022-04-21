import { createSignal, onCleanup } from 'solid-js';
import { addClockDataCallback } from './ipc';
import { getTaskBarSignals } from './taskbarSignals';

class HomePageSignals {
  constructor() {
      [this.myTime, this.setMyTime] = createSignal(getTimeText());
      [this.myDate, this.setMyDate] = createSignal(getDateText());
      [this.temp, this.setTemp] = createSignal("");
      [this.feelsLikeTemp, this.setFeelsLikeTemp] = createSignal("");
      [this.weatherDescription, this.setWeatherDescription] = createSignal("");
      [this.location, this.setLocation] = createSignal("")
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
    let location = data["Clock"]["Location"];
    let currentWeather = data["Weather"]["Current"];
    let temp = currentWeather["Temperature"];
    let feelsLike = currentWeather["FeelsLikeTemperature"];
    let description = currentWeather["Description"];
    let feelsLikeText = absoluteTempToCelsiusText(feelsLike);
    let tempText = absoluteTempToCelsiusText(temp);
    signals.setWeatherDescription(capitalizeFirstLetter(description));
    signals.setFeelsLikeTemp(`feels like ${feelsLikeText}`);
    signals.setTemp(tempText);
    signals.setLocation(location);
}

export const HomePage = () => {
  let homePageSignals = new HomePageSignals();
  let taskBarSignals = getTaskBarSignals();

  addClockDataCallback((data) => updateHomePageSignals(homePageSignals, data));

  let timeInterval = setInterval(
    () => {
      homePageSignals.setMyTime(getTimeText());
      homePageSignals.setMyDate(getDateText());
    },
    100
  );

  onCleanup(() => {
    clearInterval(timeInterval);
  });

  return <div id="home-screen" style={{
          display: `${taskBarSignals.homeDisplayStyle()}`
        }}
        >
        <div class="column-flex">
            <div class='flex-element'>
                <div id='home-location'>{homePageSignals.location}</div>
            </div>
            <div class='flex-element'>
                <div id='time'>{homePageSignals.myTime}</div>
            </div>
            <div class='flex-element'>
                <div id='date'>{homePageSignals.myDate}</div>
            </div>

            <div class='row-flex'>
                <div class='flex-element'>
                    <div id='temperature'>{homePageSignals.temp}</div>
                </div>
                <div class='flex-element'>
                    <div id='feels-like-temperature'>{homePageSignals.feelsLikeTemp}</div>
                </div>
            </div>
            <div class='flex-element'>
                <div id='weather-description'>{homePageSignals.weatherDescription}</div>
            </div>
        </div>
    </div>;
};