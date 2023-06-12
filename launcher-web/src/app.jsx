import { render } from "solid-js/web";
import { Home } from "./home";
import { Router, Routes, Route } from "solid-app-router";

const App = () => {
  return <Routes>
      <Route path="/" element={<Home/>} />
    </Routes>
}


export function attachApp() {
  render(() => <Router><App /></Router>, document.getElementById('app'));
}

attachApp();

