import { render } from 'solid-js/web';
import { onCleanup } from 'solid-js';
import { hashIntegration, Router, Routes, Route } from "@solidjs/router";
import { initializeIPC } from '../ipc';
import { WebSetupPage } from "./webSetupPage";
import { HomePage } from "./homePage";
import { DevicePage } from "./devicePage";
import { TaskBar } from "./taskbar";
import { ForecastPage } from "./forecastPage";
import { AstroPage } from "./astroPage";
import { AccountPage } from "./accountPage";
import { StatusBar } from './statusBar';
import { LocalePage } from "./localePage";
import { CalendarPage } from "./calendarPage";

const AppScreen = (props) => 
  <WebSetupPage element={<div><StatusBar/>{props.element}<TaskBar/></div>}/>

const App = () => {
  let ipcIntervals = initializeIPC();
  onCleanup(() => {
    ipcIntervals.forEach(interval => clearInterval(interval));
  });

  return <Routes>
        <Route path="/home" element={<AppScreen element={<HomePage/>}/>}/>
        <Route path="/forecast" element={<AppScreen element={<ForecastPage/>}/>}/>
        <Route path="/device" element={<AppScreen element={<DevicePage/>}/>}/>
        <Route path="/astro" element={<AppScreen element={<AstroPage/>}/>}/>
        <Route path="/account" element={<AppScreen element={<AccountPage/>}/>}/>
        <Route path="/locale" element={<AppScreen element={<LocalePage/>}/>}/>
        <Route path="/calendar" element={<AppScreen element={<CalendarPage/>}/>}/>
        <Route path="/" element={<AppScreen element={<HomePage/>}/>}/>
      </Routes>
};

export function attachApp() {
    render(() => <Router source={hashIntegration()}><App></App></Router>, document.getElementById('app'));
  }