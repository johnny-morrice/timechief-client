import { createSignal } from 'solid-js';
import { CalendarEvent, makeCanonicalDateText } from './calendarEvent';
import { addClockDataCallback } from './ipc';
import { day } from './timing';

class CalendarPageSignals {
  constructor() {
    [this.calendarDays, this.setCalendarDays] = createSignal([]);
    [this.locale, this.setLocale] = createSignal("");
    [this.timeZone, this.setTimeZone] = createSignal("");
  }
}

function updateCalendarPageSignals(signals, data) {
  let calendarResp = data["Calendar"];
  if ("Calendar" in calendarResp) {
    let calendar = calendarResp["Calendar"];
    let events = calendar["Events"].map(cev => new CalendarEvent(cev));
    let calendarDays = new CalendarDays();
    events.forEach(calendarDays.addNewEvent);
    let ourCalendar = calendarDays.nextDays(5);
    signals.setCalendarDays(ourCalendar);
  }
  let clock = data["Clock"];
  signals.setLocale(clock["Locale"]);
  signals.setTimeZone(clock["Timezone"]);
}

function isCalendarDaysExists(signals) {
  return new Boolean(signals.calendarDays());
}

function cmpDate(a, b) {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else {
    return 0;
  }
}

function formatCalendarDayDate(signals, day) {
  return day.formatDate(signals.locale(), signals.timeZone());
}

class CalendarDay {
  constructor(calendarEvents) {
    if (calendarEvents.length == 0) {
      throw new Error("expected non empty calendarEvents");
    }
    this._calendarEvents = calendarEvents
  }

  date() {
    return this.calendarEvents[0].startTime();
  }

  formatDate(locale, timeZone) {
    return this.date().toLocaleDateString(locale, {dateStyle: 'short', timeZone: timeZone});
  }

  events() {
    return this._calendarEvents;
  }
}

class CalendarDays {

  constructor() {
    this._dirty = true;
    this._days = {};
  }

  nextDays(n) {
    let now = new Date();
    let dates = [now];
    for (var i = 1; i < n; i++) {
      let nextDate = new Date();
      nextDate.setTime(nextDate.getTime() + day);
      dates.push(nextDate);
    }
    let allDays = this._allDays();
    let canonicalDates = dates.map(makeCanonicalDateText);
    let out = [];
    canonicalDates.forEach(text => {
      let events = allDays[text];
      if (events) {
        out.push(new CalendarDay(events));
      }
    });
    return out;
  }

  _allDays() {
    if (this._dirty) {
      for (let [_, day] of Object.entries(this._days)) {
        day.sort((a, b) => {
          if (a.isAllDay() && b.isAllDay()) {
            return 0;
          } else if (a.isAllDay() && !b.isAllDay()) {
            return 1;
          } else if (!a.isAllDay() && b.isAllDay()) {
            return -1;
          } else {
            return cmpDate(a.startTime(), b.startTime());
          }
        });
      }
      this._dirty = false;
    }
    return this._days;
  }

  addNewEvent(event) {
    this._dirty = true;
    let canonicalDate = event.canonicalStartDateText();
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


var initialised = false;
let calendarSignals = new CalendarPageSignals();
export const CalendarPage = () => {
  
  if (!initialised) {
    addClockDataCallback((data) => updateCalendarPageSignals(calendarSignals, data));
    initialised = true;
  }

  return <div id="calendar-screen">
        <div class="column-flex">
          <Show when={!isCalendarDaysExists(calendarSignals)}>
            <div class="no-calendar-events-message">No calendar events</div>
          </Show>
          <Show when={isCalendarDaysExists(calendarSignals)}>
            <For each={signals.getCalendarDays()}>{(day, i) => 
              <div class="calendar-day">
                <div class="calendar-day-date">{formatCalendarDayDate(calendarSignals, day)}</div>
                <div class="calendar-events">
                  <For each={day.events()}>{(cev, j) =>
                  <div class="calendar-event-when">
                    <Show when={cev.isAllDay()}>
                      <div class="calendar-event-allday-date">All day {formatCalendarEventStartTime(calendarSignals, cev)}</div>
                    </Show>
                    <Show when={!cev.isAllDay()}>
                      <div class="calendar-event-datetimes">{formatCalendarEventStartTime(calendarSignals, cev)} - {formatCalendarEventEndTime(calendarSignals, cev)}</div>
                    </Show>
                    <div class="calendar-event-shorttext">{cev.eventShortText()}</div>
                  </div>
                }</For>
                </div>      
              </div>
            }</For>
          </Show>
        </div>
  </div>;
};