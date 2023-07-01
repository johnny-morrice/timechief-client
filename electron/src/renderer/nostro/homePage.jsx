import { createEffect, createSignal, onCleanup } from 'solid-js';
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
import { Pairing } from './pairing';
import { Locale } from './locale';
import { callbackName } from "./callback";
import { Forecast } from './forecast';
import { EventCalendar } from './eventCalendar';
import { fadeTransition } from './fadeTransition';

class Signals {
  constructor() {
    [this.locale, this.setLocale] = createSignal("");
    [this.timeZone, this.setTimezone] = createSignal("");
    [this.hourCycleOption, this.setHourCycleOption] = createSignal("");
    [this.lastUpdateTime, this.setLastUpdateTime] = createSignal(new Date());
    [this.myTime, this.setMyTime] = createSignal("");
    [this.myDate, this.setMyDate] = createSignal(getDateText("en-GB"));
    [this.nextEventBuffer, this.setNextEventBuffer] = createSignal(null);
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
  let timezone = clock["Timezone"];
  let locale = clock["Locale"];
  signals.setHourCycleOption(hourCycleOption);
  signals.setLocale(locale);
  signals.setTimezone(timezone);
  signals.setLastUpdateTime(new Date());
  if (calendar.Calendar) {
    const nextEvent = findNextEvent(calendar.Calendar.Events);
    signals.setNextEventBuffer(nextEvent, timezone);
  }
}

// setFakeEvent is a useful test utility
// function setFakeEvent(signals) {
//   const bufEvent = signals.nextEventBuffer();
//   const isCreated = bufEvent !== null;
//   if (Math.random() < 0.1) {
//     if (isCreated) {
//       if (Math.random() < 0.2) {
//         signals.setNextEventBuffer(null);
//       } else if (Math.random() < 0.5) {
//         // Start time is now + 3 hours in unix time.
//         const startTime = Math.floor(Date.now() / 1000) + (3 * 60 * 60) + (Math.random() * 1000 * 60 * 60);
//         const event = new CalendarEvent({
//           "ShortText": "Fake event",
//           "Start": startTime,
//           "End": 0,
//           "AllDay": true,
//         });
//         signals.setNextEventBuffer(event);
//       } else {
//         // Start time is now + 3 hours in unix time.
//         const startTime = Math.floor(Date.now() / 1000) + (3 * 60 * 60);
//         const shortRandomText = Math.random().toString(36).substring(2, 15);
//         const event = new CalendarEvent({
//           "ShortText": "Fake event" + shortRandomText,
//           "Start": startTime,
//           "End": 0,
//           "AllDay": true,
//         });
//         signals.setNextEventBuffer(event);
//       }
//     }
//   } else {
//     // Start time is now + 3 hours in unix time.
//     const startTime = Math.floor(Date.now() / 1000) + 3 * 60 * 60;
//     const event = new CalendarEvent({
//       "ShortText": "Fake event",
//       "Start": startTime,
//       "End": 0,
//       "AllDay": true,
//     });
//     signals.setNextEventBuffer(event);
//   }
//   return;
// }

function getTimeZone(signals) {
  let tz = signals.timeZone();
  if (tz) {
    return tz;
  }
  return "Europe/London";
}

function findNextEvent(eventData, timezone) {
  if (!eventData) {
    return null;
  }
  let calendarEvents = eventData.map(ev => new CalendarEvent(ev));
  sortCalendarEvents(calendarEvents, timezone);
  for (var i = 0; i < calendarEvents.length; i++) {
    let cev = calendarEvents[i];
    if (cev.isHighlight(timezone)) {
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
  const cbName = callbackName("HomePage");
  addServiceDataCallback(cbName, (data) => updateSignals(signals, data));

  let timeInterval = setInterval(
    () => {
      signals.setMyTime(getTimeText(signals));
    },
    second / 10
  );

  let dateInterval = setInterval(
    () => {
      signals.setMyDate(getDateText(getLocale(signals)));
    },
    second
  );

  onCleanup(() => {
    clearInterval(timeInterval);
    clearInterval(dateInterval);
    removeDataCallback(cbName);
  });

  const moveEventBufferToEvent = () => {
    fadeTransition("home-action-center-content", () => {
      signals.setNextEvent(signals.nextEventBuffer());
    });
  };

  createEffect(() => {
    const nextEventBuf = signals.nextEventBuffer();
    const nextEvent = signals.nextEvent();
    // A change has occured if:
    // One is null and the other is not null.
    // One has a different time to the other.
    // One has a different text to the other.
    if ((nextEventBuf == null && nextEvent != null) ||
      (nextEventBuf != null && nextEvent == null)) {
      moveEventBufferToEvent();
    }

    // If either are null we stop here.
    if (nextEventBuf == null || nextEvent == null) {
      return;
    }

    const bufEventStartTime = nextEventBuf.formatStartTime(getLocale(signals), getTimeZone(signals));
    const bufEventShortText = nextEventBuf.eventShortText();
    const nextEventStartTime = nextEvent.formatStartTime(getLocale(signals), getTimeZone(signals));
    const nextEventShortText = nextEvent.eventShortText();
    if (bufEventStartTime != nextEventStartTime ||
      bufEventShortText != nextEventShortText) {
      moveEventBufferToEvent();
    }

  });


  return <div class="home-screen flex-row">
    <div class="home-lhs-column flex-column flex-grow border crt-box">
      <SwitcherWidget widgets={
        [
          { icon: () => <i class="fa-solid fa-cloud-sun"></i>, element: () => <CurrentWeather /> },
          { icon: () => <i class="fa-solid fa-gear"></i>, element: () => <DeviceControl /> },
          { icon: () => <i class="fa-solid fa-network-wired"></i>, element: () => <DeviceInfo /> },
          { icon: () => <i class="fa-solid fa-user"></i>, element: () => <Pairing /> },
          { icon: () => <i class="fa-solid fa-earth-americas"></i>, element: () => <Locale /> },
          { icon: () => <i class="fa-solid fa-moon"></i>, element: () => <Astro /> },
          { icon: () => <i class="fa-solid fa-mountain-sun"></i>, element: () => <Forecast /> },
          { icon: () => <i class="fa-solid fa-calendar-days"></i>, element: () => <EventCalendar /> },
        ]
      } />
    </div>
    <div class='home-rhs-column flex-column flex-grow'>
      <div class="home-time-wrapper flex-grow">
        <div class="home-time">{signals.myTime}</div>
        <div class="home-date">{signals.myDate}</div>
      </div>

      <div class="home-action-center flex-grow border crt-box">
        <div id="home-action-center-content" class="flex-row flex-grow">
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
  </div>
};