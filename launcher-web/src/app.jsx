import { render } from "solid-js/web";
import { AppMain } from "./appmain";
import { Login } from "./login";
import { Router, Routes, Route } from "solid-app-router";
import { Pairing } from "./pairing";

const App = () => {
  return <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/app" element={<AppMain/>} />
      <Route path="/pairing" element={<Pairing/>} />
      <Route path="/" element={<AppMain/>} />
    </Routes>
}


export function attachApp() {
  render(() => <Router><App /></Router>, document.getElementById('app'));
}

attachApp();

