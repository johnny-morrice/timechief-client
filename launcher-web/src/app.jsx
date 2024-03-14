import { render } from "solid-js/web";
import { Router, Routes, Route, hashIntegration } from "@solidjs/router";
import { DashboardRoute } from "./components/dashboard/dashboard";
import { DeviceSetupRoute } from "./components/device/setup";
import { AccountsRoute } from "./components/accounts/accounts";

const App = () => {
  // We will want a route for login since it is provided by this app.
  return <Routes>
      <Route path="/" component={DashboardRoute} />
    </Routes>
}


export function attachApp() {
  render(() => <Router source={hashIntegration()}><App /></Router>, document.getElementById('app'));
}

attachApp();