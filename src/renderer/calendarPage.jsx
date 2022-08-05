import { createSignal } from 'solid-js';
import { addClockDataCallback } from './ipc';

class CalendarPageSignals {
  constructor() {
  }
}

function updateCalendarPageSignals(signals, data) {

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