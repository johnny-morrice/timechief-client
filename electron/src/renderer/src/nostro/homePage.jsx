import { createSignal, onCleanup, Show } from 'solid-js';
import { addServiceDataCallback } from './ipc';
import { second } from '../timing';
import { CalendarEvent, sortCalendarEvents } from '../calendarEvent';
import { removeDataCallback } from './ipc';
import { callbackName } from "./callback";
import { fadeTransition } from './fadeTransition';
import { scoreEmote } from './mascot';
import { HomeSevenInch } from './homeSevenInch';
import { Loading } from './loading';
import { HomePlanner } from './homePlanner';
import { HomeSmall } from './homeSmall';

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
    [this.boxBackgroundColor, this.setBoxBackgroundColor] = createSignal("black");
    [this.foregroundColor, this.setForegroundColor] = createSignal("green");
    [this.emote, this.setEmote] = createSignal("neutral");
    [this.isSpooky, this.setSpooky] = createSignal(false);
    [this.layout, this.setLayout] = createSignal("seven_inch");
    [this.googleCalendarEvents, this.setGoogleCalendarEvents] = createSignal([]);
    [this.mascotHeight, this.setMascotHeight] = createSignal("100px");
    [this.mascotType, this.setMascotType] = createSignal("dark");
    this.setTimeFormatter(new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", "second": "2-digit" }));
    this.setDateFormatter(new Intl.DateTimeFormat("en-GB", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
    this.setDayOfWeekFormatter(new Intl.DateTimeFormat("en-GB", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
    this.setDayOfMonthFormatter(new Intl.DateTimeFormat("en-GB", { day: 'numeric' }));
    // Show the month and year in the calendar.
    this.setCalendarMonthFormatter(new Intl.DateTimeFormat("en-GB", { month: 'long', year: 'numeric' }));
  }

  timeFormatter() {
    return this._timeFormatter;
  }

  setTimeFormatter(formatter) {
    this._timeFormatter = formatter;
  }

  dateFormatter() {
    return this._dateFormatter;
  }

  setDateFormatter(formatter) {
    this._dateFormatter = formatter;
  }

  setDayOfWeekFormatter(formatter) {
    this._dayOfWeekFormatter = formatter;
  }

  dayOfWeekFormatter(formatter) {
    return this._dayOfWeekFormatter;
  }

  setDayOfMonthFormatter(formatter) {
    this._dayOfMonthFormatter = formatter;
  }

  dayOfMonthFormatter() {
    return this._dayOfMonthFormatter;
  }

  setCalendarMonthFormatter(formatter) {
    this._calendarMonthFormatter = formatter;
  }

  calendarMonthFormatter() {
    return this._calendarMonthFormatter;
  }

}

function makeDayOfMonthFormatter(homePageSignals) {
  let options = {
    day: "numeric"
  };
  return new Intl.DateTimeFormat(getLocale(homePageSignals), options);
}

function makeTimeFormatter(homePageSignals) {
  let options = {
    hour: "numeric", minute: "2-digit", "second": "2-digit"
  };
  let hourCycleOption = homePageSignals.hourCycleOption();
  if (!hourCycleOption) {
    hourCycleOption = "h23";
  }
  options["hourCycle"] = hourCycleOption;
  if (hourCycleOption === "h23") {
    options["hour"] = "2-digit";
  }

 

  let timeZone = homePageSignals.timeZone();
  if (timeZone) {
    options["timeZone"] = timeZone;
  }
  return new Intl.DateTimeFormat(getLocale(homePageSignals), options);
}

function makeDateFormatter(homePageSignals) {
  let options = {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  };
  return new Intl.DateTimeFormat(getLocale(homePageSignals), options);
}

function makeDayOfWeekFormatter(homePageSignals) {
  // We only want the day of the week and nothing else.
  let options = {
    'weekday': 'short'
  }
  return new Intl.DateTimeFormat(getLocale(homePageSignals), options);
}

function makeCalendarMonthFormatter(homePageSignals) {
  let options = {
    month: 'long', year: 'numeric'
  };
  return new Intl.DateTimeFormat(getLocale(homePageSignals), options);
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

function updateCalendarSignals(signals, data, spooky) {
  let googleCalendarWrapper = data["google_calendar"];
  if (!googleCalendarWrapper) {
    return;
  }
  let googleCalendar = googleCalendarWrapper["value"];
  if (!googleCalendar) {
    return;
  }
  let googleCalendarEvents = googleCalendar["events"];
  if (!googleCalendarEvents) {
    return;
  }
  signals.setGoogleCalendarEvents(googleCalendarEvents);

  const nextEvent = findNextEvent(googleCalendarEvents);
  signals.setNextEventBuffer(nextEvent, signals.timeZone());
  handleEventChange(signals);

  if (nextEvent) {
    const emote = scoreEmote(nextEvent.eventShortText(), spooky);
    signals.setEmote(emote);
  } else {
    signals.setEmote("neutral");
  }
}

function updateSignals(signals, data) {
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
  signals.setDayOfWeekFormatter(makeDayOfWeekFormatter(signals));
  signals.setDayOfMonthFormatter(makeDayOfMonthFormatter(signals));
  signals.setCalendarMonthFormatter(makeCalendarMonthFormatter(signals));

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
  signals.setMascotType(theme["mascot_type"]);

  const features = deviceProfile["features"];
  if (!features) {
    return;
  }
  const spooky = features["spooky"];
  signals.setSpooky(spooky);

  signals.setLayout(theme["layout_type"]);

  signals.setMascotHeight(theme["event_mascot_height"]);

  updateCalendarSignals(signals, data, spooky)
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

function isSevenInchLayout(signals) {
  return signals.layout() === "seven_inch";
}

function isPlannerLayout(signals) {
  return signals.layout() === "planner";
}

function isSmallLayout(signals) {
  return signals.layout() === "small";
}

function isUnknownLayout(signals) {
  const knownLayouts = [
    "seven_inch",
    "planner",
    "small"
  ];
  const myLayout = signals.layout();
  for (let index = 0; index < knownLayouts.length; index++) {
    const supported = knownLayouts[index];
    if (supported === myLayout) {
      return false;
    }
  }
  return true;
}

export const HomePage = () => {
  console.log("home page render");
  const signals = new Signals();
  const cbName = callbackName("HomePage");
  addServiceDataCallback(cbName, (data) => updateSignals(signals, data));

  var oldTimeText = "";
  let timeInterval = setInterval(
    () => {
      const newTimeText = getTimeText(signals);
      if (newTimeText !== oldTimeText) {
        signals.setMyTime(newTimeText);
        oldTimeText = newTimeText;
      }
    },
    second / 10
  );

  var oldDateText = "";
  let dateInterval = setInterval(
    () => {
      const newDateText = getDateText(signals);
      if (newDateText !== oldDateText) {
        signals.setMyDate(newDateText);
        oldDateText = newDateText;
      }
    },
    second
  );

  onCleanup(() => {
    clearInterval(timeInterval);
    clearInterval(dateInterval);
    removeDataCallback(cbName);
  });

  return <>
    <Show when={isUnknownLayout(signals)}>
      <div class="system-error">Unknown layout: {signals.layout}</div>
      <Loading />
    </Show>
    <Show when={isSevenInchLayout(signals)}>
      <HomeSevenInch signals={signals} />
    </Show>
    <Show when={isPlannerLayout(signals)}>
      <HomePlanner signals={signals} />
    </Show>
    <Show when={isSmallLayout(signals)}>
      <HomeSmall signals={signals} />
    </Show>
  </>
};