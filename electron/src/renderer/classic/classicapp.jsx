import { onCleanup } from 'solid-js';
import { hashIntegration, Router, Routes, Route } from "@solidjs/router";
import { initializeIPC } from './ipc';
import { HomePage } from "./classic/homePage";
import { DevicePage } from "./classic/devicePage";
import { TaskBar } from "./classic/taskbar";
import { ForecastPage } from "./classic/forecastPage";
import { AstroPage } from "./classic/astroPage";
import { AccountPage } from "./classic/accountPage";
import { StatusBar } from './classic/statusBar';
import { LocalePage } from "./classic/localePage";
import { CalendarPage } from "./classic/calendarPage";
import { WebSetupPage } from "./webSetupPage";


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