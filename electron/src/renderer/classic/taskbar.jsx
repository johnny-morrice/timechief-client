import { onCleanup } from 'solid-js';
import { createSignal } from 'solid-js';
import { isCalendarExists } from '../calendarHelper';
import { addServiceDataCallback } from './ipc';
import { showHome, showAstro, showDevice, showForecast, showAccount, showLocale, showCalendar } from './routes';

class TaskBarSignals {
    constructor() {
        [this.isCalendarExists, this.setCalendarExists] = createSignal(false);
    }
}

function updateTaskBarSignals(signals, data) {
    let calExists = isCalendarExists(data);
    signals.setCalendarExists(calExists);
}

var initialised = false;
let taskBarSignals = new TaskBarSignals();

export const TaskBar = () => {
    if (!initialised) {
        addServiceDataCallback((data) => updateTaskBarSignals(taskBarSignals, data));
        initialised = true;
    }

    return <div id="taskbar">
        <div class="row-flex">
            <div class='flex-element'>
                <button class='nav-button crt-box' onClick={showHome}><i class="fa-solid fa-home"></i></button>
            </div>
            <div class='flex-element'>
                <button class='nav-button crt-box' onClick={showForecast}><i class="fa-solid fa-cloud-sun"></i></button>
            </div>
            <Show when={taskBarSignals.isCalendarExists()}>
                <div class='flex-element'>
                    <button class='nav-button crt-box' onClick={showCalendar}><i class="fa-solid fa-calendar-days"></i></button>
                </div>
            </Show>
            <div class='flex-element'>
                <button class='nav-button crt-box' onClick={showAstro}><i class="fa-solid fa-moon"></i></button>
            </div>
            <div class='flex-element'>
                <button class='nav-button crt-box' onClick={showAccount}><i class="fa-solid fa-user"></i></button>
            </div>
            <div class='flex-element'>
                <button class='nav-button crt-box' onClick={showDevice}><i class="fa-solid fa-microchip"></i></button>
            </div>
            <div class='flex-element'>
                <button class='nav-button crt-box' onClick={showLocale}><i class="fa-solid fa-earth-americas"></i></button>
            </div>
        </div>
    </div>;
};