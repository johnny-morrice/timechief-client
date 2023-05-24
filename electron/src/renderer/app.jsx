import { render } from "solid-js/web";
import { onCleanup } from 'solid-js';
import { hashIntegration, Router, Routes, Route } from "@solidjs/router";
import { initializeIPC } from './ipc';
import { HomePage } from "./homePage";
import { DevicePage } from "./devicePage";
import { TaskBar } from "./taskbar";
import { ForecastPage } from "./forecastPage";
import { AstroPage } from "./astroPage";
import { AccountPage } from "./accountPage";
import { StatusBar } from './statusBar';
import { LocalePage } from "./localePage";
import { CalendarPage } from "./calendarPage";
import { WebSetupPage } from "./webSetupPage";

const App = () => {
  let ipcIntervals = initializeIPC();
  onCleanup(() => {
    ipcIntervals.forEach(interval => clearInterval(interval));
  });

  return <Routes>
        <Route path="/home" element={<WebSetupPage element={<HomePage/>}/>}/>
        <Route path="/forecast" element={<WebSetupPage element={<ForecastPage/>}/>}/>
        <Route path="/device" element={<WebSetupPage element={<DevicePage/>}/>}/>
        <Route path="/astro" element={<WebSetupPage element={<AstroPage/>}/>}/>
        <Route path="/account" element={<WebSetupPage element={<AccountPage/>}/>}/>
        <Route path="/locale" element={<WebSetupPage element={<LocalePage/>}/>}/>
        <Route path="/calendar" element={<WebSetupPage element={<CalendarPage/>}/>}/>
        <Route path="/" element={<WebSetupPage element={<HomePage/>}/>}/>
      </Routes>
};


export function attachApp() {
  render(() => <Router source={hashIntegration()}><StatusBar/><App /><TaskBar/></Router>, document.getElementById('app'));
}

attachApp();