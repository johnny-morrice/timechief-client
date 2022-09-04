import { createSignal } from 'solid-js';
import { CalendarEvent, makeCanonicalDateText, sortCalendarEvents } from './calendarEvent';
import { addClockDataCallback } from './ipc';
import { day } from './timing';

class CalendarPageSignals {
  constructor() {
    [this.calendarDays, this.setCalendarDays] = createSignal([]);
    [this.locale, this.setLocale] = createSignal("en-GB");
    [this.timeZone, this.setTimeZone] = createSignal("Europe/London");
  }
}

function updateCalendarPageSignals(signals, data) {
  let calendarResp = data["Calendar"];
  if ("Calendar" in calendarResp && calendarResp["Calendar"] != null) {
    let calendar = calendarResp["Calendar"];
    if ("Events" in calendar) {
      let dataEvents = calendar["Events"];
      if (dataEvents) {
        let events = dataEvents.map(cev => new CalendarEvent(cev));
        let calendarDays = new CalendarDays();
        events.forEach(cev => calendarDays.addNewEvent(cev));
        let ourCalendar = calendarDays.nextEvents(30, 3);
        // console.log(`our calendar: ${JSON.stringify(ourCalendar)}`);
        signals.setCalendarDays(ourCalendar);
      }
    }
  }
  let clock = data["Clock"];
  signals.setLocale(clock["Locale"]);
  signals.setTimeZone(clock["Timezone"]);
}

function isCalendarDaysExists(signals) {
  let days = signals.calendarDays();
  return days.length > 0;
}

function getCalendarDays(signals) {
  return signals.calendarDays();
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
    return this._calendarEvents[0].startTime();
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
    let canonicalDates = dates.map(d => makeCanonicalDateText(d));
    let out = [];
    var eventCount = 0;
    canonicalDates.forEach(text => {
      if (eventCount < eventLimit) {
        var events = allDays[text];
        if (events) {
          var exceeds = (eventCount + events.length) - eventLimit;
          if (exceeds > 0) {
            events = events.slice(0, exceeds);
          }
          out.push(new CalendarDay(events));
          eventCount += events.length;
        }
      }
    });
    return out;
  }

  _allDays() {
    for (let [_, day] of Object.entries(this._days)) {
      sortCalendarEvents(day);
    }
    return this._days;
  }

  addNewEvent(event) {
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
            <For each={getCalendarDays(calendarSignals)}>{(day, i) => 
              <div class="calendar-day">
                <div class="calendar-day-date">{formatCalendarDayDate(calendarSignals, day)}</div>
                <div class="calendar-events">
                  <For each={day.events()}>{(cev, j) =>
                  <div class="calendar-event-wrapper">
                    <div class="calendar-event-when">
                      <Show when={cev.isAllDay()}>
                        <div class="calendar-event-allday-date">{formatCalendarEventStartTime(calendarSignals, cev)}</div>
                      </Show>
                      <Show when={!cev.isAllDay()}>
                        <div class="calendar-event-datetimes">{formatCalendarEventStartTime(calendarSignals, cev)} - {formatCalendarEventEndTime(calendarSignals, cev)}</div>
                      </Show>
                    </div>
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