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
import { ActionCenter } from './actionCenter';

export function HomeSevenInch(props) {
    const signals = props.signals;
    const switcherWidgets = [
        { name: "Current Weather", icon: () => <i class="fa-solid fa-cloud-sun"></i>, element: () => <CurrentWeather /> },
        { name: "Device Control", icon: () => <i class="fa-solid fa-gear"></i>, element: () => <DeviceControl /> },
        { name: "Device Information", icon: () => <i class="fa-solid fa-network-wired"></i>, element: () => <DeviceInfo /> },
        { name: "SSH Security", icon: () => <i class="fa-brands fa-linux"></i>, element: () => <SSHSecurity /> },
        { name: "API Security", icon: () => <i class="fa-solid fa-house-laptop"></i>, element: () => <APISecurity /> },
        { name: "Language and locale", icon: () => <i class="fa-solid fa-earth-americas"></i>, element: () => <Locale /> },
        { name: "Astronomy", icon: () => <i class="fa-solid fa-moon"></i>, element: () => <Astro /> },
        { name: "Forecast", icon: () => <i class="fa-solid fa-mountain-sun"></i>, element: () => <Forecast /> },
        { name: "Calendar", icon: () => <i class="fa-solid fa-calendar-days"></i>, element: () => <EventCalendar /> },
    ];

    const useDebug = false;
    if (useDebug) {
        switcherWidgets.push(
            { icon: () => <i class="fa-solid fa-fire"></i>, element: () => <Debug /> },
        )
    }

    return <div class="home-screen flex-row">
        <SwitcherWidget widgets={switcherWidgets} />
        <div id="date-time" class="home-time-wrapper flex-grow">
            <div class="home-time">{signals.myTime}</div>
            <div class="home-date">{signals.myDate}</div>
        </div>
        <ActionCenter signals={signals} />
    </div>
}