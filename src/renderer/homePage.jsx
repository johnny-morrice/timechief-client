import { createSignal, Index, onCleanup } from 'solid-js';
import { addClockDataCallback } from './ipc';
import { getTaskBarSignals } from './taskbarSignals';
import { weatherIconStyleClass } from './weatherIcon';
import { kelvinToCelsiusText } from './temperature';
import { apiErrorTimeout, second } from './timing';

class HomePageSignals {
  constructor() {
    [this.isAPIError, this.setAPIError] = createSignal(false);
    [this.locale, this.setLocale] = createSignal("");
    [this.timezone, this.setTimezone] = createSignal("");
    [this.hourCycleOption, this.setHourCycleOption] = createSignal("");
    [this.lastRefreshText, this.setLastRefreshText] = createSignal("");
    [this.lastUpdateTime, this.setLastUpdateTime] = createSignal(new Date());
    [this.myTime, this.setMyTime] = createSignal("");
    [this.myDate, this.setMyDate] = createSignal(getDateText());
    [this.temp, this.setTemp] = createSignal("");
    [this.feelsLikeTemp, this.setFeelsLikeTemp] = createSignal("");
    [this.location, this.setLocation] = createSignal("");
    [this.currentWeatherConditions, this.setCurrentWeatherConditions] = createSignal("");
    [this.todayWeatherConditions, this.setTodayWeatherConditions] = createSignal("");
  }
}

function getTimeText(homePageSignals) {
  let options = {};
  let hourCycleOption = homePageSignals.hourCycleOption();
  let hourCycleMapping = {
    "24h": false,
    "12h": true
  };
  if (hourCycleOption) {
    let timeOpt = hourCycleMapping[hourCycleOption];
    options["hour12"] = timeOpt;
  }
  let timezone = homePageSignals.timezone();
  if (timezone) {
    options["timeZone"] = timezone;
  }
  let locale = homePageSignals.locale();
  if (!locale) {
    locale = undefined;
  }
  console.log(options);
  let time = new Date().toLocaleTimeString(locale, options);
  return time.replace(/\s+(am|pm|AM|PM)/, "");
}

function getDateText() {
  let dateOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
  // The clock model on the webservice should include the locale.
  var dateText = new Date().toLocaleDateString("en-GB", dateOptions);
  return dateText.replace(',', '');
}

function updateHomePageSignals(signals, data) {
  let clock = data["Clock"];
  let hourCycleOption = clock["HourCycleOption"];
  let timezone = clock["Timezone"];
  let locale = clock["Locale"];
  let location = clock["Location"];
  let currentWeather = data["Weather"]["Current"];
  let temp = currentWeather["Temp"];
  let feelsLike = currentWeather["FeelsLike"];
  let weatherConditions = currentWeather["WeatherConditions"];
  let feelsLikeText = kelvinToCelsiusText(feelsLike);
  let tempText = kelvinToCelsiusText(temp);
  let daily = data["Weather"]["Daily"];
  if (daily.length > 0) {
    let today = daily[0];
    let todayConditions = today["WeatherConditions"];
    signals.setTodayWeatherConditions(todayConditions["ConditionCode"]);
  }
  signals.setHourCycleOption(hourCycleOption);
  signals.setLocale(locale);
  signals.setTimezone(timezone);
  console.log(weatherConditions);
  signals.setCurrentWeatherConditions(weatherConditions["ConditionCode"]);
  signals.setFeelsLikeTemp(feelsLikeText);
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
      homePageSignals.setMyTime(getTimeText(homePageSignals));
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
        <div class='home-weather-title flex-element'>Weather</div>
        <div class="flex-element row-flex">
          <div class="flex-element column-flex home-major-data-fields-column">
            <div class="flex-element">temp</div>
            <div class="flex-element">feels like</div>
          </div>
          <div class="flex-element column-flex home-major-data-column">
            <div class='flex-element home-major-data'>{homePageSignals.temp}</div>
            <div class='flex-element home-major-data'>{homePageSignals.feelsLikeTemp}</div>
          </div>
        </div>
        <div class="row-flex flex-element weather-icon-bar">
          <div class="column-flex flex-element">
            <div class='weather-icon flex-element'><i class={"fa-solid " + weatherIconStyleClass(homePageSignals.currentWeatherConditions())}></i></div>
            <div class="flex-element">current</div>
          </div>
          <div class="column-flex flex-element">
            <div class='weather-icon flex-element'><i class={"fa-solid " + weatherIconStyleClass(homePageSignals.todayWeatherConditions())}></i></div>
            <div class="flex-element">today</div>
          </div>
        </div>
        <div class="column-flex flex-element">
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