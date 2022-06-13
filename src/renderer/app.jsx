import { render } from "solid-js/web";
import { onCleanup } from 'solid-js';
import { initializeIPC, sendClockDataRequest } from './ipc';
import { HomePage } from "./homePage";
import { DevicePage } from "./devicePage";
import { TaskBar } from "./taskbar";
import { ForecastPage } from "./forecastPage";
import { AstroPage } from "./astroPage";
import { Router, Routes, Route } from "solid-app-router";

const App = () => {
  let ipcInterval = initializeIPC();
  sendClockDataRequest();
  onCleanup(() => {
    clearInterval(ipcInterval);
  });

  return (<>
    <Routes>
      <Route path="/home" element={<HomePage/>} />
      <Route path="/forecast" element={<ForecastPage/>} />
      <Route path="/device" element={<DevicePage/>} />
      <Route path="/astro" element={<AstroPage/>} />
      <Route path="/" element={<HomePage/>} />
    </Routes>
    <TaskBar/>
</>)
};


export function attachApp() {
  render(() => <Router><App /></Router>, document.getElementById('app'));
}
