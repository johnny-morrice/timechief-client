import { createSignal, onCleanup } from 'solid-js';
import { addClockDataCallback } from './ipc';
import { weatherIconStyleClass } from './weatherIcon';
import { kelvinToCelsiusText } from './temperature';
import { apiErrorTimeout, second } from './timing';
import { CalendarEvent, sortCalendarEvents } from './calendarEvent';

class HomePageSignals {
  constructor() {
    [this.isAPIError, this.setAPIError] = createSignal(false);
    [this.locale, this.setLocale] = createSignal("");
    [this.timeZone, this.setTimezone] = createSignal("");
    [this.hourCycleOption, this.setHourCycleOption] = createSignal("");
    [this.lastRefreshText, this.setLastRefreshText] = createSignal("");
    [this.lastUpdateTime, this.setLastUpdateTime] = createSignal(new Date());
    [this.myTime, this.setMyTime] = createSignal("");
    [this.myDate, this.setMyDate] = createSignal(getDateText("en-GB"));
    [this.temp, this.setTemp] = createSignal("");
    [this.feelsLikeTemp, this.setFeelsLikeTemp] = createSignal("");
    [this.location, this.setLocation] = createSignal("");
    [this.currentWeatherConditions, this.setCurrentWeatherConditions] = createSignal("");
    [this.todayWeatherConditions, this.setTodayWeatherConditions] = createSignal("");
    [this.nextEvent, this.setNextEvent] = createSignal(null);
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
  let timeZone = homePageSignals.timeZone();
  if (timeZone) {
    options["timeZone"] = timeZone;
  }
  let locale = homePageSignals.locale();
  if (!locale) {
    locale = undefined;
  }
  let time = new Date().toLocaleTimeString(locale, options);
  return time.replace(/\s+(am|pm|AM|PM)/, "");
}

function getDateText(locale) {
  let dateOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
  var dateText = new Date().toLocaleDateString(locale, dateOptions);
  return dateText.replace(',', '');
}

function updateHomePageSignals(signals, data) {
  let calendar = data["Calendar"];
  let clock = data["Clock"];
  let hourCycleOption = clock["HourCycleOption"];
  let timeZone = clock["Timezone"];
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
  signals.setTimezone(timeZone);
  signals.setCurrentWeatherConditions(weatherConditions["ConditionCode"]);
  signals.setFeelsLikeTemp(feelsLikeText);
  signals.setTemp(tempText);
  signals.setLocation(location);
  signals.setLastUpdateTime(new Date());
  if (calendar.Calendar) {
    // calendar.Calendar.Events.forEach(data => {
    //   const cev = new CalendarEvent(data);
    //   console.log(data);
    //   if (data["End"] != 0) {
    //     console.log(`starts: ${cev.formatStartTime(getLocale(signals))} end: ${cev.formatEndTime(getLocale(signals))} event: ${cev.eventShortText()}`)
    //   } else {
    //     console.log(`starts: ${cev.formatStartTime(getLocale(signals))} event: ${cev.eventShortText()}`)
    //   }    
    // });
    const nextEvent = findNextEvent(calendar.Calendar.Events);
    signals.setNextEvent(nextEvent);
  }
}

function getTimeZone(signals) {
  let tz = signals.timeZone();
  if (tz) {
    return tz;
  }
  return "Europe/London";
}

function findNextEvent(eventData) {
  if (!eventData) {
    return null;
  }
  let calendarEvents = eventData.map(ev => new CalendarEvent(ev));
  sortCalendarEvents(calendarEvents);
  for (var i = 0; i < calendarEvents.length; i++) {
    let cev = calendarEvents[i];
    if (cev.isHighlight()) {
      return cev;
    }
  }
  return null;
}

function getLocale(signals) {
  const locale = signals.locale();
  if (!locale) {
    return "en-GB";
  }
  return locale;
}

function getNextEventStartTime(signals) {
  const nextEvent = signals.nextEvent();
  if (!nextEvent) {
    return "";
  }
  return nextEvent.formatStartTime(getLocale(signals), getTimeZone(signals));
}

function getNextEventShortText(signals) {
  const nextEvent = signals.nextEvent();
  if (!nextEvent) {
    return "";
  }
  return nextEvent.eventShortText();
}

function hasNextEvent(signals) {
  const nextEvent = signals.nextEvent();
  if (!nextEvent) {
    return false;
  }
  if (!nextEvent.eventShortText()) {
    return false;
  }
  return true;
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

var initialised = false;
let homePageSignals = new HomePageSignals();
export const HomePage = () => {

  if (!initialised) {
    addClockDataCallback((data) => updateHomePageSignals(homePageSignals, data));
    initialised = true;
  }
  
  let timeInterval = setInterval(
    () => {
      homePageSignals.setMyTime(getTimeText(homePageSignals));
      homePageSignals.setMyDate(getDateText(getLocale(homePageSignals)));
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

  return <div id="home-screen">
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
      </div>
      <div class='flex-element column-flex time-border'>
        <div id='time'>{homePageSignals.myTime}</div>
        <div id='date'>{homePageSignals.myDate}</div>
        <div id='home-location'>{homePageSignals.location}</div>
        <Show when={hasNextEvent(homePageSignals)}>
          <div class='next-event-summary'>
            <div class='next-event-time'>
              <div class='next-event-symbol'><i class="fa-solid fa-calendar-day"></i></div>
              <div class='next-event-time'>{getNextEventStartTime(homePageSignals)}</div>
            </div>
            <div class='next-event-shorttext'>
              {getNextEventShortText(homePageSignals)}
            </div>
          </div>
        </Show>
      </div>
    </div>
  </div>;
};