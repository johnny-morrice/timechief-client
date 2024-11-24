import { CurrentWeather } from './currentWeather';
import { StatusNote } from './statusNote';
import { SwitcherWidget } from './switcherWidget';
import { DeviceControl } from './deviceControl';
import { Astro } from './astro';
import { Fortune } from './fortune';
import { DeviceInfo } from './deviceInfo';
import { Locale } from './locale';
import { Forecast } from './forecast';
import { EventCalendar } from './eventCalendar';
import { SSHSecurity } from './sshSecurity';
import { APISecurity } from './apiSecurity';
import { Debug } from './debugPanel';
import { For } from 'solid-js';
import { CalendarEvent, makeCanonicalDateText } from '../calendarEvent';


function getNextEventStartTime(signals) {
    const nextEvent = signals.nextEvent();
    if (!nextEvent) {
        return "";
    }
    return nextEvent.formatStartTime(getLocale(signals), getTimeZone(signals));
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

function eventDays(signals) {
    const myCalendarDays = calendarDays(signals);
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

function calendarDays(signals) {
    // We are looking for 5 weeks of days.
    // The days of the week are in locale order, e.g. in UK Monday, Tuesday, ...
    // We want to start the calendar on the appropriate day of the week given that months obviously
    // do not always start on a Monday.
    // We want to use the previous and next month for the overlapping days.
    const myDaysOfWeek = daysOfWeek(signals);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

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

function PlannerEvent(props) {
    const event = props.event;
    const signals = props.signals;
    const locale = getLocale(signals);
    const timeZone = getTimeZone(signals);
    return <>
        <Show when={event.isAllDay()}>
            <div class="planner-event-short-text planner-event-all-day">{event.eventShortText()}</div>
        </Show>
        <Show when={!event.isAllDay()}>
            <div class="planner-event-time">{event.formatStartTime(locale, timeZone)} - {event.formatEndTime(locale, timeZone)}</div>
            <div class="planner-event-short-text">{event.eventShortText()}</div>
        </Show>
    </>
}

function PlannerDateCell(props) {
    const day = props.day;
    const signals = props.signals;
    return <div class="planner-date-cell">
        <div class="flex-column">
            <Show when={day.events.length > 0}>
                <div>{signals.dayOfMonthFormatter().format(day.date)}: <span class="planner-event-count">{day.events.length}</span></div>
            </Show>
            <Show when={day.events.length === 0}>
                <div>{signals.dayOfMonthFormatter().format(day.date)}</div>
            </Show>
            <For each={day.events}>{(event) => (
                <PlannerEvent event={event} signals={signals} />
            )}</For>
        </div>
    </div>
}

export function HomePlanner(props) {
    const signals = props.signals;
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

    return <div class="home-screen flex-row">
        <div class="home-lhs-column flex-column flex-grow">
            <SwitcherWidget widgets={switcherWidgets} />
        </div>
        <div class='home-rhs-column flex-column flex-grow'>
            <div id="date-time" class="home-time-wrapper flex-grow">
                <div class="home-time">{signals.myTime}</div>
                <div class="home-date">{signals.myDate}</div>
            </div>

            <div id="action-center" class="home-action-center flex-grow border crt-box home-box">
                <div id="home-action-center-content" className={`flex-row flex-grow ${signals.actionCentreTransition()}`}>
                    <StatusNote />
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
                </div>
            </div>
        </div>
        <div id="planner">
            <div class="planner-header">
                <h2 class="planner-current-month">{signals.calendarMonthFormatter().format(new Date())}</h2>
            </div>
            <div class="planner-grid">
                { /* Note days of week are locale dependent.*/}
                <For each={daysOfWeek(signals)}>{(day) => (
                    <div class="planner-dow">{day.text}</div>
                )}</For>
                <For each={eventDays(signals)}>{(calendarDay) => (
                    <PlannerDateCell day={calendarDay} signals={signals} />
                )}</For>
            </div>
        </div>
    </div>
}