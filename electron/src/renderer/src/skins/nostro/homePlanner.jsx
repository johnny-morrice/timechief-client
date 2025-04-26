import { CurrentWeather } from './currentWeather';
import { SwitcherWidget } from './switcherWidget';
import { DeviceControl } from './deviceControl';
import { Astro } from './astro';
import { DeviceInfo } from './deviceInfo';
import { Locale } from './locale';
import { Forecast } from './forecast';
import { EventCalendar } from './eventCalendar';
import { SSHSecurity } from './sshSecurity';
import { APISecurity } from './apiSecurity';
import { Debug } from './debugPanel';
import { For, Show, createSignal, onCleanup } from 'solid-js';
import { CalendarEvent, makeCanonicalDateText } from '../../util/calendarEvent';
import { Loading } from './loading';
import { addServiceDataCallback, removeDataCallback } from './ipc';
import { callbackName } from '../../util/callback';
import { ActionCenter } from './actionCenter';
import { fadeTransition } from './fadeTransition';


class PlannerSignals {
    constructor() {
        [this.isDayView, this.setIsDayView] = createSignal(false);
        [this.selectedDay, this.setSelectedDay] = createSignal(null);
        [this.monthDelta, this.setMonthDelta] = createSignal(0);
        [this.plannerDayEventCount, this.setPlannerDayEventCount] = createSignal(0);
        [this.plannerTransition, this.setPlannerTransition] = createSignal("no-transition");
    }
}

function getTimeZone(signals) {
    let tz = signals.timeZone();
    if (tz) {
        return tz;
    }
    return "Europe/London";
}


function getLocale(signals) {
    const locale = signals.locale();
    if (!locale) {
        return "en-GB";
    }
    return locale;
}

// daysOfWeek gets the days of the week in appropriate order for the locale.
function daysOfWeek(signals) {
    // dateFormatter is a Intl.DateTimeFormat
    const dayOfWeekFormatter = signals.dayOfWeekFormatter();
    const locale = signals.locale();
    // List of locales where the week starts on Sunday
    const sundayStartLocales = ['en-US', 'ca', 'jp', 'ph', 'za', 'au', 'eg', 'sa', 'th'];
    // Get days of week in order.  For example in North America it starts on Sunday but in most of the rest of world it starts Monday.
    const daysOfWeekStartingMonday = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(2024, 6, i + 1);
        daysOfWeekStartingMonday.push({
            text: dayOfWeekFormatter.format(date),
            number: date.getDay(),
        });
    }
    if (sundayStartLocales.includes(locale)) {
        const sundayStartDaysOfWeek = daysOfWeekStartingMonday.slice(-1).concat(daysOfWeekStartingMonday.slice(0, -1));
        return sundayStartDaysOfWeek;
    }
    return daysOfWeekStartingMonday;
}

function eventDays(signals, plannerSignals) {
    const myCalendarDays = calendarDays(signals, plannerSignals);
    const rawEvents = signals.googleCalendarEvents();
    const dayMap = new Map();
    for (let i = 0; i < myCalendarDays.length; i++) {
        const myCalendarDay = myCalendarDays[i];
        const canonicalDate = makeCanonicalDateText(myCalendarDay.date, signals.timeZone());
        dayMap.set(canonicalDate, myCalendarDay);
    }
    for (let i = 0; i < rawEvents.length; i++) {
        const rawEvent = rawEvents[i];
        const calendarEvent = new CalendarEvent(rawEvent);
        const day = dayMap.get(calendarEvent.canonicalStartDateText(signals.timeZone()));
        if (!day) {
            continue;
        }
        if (!day.events) {
            day.events = [];
        }
        day.events.push(calendarEvent);

    }
    for (let i = 0; i < myCalendarDays.length; i++) {
        const myCalendarDay = myCalendarDays[i];
        if (myCalendarDay.events === undefined) {
            myCalendarDay.events = [];
        }
    }
    return myCalendarDays;
}

function calendarDays(signals, plannerSignals) {
    // We are looking for 5 weeks of days.
    // The days of the week are in locale order, e.g. in UK Monday, Tuesday, ...
    // We want to start the calendar on the appropriate day of the week given that months obviously
    // do not always start on a Monday.
    // We want to use the previous and next month for the overlapping days.
    const myDaysOfWeek = daysOfWeek(signals);
    const currentMonth = getDateAtMonth(plannerSignals);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Determine the day of the week the first day of the month falls on
    // 0 always represents Sunday.
    // myDaysOfWeek is in locale order.
    const startDayOfWeek = firstDayOfMonth.getDay();
    const localeStartDayOfWeek = myDaysOfWeek.findIndex((day) => day.number === startDayOfWeek);

    // Determine the number of days in the current month
    const daysInMonth = lastDayOfMonth.getDate();

    // Calculate the number of days from the previous month to display
    const daysFromPrevMonth = (localeStartDayOfWeek - myDaysOfWeek.indexOf(myDaysOfWeek[0]) + 7) % 7;

    // Calculate the number of days from the next month to display
    const totalDays = 35; // 5 weeks * 7 days
    const daysFromNextMonth = totalDays - (daysFromPrevMonth + daysInMonth);

    const calendarDays = [];

    // Add days from the previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        const date = new Date(year, month, -i);
        calendarDays.push({
            date: date,
            isCurrentMonth: false,
            isToday: false,
        });
    }

    const now = new Date();
    // Add days from the current month
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const isToday = date.year === now.year && date.month === now.month && date.day === now.day;
        calendarDays.push({
            date: date,
            isCurrentMonth: true,
            isToday: isToday,
        });
    }

    // Add days from the next month
    for (let i = 1; i <= daysFromNextMonth; i++) {
        const date = new Date(year, month + 1, i);
        calendarDays.push({
            date: date,
            isCurrentMonth: false,
            isToday: false,
        });
    }

    return calendarDays;
}

function getDateAtMonth(plannerSignals) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + plannerSignals.monthDelta();
    return new Date(year, month, 1);
}

function PlannerEvent(props) {
    const event = props.event;
    const signals = props.signals;
    const locale = getLocale(signals);
    const timeZone = getTimeZone(signals);
    return <>
        <Show when={event.isAllDay()}>
            <div class="planner-event-time">All day</div>
            <div class="planner-event-short-text planner-event-all-day">{event.eventShortText()}</div>
        </Show>
        <Show when={!event.isAllDay()}>
            <div class="planner-event-time">{event.formatStartTime(locale, timeZone)} - {event.formatEndTime(locale, timeZone)}</div>
            <div class="planner-event-short-text">{event.eventShortText()}</div>
        </Show>
    </>
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + "...";
}

function PlannerEventSummary(props) {
    const event = props.event;
    const signals = props.signals;
    const locale = getLocale(signals);
    const timeZone = getTimeZone(signals);
    const textLength = 9;
    return <div class="planner-event-summary">
        <Show when={event.isAllDay()}>
            <span class="planner-event-summary-time">All day: </span>
            <span class="planner-event-summary-short-text planner-event-summary-all-day">{truncateText(event.eventShortText(), textLength)}</span>
        </Show>
        <Show when={!event.isAllDay()}>
            <span class="planner-event-summary-time">{event.formatStartTime(locale, timeZone)} - {event.formatEndTime(locale, timeZone)}</span>
            <span class="planner-event-summary-short-text">{truncateText(event.eventShortText(), textLength)}</span>
        </Show>
    </div>
}

function DayView(props) {
    const day = props.day;
    if (day === null) {
        return <Loading />;
    }
    const signals = props.signals;
    const plannerSignals = props.plannerSignals;

    function onClickBack(e) {
        fadeTransition(plannerSignals.setPlannerTransition, () => {
            plannerSignals.setIsDayView(false);
            plannerSignals.setSelectedDay(null);
        });
    }

    return <div class="planner-day-view flex-column">
        <div class="planner-day-view-header">
            <div class="planner-day-date">{signals.dateFormatter().format(day.date)} <button class="action-button" onClick={onClickBack}><i class="fa-solid fa-backward"></i></button></div>
        </div>
        <div class="planner-day-events flex-column border">
            <For each={day.events}>{(event) => (
                <PlannerEvent event={event} signals={signals} />
            )}</For>
        </div>
    </div>
}

function PlannerDateCell(props) {
    const day = props.day;
    const signals = props.signals;
    const plannerSignals = props.plannerSignals;
    function onClickCell(e) {
        if (day.events.length === 0) {
            return;
        }

        fadeTransition(plannerSignals.setPlannerTransition, () => {
            plannerSignals.setSelectedDay(day);
            plannerSignals.setIsDayView(true);
        });
    }
    function isShowSummary(day, myPlannerSignals) {
        return day.events.length > 0 && myPlannerSignals.plannerDayEventCount() === 0;
    }
    function isShowEvents(day, myPlannerSignals) {
        return day.events.length > 0 && myPlannerSignals.plannerDayEventCount() > 0;
    }
    function isShowRemainingEvents(day, myPlannerSignals) {
        return isShowEvents(day, myPlannerSignals) && day.events.length > myPlannerSignals.plannerDayEventCount();
    }
    function getShownEvents(day, myPlannerSignals) {
        let eventCount = myPlannerSignals.plannerDayEventCount();
        if (day.events.length <= eventCount) {
            return day.events;
        }
        return day.events.slice(0, eventCount);
    }

    return <div class="planner-date-cell" onClick={onClickCell}>
        <div>{signals.dayOfMonthFormatter().format(day.date)}</div>
        <div class="planner-date-cell-events flex-column">
            <Show when={isShowSummary(day, plannerSignals)}>
                <div class="planner-event-count">{day.events.length} events</div>
            </Show>
            <Show when={isShowEvents(day, plannerSignals)}>
                <div class="planner-event-summary flex-column">
                    <For each={getShownEvents(day, plannerSignals)}>{(event) => (
                        <PlannerEventSummary signals={signals} plannerSignals={plannerSignals} event={event} />
                    )}
                    </For>
                </div>
            </Show>
            <Show when={isShowRemainingEvents(day, plannerSignals)}>
                <div class="planner-event-count">+{day.events.length - plannerSignals.plannerDayEventCount()} more</div>
            </Show>
        </div>
    </div>
}

function updateSignals(plannerSignals, data) {
    const deviceProfileWrapper = data["device_profile"];
    if (!deviceProfileWrapper) {
        return;
    }

    const deviceProfile = deviceProfileWrapper["value"];
    if (!deviceProfile) {
        return;
    }

    const theme = deviceProfile["theme"];
    if (!theme) {
        return;
    }

    const plannerDayEventCount = theme["planner_day_event_count"];
    plannerSignals.setPlannerDayEventCount(plannerDayEventCount);
}

export function HomePlanner(props) {
    const plannerSignals = new PlannerSignals();
    const signals = props.signals;

    const cbName = callbackName("HomePlanner");
    addServiceDataCallback(cbName, (data) => updateSignals(plannerSignals, data));
    onCleanup(() => removeDataCallback(cbName));

    const switcherWidgets = [
        { icon: () => <i class="fa-solid fa-cloud-sun"></i>, element: () => <CurrentWeather /> },
        { icon: () => <i class="fa-solid fa-gear"></i>, element: () => <DeviceControl /> },
        { icon: () => <i class="fa-solid fa-network-wired"></i>, element: () => <DeviceInfo /> },
        { icon: () => <i class="fa-brands fa-linux"></i>, element: () => <SSHSecurity /> },
        { icon: () => <i class="fa-solid fa-house-laptop"></i>, element: () => <APISecurity /> },
        { icon: () => <i class="fa-solid fa-earth-americas"></i>, element: () => <Locale /> },
        { icon: () => <i class="fa-solid fa-moon"></i>, element: () => <Astro /> },
        { icon: () => <i class="fa-solid fa-mountain-sun"></i>, element: () => <Forecast /> },
        { icon: () => <i class="fa-solid fa-calendar-days"></i>, element: () => <EventCalendar /> },
    ];

    const useDebug = false;
    if (useDebug) {
        switcherWidgets.push(
            { icon: () => <i class="fa-solid fa-fire"></i>, element: () => <Debug /> },
        )
    }

    const onClickNextMonth = (e) => {
        fadeTransition(plannerSignals.setPlannerTransition, () => {
            plannerSignals.setMonthDelta(plannerSignals.monthDelta() + 1);
        });
    }

    const onClickPrevMonth = (e) => {
        fadeTransition(plannerSignals.setPlannerTransition, () => {
            plannerSignals.setMonthDelta(plannerSignals.monthDelta() - 1);
        });
    }

    return <div class="home-screen flex-row">
        <SwitcherWidget widgets={switcherWidgets} />
        <div id="date-time" class="home-time-wrapper flex-grow">
            <div class="home-time">{signals.myTime}</div>
            <div class="home-date">{signals.myDate}</div>
        </div>

        <ActionCenter signals={signals} />
        <div id="planner" class={plannerSignals.plannerTransition()}>
            <Show when={!plannerSignals.isDayView()}>
                <div class="planner-header">
                    <h2 class="planner-current-month">
                        <button class="action-button" onClick={onClickPrevMonth}><i class="fa-solid fa-backward"></i></button>
                        &nbsp;
                        {signals.calendarMonthFormatter().format(getDateAtMonth(plannerSignals))}
                        &nbsp;
                        <button class="action-button" onClick={onClickNextMonth}><i class="fa-solid fa-forward"></i></button>
                    </h2>
                </div>
                <div class="planner-grid">
                    { /* Note days of week are locale dependent.*/}
                    <For each={daysOfWeek(signals)}>{(day) => (
                        <div class="planner-dow">{day.text}</div>
                    )}</For>
                    <For each={eventDays(signals, plannerSignals)}>{(calendarDay) => (
                        <PlannerDateCell day={calendarDay} signals={signals} plannerSignals={plannerSignals} />
                    )}</For>
                </div>
            </Show>
            <Show when={plannerSignals.isDayView()}>
                <DayView day={plannerSignals.selectedDay()} signals={signals} plannerSignals={plannerSignals} />
            </Show>
        </div>
    </div>
}