import { render } from "solid-js/web";
import { onCleanup } from 'solid-js';
import { initializeIPC, sendClockDataRequest } from './ipc';
import { HomePage } from "./homePage";
import { DevicePage } from "./devicePage";
import { TaskBar } from "./taskbar";
import { ForecastPage } from "./forecastPage";
import { AstroPage } from "./astroPage";
import { hashIntegration, Router, Routes, Route } from "solid-app-router";

const App = () => {
  let ipcInterval = initializeIPC();
  sendClockDataRequest();
  onCleanup(() => {
    clearInterval(ipcInterval);
  });

  return <Routes>
      <Route path="/home" element={<HomePage/>} />
      <Route path="/forecast" element={<ForecastPage/>} />
      <Route path="/device" element={<DevicePage/>} />
      <Route path="/astro" element={<AstroPage/>} />
      <Route path="/" element={<HomePage/>} />
    </Routes>
};


export function attachApp() {
  render(() => <Router source={hashIntegration()}><App /><TaskBar/></Router>, document.getElementById('app'));
}

attachApp();