import { createSignal } from 'solid-js';
import { makeCanonicalDateText } from './calendarEvent';
import { addClockDataCallback } from './ipc';
import { day } from './timing';

class CalendarPageSignals {
  constructor() {
  }
}

function updateCalendarPageSignals(signals, data) {

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
    let allDays = this.allDays();
    let canonicalDates = dates.map(makeCanonicalDateText);
    return canonicalDates.map(text => allDays[text]);
  }

  allDays() {
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

var initialised = false;
let calendarSignals = new CalendarPageSignals();
export const CalendarPage = () => {
  
  if (!initialised) {
    addClockDataCallback((data) => updateCalendarPageSignals(calendarSignals, data));
    initialised = true;
  }

  return <div id="calendar-screen">
        <div class="column-flex">
        </div>
  </div>;
};