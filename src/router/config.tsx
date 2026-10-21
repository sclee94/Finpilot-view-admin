import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import Home from "../pages/home/page";

const NotFound = lazy(() => import("../pages/NotFound"));
const Dashboard = lazy(() => import("../pages/dashboard/page"));
const Users = lazy(() => import("../pages/users/page"));
const Stocks = lazy(() => import("../pages/stocks/page"));
const Reports = lazy(() => import("../pages/reports/page"));
const Settings = lazy(() => import("../pages/settings/page"));
const Strategy = lazy(() => import("../pages/strategy/page"));
const StrategyMenu = lazy(() => import("../pages/strategyMenu/page"));
const Logs = lazy(() => import("../pages/logs/page"));
const TestLog = lazy(() => import("../pages/testlog/page"));
const Live = lazy(() => import("../pages/live/page"));
const Blocked = lazy(() => import("../pages/blocked/page"));
const Briefing = lazy(() => import("../pages/briefing/page"));
const BriefingDetail = lazy(() => import("../pages/briefing/detail"));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
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
    path: "/strategy",
    element: <Strategy />,
  },
  {
    path: "/strategy-menu",
    element: <StrategyMenu />,
  },
  {
    path: "/logs",
    element: <Logs />,
  },
  {
    path: "/testlog",
    element: <TestLog />,
  },
  {
    path: "/live",
    element: <Live />,
  },
  {
    path: "/briefing",
    element: <Briefing />,
  },
  {
    path: "/briefing/:id",
    element: <BriefingDetail />,
  },
  {
    path: "/blocked",
    element: <Blocked />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
