import { createSignal, onCleanup } from 'solid-js';
import { CalendarEvent, makeCanonicalDateText, sortCalendarEvents } from '../calendarEvent';
import { addServiceDataCallback, removeDataCallback } from './ipc';
import { day } from '../timing';
import { callbackName } from './callback';
import { Loading } from './loading';
import { labelMaker, textMaker } from './label';

class Signals {
  constructor() {
    [this.calendarDays, this.setCalendarDays] = createSignal([]);
    [this.loaded, this.setLoaded] = createSignal(false);
    [this.locale, this.setLocale] = createSignal("en-GB");
    [this.timeZone, this.setTimeZone] = createSignal("Europe/London");
    [this.dayIndex, this.setDayIndex] = createSignal(0);
  }
}

function updateSignals(signals, data) {
  let clock = data["Clock"];
  signals.setLocale(clock["Locale"]);
  const tz = clock["Timezone"]
  signals.setTimeZone(tz);
  signals.setLoaded(true);
  let calendarResp = data["Calendar"];
  if ("Calendar" in calendarResp && calendarResp["Calendar"] != null) {
    let calendar = calendarResp["Calendar"];
    if ("Events" in calendar) {
      let dataEvents = calendar["Events"];
      if (dataEvents) {
        let events = dataEvents.map(cev => new CalendarEvent(cev));
        let calendarDays = new CalendarDays(tz);
        events.forEach(cev => calendarDays.addNewEvent(cev));
        let ourCalendar = calendarDays.nextEvents(30, 3);
        // console.log(`our calendar: ${JSON.stringify(ourCalendar)}`);
        signals.setCalendarDays(ourCalendar);
      }
    }
  }

}


function formatCalendarDayDate(signals, day) {
  return day.formatDate(signals.locale(), signals.timeZone());
}

function formatShortDate(signals, day) {
  return day.shortDate(signals.locale(), signals.timeZone());
}

function formatDayOfWeek(signals, day) {
  return day.dayOfWeek(signals.locale(), signals.timeZone());
}

class CalendarDay {
  constructor(calendarEvents) {
    if (calendarEvents.length == 0) {
      throw new Error("expected non empty calendarEvents");
    }
    this._calendarEvents = calendarEvents
    this._laterEventsNotShown = false;
  }

  date() {
    return this._calendarEvents[0].startTime();
  }

  dayOfWeek(locale, timeZone) {
    // format using day of week only
    return this.date().toLocaleDateString(locale, { weekday: 'short', timeZone: timeZone });
  }

  shortDate(locale, timeZone) {
    // format using day of week and day of month
    return this.date().toLocaleDateString(locale, { weekday: 'short', day: 'numeric', timeZone: timeZone });
  }

  formatDate(locale, timeZone) {
    return this.date().toLocaleDateString(locale, { dateStyle: 'short', timeZone: timeZone });
  }

  events() {
    return this._calendarEvents;
  }

  setLaterEventsNotShown(NotShown) {
    this._laterEventsNotShown = NotShown;
  }

  hasLaterEventsNotShown() {
    return this._laterEventsNotShown;
  }
}

class NullCalendarDay {
  date() {
    return new Date();
  }
  formatDate(locale, timeZone) {
    return "";
  }
  events() {
    return [];
  }
}


class CalendarDays {

  constructor(timezone) {
    this.timezone = timezone
    this._days = {};
  }

  nextEvents(dayLimit, eventLimit) {
    let now = new Date();
    let dates = [now];
    for (var i = 1; i < dayLimit; i++) {
      let nextDate = new Date();
      nextDate.setTime(nextDate.getTime() + (day * i));
      dates.push(nextDate);
    }
    let allDays = this._allDays();
    let canonicalDates = dates.map(d => makeCanonicalDateText(d, this.timezone));
    let out = [];
    canonicalDates.forEach(dateText => {
      const events = allDays[dateText];
      if (events) {
        const eventsUpTolimit = events.slice(0, eventLimit);
        const calendarDay = new CalendarDay(eventsUpTolimit)
        calendarDay.setLaterEventsNotShown(events.length > eventLimit);
        out.push(calendarDay);
      }
    });
    return out;
  }

  _allDays() {
    for (let [_, day] of Object.entries(this._days)) {
      sortCalendarEvents(day, this.timezone);
    }
    return this._days;
  }

  addNewEvent(event) {
    let canonicalDate = event.canonicalStartDateText(this.timezone);
    if (canonicalDate in this._days) {
      this._days[canonicalDate].push(event);
    } else {
      this._days[canonicalDate] = [event];
    }
  }
}

function formatCalendarEventStartTime(signals, calendarEvent) {
  return calendarEvent.formatStartTime(signals.locale(), signals.timeZone());
}

function formatCalendarEventEndTime(signals, calendarEvent) {
  return calendarEvent.formatEndTime(signals.locale(), signals.timeZone());
}


export const EventCalendar = () => {
  let signals = new Signals();
  const cbName = callbackName("EventCalendar");
  addServiceDataCallback(cbName, (data) => updateSignals(signals, data));
  onCleanup(() => removeDataCallback(cbName));

  function getCurrentDay() {
    const dayIndex = signals.dayIndex();
    const days = signals.calendarDays();
    if (dayIndex < days.length) {
      return days[dayIndex];
    }
    return new NullCalendarDay();
  }

  function hasDay() {
    const dayCount = signals.calendarDays().length;
    return dayCount > 0;
  }

  function hasMultipleDays() {
    const dayCount = signals.calendarDays().length;
    return dayCount > 1;
  }

  function hasPrevDay() {
    const dayIndex = signals.dayIndex();
    return dayIndex > 0;
  }

  function hasNextDay() {
    const dayIndex = signals.dayIndex();
    const dayCount = signals.calendarDays().length;
    return dayIndex < dayCount - 1;
  }

  function onClickPrev() {
    if (hasPrevDay()) {
      const dayIndex = signals.dayIndex();
      signals.setDayIndex(dayIndex - 1);
    }
  }

  function onClickNext() {
    if (hasNextDay()) {
      const dayIndex = signals.dayIndex();
      signals.setDayIndex(dayIndex + 1);
    }
  }

  function getPrevDay() {
    if (hasPrevDay()) {
      const dayIndex = signals.dayIndex();
      const days = signals.calendarDays();
      if (dayIndex < days.length) {
        return days[dayIndex - 1];
      }
    }
    return new NullCalendarDay();
  }

  function getNextDay() {
    if (hasNextDay()) {
      const dayIndex = signals.dayIndex();
      const days = signals.calendarDays();
      if (dayIndex < days.length) {
        return days[dayIndex + 1];
      }
    }
    return new NullCalendarDay();
  }

  const label = labelMaker("event-calendar");
  const plainText = textMaker("event-calendar");
  return <div id="calendar-screen">
    <Show when={!signals.loaded()}>
      <Loading />
    </Show>
    <Show when={signals.loaded()}>
      <div class="flex-column flex-grow">
        <Show when={!hasDay(signals)}>
          <div class="data-label">{label("no-events")}</div>
        </Show>
        <Show when={hasMultipleDays(signals)}>
          <div class="event-calendar-day-controls">
            <Show when={hasPrevDay()}>
              <div class="event-calendar-day-prev-button-wrapper">
                <button class="event-calendar-control-button event-calendar-day-prev-button" onClick={onClickPrev}><i class="fa-solid fa-chevron-left"></i> {formatDayOfWeek(signals, getPrevDay())}</button>
              </div>
            </Show>
            <Show when={!hasPrevDay()}>
              <div class="event-calendar-day-prev-button-wrapper event-calendar-day-prev-button-disabled">
              </div>
            </Show>
            <div class="event-calendar-control-label event-calendar-date">{formatShortDate(signals, getCurrentDay())}</div>
            <Show when={hasNextDay()}>
              <div class="event-calendar-day-next-button-wrapper">
                <button class="event-calendar-control-button event-calendar-day-next-button" onClick={onClickNext}>{formatDayOfWeek(signals, getNextDay())} <i class="fa-solid fa-chevron-right"></i></button>
              </div>
            </Show>
          </div>
        </Show>
        <Show when={hasDay(signals)}>
          <div class="calendar-day flex-column flex-grow">
            <div class="calendar-day-date flex-grow">{plainText("func-events-on", formatCalendarDayDate(signals, getCurrentDay()))}</div>
            <div class="calendar-events flex-column flex-grow">
              <For each={getCurrentDay().events()}>{(cev, j) =>
                <div class="calendar-event-wrapper flex-column flex-grow">
                  <div class="calendar-event-when flex-grow">
                    <Show when={cev.isAllDay()}>
                      <div class="calendar-event-allday-date flex-grow"><i class="fa-solid fa-calendar-day"></i> {formatCalendarEventStartTime(signals, cev)}</div>
                    </Show>
                    <Show when={!cev.isAllDay()}>
                      <div class="calendar-event-datetimes flex-grow"><i class="fa-solid fa-calendar-day"></i> {formatCalendarEventStartTime(signals, cev)} - {formatCalendarEventEndTime(signals, cev)}</div>
                    </Show>
                  </div>
                  <div class="calendar-event-shorttext flex-grow">{cev.eventShortText()}</div>
                </div>
              }</For>
              <Show when={getCurrentDay().hasLaterEventsNotShown()}>
                <div class="calendar-later-events-not-included flex-grow">
                  {label("more-events-not-shown")}
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  </div>;
};