import { createSignal, onCleanup } from 'solid-js';
import { addServiceDataCallback } from './ipc';
import { second } from '../timing';
import { CalendarEvent, sortCalendarEvents } from '../calendarEvent';
import { removeDataCallback } from './ipc';
import { CurrentWeather } from './currentWeather';
import { StatusNote } from './statusNote';
import { SwitcherWidget } from './switcherWidget';
import { DeviceControl } from './deviceControl';
import { Astro } from './astro';
import { Fortune } from './fortune';
import { DeviceInfo } from './deviceInfo';

class Signals {
  constructor() {
    [this.locale, this.setLocale] = createSignal("");
    [this.timeZone, this.setTimezone] = createSignal("");
    [this.hourCycleOption, this.setHourCycleOption] = createSignal("");
    [this.lastUpdateTime, this.setLastUpdateTime] = createSignal(new Date());
    [this.myTime, this.setMyTime] = createSignal("");
    [this.myDate, this.setMyDate] = createSignal(getDateText("en-GB"));
    [this.location, this.setLocation] = createSignal("");
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

function updateSignals(signals, data) {
  let calendar = data["Calendar"];
  let clock = data["Clock"];
  let hourCycleOption = clock["HourCycleOption"];
  let timeZone = clock["Timezone"];
  let locale = clock["Locale"];
  let location = clock["Location"];

  signals.setHourCycleOption(hourCycleOption);
  signals.setLocale(locale);
  signals.setTimezone(timeZone);
  signals.setLocation(location);
  signals.setLastUpdateTime(new Date());
  if (calendar.Calendar) {
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

export const HomePage = () => {
  const signals = new Signals();
  addServiceDataCallback("HomePage", (data) => updateSignals(signals, data));

  let timeInterval = setInterval(
    () => {
      signals.setMyTime(getTimeText(signals));
      signals.setMyDate(getDateText(getLocale(signals)));
    },
    second / 10
  );

  onCleanup(() => {
    clearInterval(timeInterval);
    removeDataCallback("HomePage");
  });

  return <div class="home-screen flex-row">
    <div class="home-lhs-column flex-column flex-grow border crt-box">
      <SwitcherWidget widgets={
        [
          { icon: () => <i class="fa-solid fa-cloud-sun"></i>, element: () => <CurrentWeather /> },
          { icon: () => <i class="fa-solid fa-gear"></i>, element: () => <DeviceControl />},
          { icon: () => <i class="fa-solid fa-network-wired"></i>, element: () => <DeviceInfo />},
          { icon: () => <i class="fa-solid fa-moon"></i>, element: () => <Astro /> }
        ]
      } />
    </div>
    <div class='home-rhs-column flex-column flex-grow'>
      <div class="home-time-wrapper flex-grow">
        <div class="home-time">{signals.myTime}</div>
        <div class="home-date">{signals.myDate}</div>
        <div class='home-location'>{signals.location}</div>
      </div>

      <div class="home-action-center flex-row flex-grow border crt-box">
        <Show when={hasNextEvent(signals)}>
          <div class='next-event-summary flex-column flex-grow'>
            <div class='next-event-time flex-row'>
              <div class='next-event-icon'><i class="fa-solid fa-calendar-day"></i></div>
              <div class='next-event-time'>{getNextEventStartTime(signals)}</div>
            </div>
            <div class='next-event-shorttext'>
              {getNextEventShortText(signals)}
            </div>
          </div>
        </Show>
        <Show when={!hasNextEvent(signals)}>
          <Fortune />
        </Show>
        <StatusNote />
      </div>
    </div>
  </div>
};