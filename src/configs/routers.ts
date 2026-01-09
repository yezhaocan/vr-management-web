import _APP from '../pages/_app.jsx';
import CONFIG from '../pages/config.jsx';
import DASHBOARD from '../pages/dashboard.jsx';
import DRONE from '../pages/drone.jsx';
import FLIGHT_TASK from '../pages/flight-task.jsx';
import LOGIN from '../pages/login.jsx';
import POI from '../pages/poi.jsx';
import ROUTE from '../pages/route.jsx';
import SCENIC_MANAGEMENT from '../pages/scenic-management.jsx';
import SUPERADMIN from '../pages/superadmin.jsx';
import TIPS from '../pages/tips.jsx';
import VIDEO_RECORD from '../pages/video-record.jsx';
import NOT_FOUND from '../pages/not-found.jsx';
export const routers = [{
  id: "_app",
  component: _APP
}, {
  id: "config",
  component: CONFIG
}, {
  id: "dashboard",
  component: DASHBOARD
}, {
  id: "drone",
  component: DRONE
}, {
  id: "flight-task",
  component: FLIGHT_TASK
}, {
  id: "login",
  component: LOGIN
}, {
  id: "poi",
  component: POI
}, {
  id: "route",
  component: ROUTE
}, {
  id: "scenic-management",
  component: SCENIC_MANAGEMENT
}, {
  id: "superadmin",
  component: SUPERADMIN
}, {
  id: "tips",
  component: TIPS
}, {
  id: "video-record",
  component: VIDEO_RECORD
}, {
  id: "not-found",
  component: NOT_FOUND
}]