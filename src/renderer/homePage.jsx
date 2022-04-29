import { createSignal, Index, onCleanup } from 'solid-js';
import { addClockDataCallback } from './ipc';
import { getTaskBarSignals } from './taskbarSignals';
import { weatherIconStyleClass } from './weatherIcon';
import { kelvinToCelsiusText } from './temperature';
import { apiErrorTimeout, minute, second } from './timing';

class HomePageSignals {
  constructor() {
      [this.isAPIError, this.setAPIError] = createSignal(false);
      [this.lastRefreshText, this.setLastRefreshText] = createSignal("");
      [this.lastUpdateTime, this.setLastUpdateTime] = createSignal(new Date());
      [this.myTime, this.setMyTime] = createSignal(getTimeText());
      [this.myDate, this.setMyDate] = createSignal(getDateText());
      [this.temp, this.setTemp] = createSignal("");
      [this.feelsLikeTemp, this.setFeelsLikeTemp] = createSignal("");
      [this.weatherDescriptions, this.setWeatherDescriptions] = createSignal([]);
      [this.location, this.setLocation] = createSignal("")
  }
}

function getTimeText() {
    return new Date().toLocaleTimeString();
}
  
function getDateText() {
    let dateOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
    // The clock model on the webservice should include the locale.
    var dateText = new Date().toLocaleDateString("en-GB", dateOptions);
    return dateText.replace(',', '');
}

function updateHomePageSignals(signals, data) {
    let location = data["Clock"]["Location"];
    let currentWeather = data["Weather"]["Current"];
    let temp = currentWeather["Temp"];
    let feelsLike = currentWeather["FeelsLike"];
    let descriptions = [];
    let weatherConditions = currentWeather["WeatherConditions"];
    for (var i = 0; i < weatherConditions.length; i++) {
        descriptions.push(weatherConditions[i]["Description"]);
    }
    let feelsLikeText = kelvinToCelsiusText(feelsLike);
    let tempText = kelvinToCelsiusText(temp);
    signals.setWeatherDescriptions(descriptions);
    signals.setFeelsLikeTemp(`feels like ${feelsLikeText}`);
    signals.setTemp(tempText);
    signals.setLocation(location);
    signals.setLastUpdateTime(new Date());
}

function timeDifferenceToNowText(lastUpdateTime) {
  const now = new Date();
  const diff = now.getTime() - lastUpdateTime.getTime();
  if (diff < apiErrorTimeout) {
    return "Updated just now"
  } else {
    return "Connection error"
  }
}

function isErrorTimeout(lastUpdateTime) {
  const now = new Date();
  const diff = now.getTime() - lastUpdateTime.getTime();
  return diff >= apiErrorTimeout;
}

function errorStyleClass(isError) {
  if (isError) {
    return "home-error";
  } else {
    return "";
  }
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
    second / 10
  );
  let updateRefreshTimeInterval = setInterval(
    () => {
      const lastUpdateTime = homePageSignals.lastUpdateTime();
      const text = timeDifferenceToNowText(lastUpdateTime);
      homePageSignals.setLastRefreshText(text);
      homePageSignals.setAPIError(isErrorTimeout(lastUpdateTime));
    },
    second
  );

  onCleanup(() => {
    clearInterval(updateRefreshTimeInterval);
    clearInterval(timeInterval);
  });

  return <div id="home-screen" style={{
          display: `${taskBarSignals.homeDisplayStyle()}`
        }}
        >
        <div class="row-flex">
          <div class="flex-element column-flex" id="home-data">
              <div class='section-name flex-element'>Temperature</div>
              <div class='row-flex flex-element'>
                  <div class='flex-element' id='temperature'>{homePageSignals.temp}</div>
                  <div class='flex-element' id='feels-like-temperature'>{homePageSignals.feelsLikeTemp}</div>
              </div>
              <div class="column-flex">
                  <div class='section-name flex-element'>Weather now</div>
                  <Index each={homePageSignals.weatherDescriptions()}>{(desc, i) => {
                      return <div class="row-flex flex-element weather-icon-bar">
                              <div class='weather-icon flex-element'><i class={"fa-solid " + weatherIconStyleClass(desc())}></i></div>
                              <div class='current-weather-description flex-element'>{desc()}</div>
                      </div>
                  }}</Index>
              </div>
              <div class="column-flex">
                <div class='section-name flex-element'>Status</div>
                <div class={"row-flex home-health-icon-bar " + errorStyleClass(homePageSignals.isAPIError())}>
                  <Show when={!homePageSignals.isAPIError()}>
                    <div class='flex-element home-health-icon'>
                      <i class='fa-solid fa-heart'></i>
                    </div>
                  </Show> 
                  <Show when={homePageSignals.isAPIError()}>
                    <div class='flex-element'>
                      <i class='fa-solid fa-heart-crack'></i>
                    </div>
                  </Show> 
                  <div class='flex-element'>{homePageSignals.lastRefreshText}</div>
                </div>
              </div>
          </div>
          <div class='flex-element column-flex time-border'>
            <div id='time'>{homePageSignals.myTime}</div>
            <div id='date'>{homePageSignals.myDate}</div>
            <div id='home-location'>{homePageSignals.location}</div>
          </div>
        </div>
    </div>;
};