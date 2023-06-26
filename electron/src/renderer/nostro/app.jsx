import { render } from 'solid-js/web';
import { onCleanup } from 'solid-js';
import { hashIntegration, Router, Routes, Route } from "@solidjs/router";
import { initializeIPC } from '../classic/ipc';
import { WebSetupPage } from "./webSetupPage";
import { HomePage } from "./homePage";

const AppScreen = (props) => 
  <WebSetupPage element={props.element}/>

const App = () => {
  let ipcIntervals = initializeIPC();
  onCleanup(() => {
    ipcIntervals.forEach(interval => clearInterval(interval));
  });

  return <Routes>
        <Route path="/home" element={<AppScreen element={<HomePage/>}/>}/>
        <Route path="/" element={<AppScreen element={<HomePage/>}/>}/>
      </Routes>
};

export function attachApp() {
    render(() => <Router source={hashIntegration()}><App></App></Router>, document.getElementById('app'));
}