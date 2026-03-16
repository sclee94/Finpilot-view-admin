import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Dashboard from "../pages/dashboard/page";
import Users from "../pages/users/page";
import Stocks from "../pages/stocks/page";
import Reports from "../pages/reports/page";
import Settings from "../pages/settings/page";
import Logs from "../pages/logs/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/users",
    element: <Users />,
  },
  {
    path: "/stocks",
    element: <Stocks />,
  },
  {
    path: "/reports",
    element: <Reports />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/logs",
    element: <Logs />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;