import { render } from "solid-js/web";
import { Router, Routes, Route, hashIntegration } from "@solidjs/router";
import { WebSetupRoute } from "./components/dashboard/websetup";

const App = () => {
  return <Routes>
      <Route path="/" component={WebSetupRoute} />
    </Routes>
}


export function attachApp() {
  render(() => <Router source={hashIntegration()}><App /></Router>, document.getElementById('app'));
}

attachApp();