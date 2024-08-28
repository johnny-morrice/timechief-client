import { createSignal, onCleanup } from 'solid-js';
import { addServiceDataCallback, ecoRefreshInterval, isEcoMode } from './ipc';
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
import { Locale } from './locale';
import { callbackName } from "./callback";
import { Forecast } from './forecast';
import { EventCalendar } from './eventCalendar';
import { fadeTransition } from './fadeTransition';
import { SSHSecurity } from './sshSecurity';
import { APISecurity } from './apiSecurity';
import { manageMascotCanvas, scoreEmote } from './mascot';

class Signals {
  constructor() {
    [this.locale, this.setLocale] = createSignal("");
    [this.timeZone, this.setTimezone] = createSignal("");
    [this.hourCycleOption, this.setHourCycleOption] = createSignal("h23");
    [this.lastUpdateTime, this.setLastUpdateTime] = createSignal(new Date());
    [this.myTime, this.setMyTime] = createSignal("");
    [this.myDate, this.setMyDate] = createSignal("");
    [this.nextEventBuffer, this.setNextEventBuffer] = createSignal(null);
    [this.nextEvent, this.setNextEvent] = createSignal(null);
    [this.actionCentreTransition, this.setActionCentreTransition] = createSignal("no-transition");
    [this.timeFormatter, this.setTimeFormatter] = createSignal(new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", "second": "2-digit" }));
    [this.dateFormatter, this.setDateFormatter] = createSignal(new Intl.DateTimeFormat("en-GB", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
    [this.boxBackgroundColor, this.setBoxBackgroundColor] = createSignal("black");
    [this.foregroundColor, this.setForegroundColor] = createSignal("green");
    [this.emote, this.setEmote] = createSignal("neutral");
    [this.isSpooky, this.setSpooky] = createSignal(false);
  }
}

function makeTimeFormatter(homePageSignals) {
  let options = {
    hour: "numeric", minute: "2-digit", "second": "2-digit"
  };
  let hourCycleOption = homePageSignals.hourCycleOption();
  options["hourCycle"] = hourCycleOption;
  if (hourCycleOption === "h23") {
    options["hour"] = "2-digit";
  }

  let timeZone = homePageSignals.timeZone();
  if (timeZone) {
    options["timeZone"] = timeZone;
  }
  return new Intl.DateTimeFormat(homePageSignals.getLocale(), options);
}

function makeDateFormatter(homePageSignals) {
  let options = {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  };
  return new Intl.DateTimeFormat(homePageSignals.getLocale(), options);
}


function getTimeText(homePageSignals) {
  const formatter = homePageSignals.timeFormatter();
  const time = formatter.format(new Date());
  return time.replace(/\s+(am|pm|AM|PM)/, "");
}

function getDateText(homePageSignals) {
  const formatter = homePageSignals.dateFormatter();
  const dateText = formatter.format(new Date());
  return dateText.replace(',', '');
}

function moveEventBufferToEvent(signals) {
  fadeTransition(signals.setActionCentreTransition, () => {
    signals.setNextEvent(signals.nextEventBuffer());
  });
};

function handleEventChange(signals) {
  const nextEventBuf = signals.nextEventBuffer();
  const nextEvent = signals.nextEvent();
  // A change has occured if:
  // One is null and the other is not null.
  // One has a different time to the other.
  // One has a different text to the other.
  if ((nextEventBuf == null && nextEvent != null) ||
    (nextEventBuf != null && nextEvent == null)) {
    moveEventBufferToEvent(signals);
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
    moveEventBufferToEvent(signals);
  }
}

function updateSignals(signals, data) {
  let calendarWrapper = data["google_calendar"];
  if (!calendarWrapper) {
    return;
  }
  let calendar = calendarWrapper["value"];
  if (!calendar) {
    return;
  }
  let calendarEvents = calendar["events"];
  if (!calendarEvents) {
    return;
  }
  let deviceProfileWrapper = data["device_profile"];
  if (!deviceProfileWrapper) {
    return;
  }
  let deviceProfile = deviceProfileWrapper["value"];
  if (!deviceProfile) {
    return;
  }
  let device = deviceProfile["device"];
  let hourCycleOption = device["hour_cycle_option"];
  let timezone = device["timezone"];
  let locale = device["locale"];
  signals.setHourCycleOption(hourCycleOption);
  signals.setLocale(locale);
  signals.setTimezone(timezone);
  signals.setLastUpdateTime(new Date());
  signals.setTimeFormatter(makeTimeFormatter(signals));
  signals.setDateFormatter(makeDateFormatter(signals));
  // setFakeEvent(signals);
  const nextEvent = findNextEvent(calendarEvents);
  signals.setNextEventBuffer(nextEvent, timezone);
  handleEventChange(signals);

  const theme = deviceProfile["theme"];
  if (!theme) {
    return;
  }
  let boxBackgroundColor = theme["box_background_color"];
  let foregroundColor = theme["foreground_color"];
  if (boxBackgroundColor) {
    signals.setBoxBackgroundColor(boxBackgroundColor);
  }
  if (foregroundColor) {
    signals.setForegroundColor(foregroundColor);
  }
  const features = deviceProfile["features"];
  if (!features) {
    return;
  }
  const spooky = features["spooky"];
  signals.setSpooky(spooky);
  if (nextEvent) {
    const emote = scoreEmote(nextEvent.eventShortText(), spooky);
    signals.setEmote(emote);
  } else {
    signals.setEmote("neutral");
  }
}

// setFakeEvent is a useful test utility
function setFakeEvent(signals) {
  const bufEvent = signals.nextEventBuffer();
  const isCreated = bufEvent !== null;
  if (Math.random() < 0.1) {
    if (isCreated) {
      if (Math.random() < 0.2) {
        signals.setNextEventBuffer(null);
      } else if (Math.random() < 0.5) {
        // Start time is now + 3 hours in unix time.
        const startTime = Math.floor(Date.now() / 1000) + (3 * 60 * 60) + (Math.random() * 1000 * 60 * 60);
        const event = new CalendarEvent({
          "short_text": "Fake event 🤡🤡🤡🤡🤡🤡🤡🤡",
          "start": startTime,
          "end": 0,
          "all_day": true,
        });
        signals.setNextEventBuffer(event);
      } else {
        // Start time is now + 3 hours in unix time.
        const startTime = Math.floor(Date.now() / 1000) + (3 * 60 * 60);
        const shortRandomText = Math.random().toString(36).substring(2, 15);
        const event = new CalendarEvent({
          "short_text": "Fake event 🤡🤡🤡" + shortRandomText,
          "start": startTime,
          "end": 0,
          "all_day": true,
        });
        signals.setNextEventBuffer(event);
      }
    }
  } else {
    // Start time is now + 3 hours in unix time.
    const startTime = Math.floor(Date.now() / 1000) + 3 * 60 * 60;
    const event = new CalendarEvent({
      "short_text": "Fake event",
      "start": startTime,
      "end": 0,
      "all_day": true,
    });
    signals.setNextEventBuffer(event);
  }
  return;
}

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

var globalSignals = new Signals();
var globalCanvas = null;
var lastManaged = new Date();
setInterval(() => {
  function setCanvas(canvas) {
    globalCanvas = canvas;
  }
  function getCanvas() {
    return globalCanvas;
  }
  if (isEcoMode()) {
    const now = new Date();
    const timeout = ecoRefreshInterval;
    const diff = now.getTime() - lastManaged.getTime();
    if (diff < timeout) {
      return;
    }
  }
  manageMascotCanvas(setCanvas, getCanvas, "event-canvas", globalSignals.emote, 80);
  lastManaged = new Date();
}, 1000);

export const HomePage = () => {
  const signals = new Signals();
  globalSignals = signals;
  const cbName = callbackName("HomePage");
  addServiceDataCallback(cbName, (data) => updateSignals(signals, data));

  let timeInterval = setInterval(
    () => {
      const newTimeText = getTimeText(signals);
      const oldTimeText = signals.myTime();
      if (newTimeText !== oldTimeText) {
        signals.setMyTime(newTimeText);
      }
    },
    second / 10
  );

  let dateInterval = setInterval(
    () => {
      const newDateText = getDateText(signals);
      const oldDateText = signals.myDate();
      if (newDateText !== oldDateText) {
        signals.setMyDate(newDateText);
      }
    },
    second
  );

  onCleanup(() => {
    clearInterval(timeInterval);
    clearInterval(dateInterval);
    removeDataCallback(cbName);
  });

  return <div class="home-screen flex-row">
    <div class="home-lhs-column flex-column flex-grow border crt-box home-box">
      <SwitcherWidget widgets={
        [
          { icon: () => <i class="fa-solid fa-cloud-sun"></i>, element: () => <CurrentWeather /> },
          { icon: () => <i class="fa-solid fa-gear"></i>, element: () => <DeviceControl /> },
          { icon: () => <i class="fa-solid fa-network-wired"></i>, element: () => <DeviceInfo /> },
          { icon: () => <i class="fa-brands fa-linux"></i>, element: () => <SSHSecurity /> },
          { icon: () => <i class="fa-solid fa-house-laptop"></i>, element: () => <APISecurity /> },
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

      <div class="home-action-center flex-grow border crt-box home-box">
        <div id="home-action-center-content" className={`flex-row flex-grow ${signals.actionCentreTransition()}`}>
          <Show when={hasNextEvent(signals)}>
            <div class='next-event-wrapper'>
              <div class='next-event-summary flex-column flex-grow'>
                <div class='next-event-time flex-row'>
                  <div class='next-event-icon'><i class="fa-solid fa-calendar-day"></i></div>
                  <div class='next-event-time'>{getNextEventStartTime(signals)}</div>
                </div>
                <div class='next-event-shorttext'>
                  {getNextEventShortText(signals)}
                </div>
              </div>
              <div class="event-mascot-wrapper">
                <canvas id="event-canvas" class="fortune-mascot" data-sig-fg-color={signals.foregroundColor()} data-sig-bg-color={signals.boxBackgroundColor()} data-sig-emote={signals.emote()}></canvas>
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