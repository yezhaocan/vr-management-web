import DASHBOARD from '../pages/dashboard.jsx';
import DRONE from '../pages/drone.jsx';
import ROUTE from '../pages/route.jsx';
import POI from '../pages/poi.jsx';
import CONFIG from '../pages/config.jsx';
import SUPERADMIN from '../pages/superadmin.jsx';
import FLIGHT_TASK from '../pages/flight-task.jsx';
import _APP from '../pages/_app.jsx';
import VIDEO_RECORD from '../pages/video-record.jsx';
import TIPS from '../pages/tips.jsx';
import SCENIC_MANAGEMENT from '../pages/scenic-management.jsx';
import LOGIN from '../pages/login.jsx';
export const routers = [{
                id: "dashboard",
                component: DASHBOARD
              }, {
                id: "drone",
                component: DRONE
              }, {
                id: "route",
                component: ROUTE
              }, {
                id: "poi",
                component: POI
              }, {
                id: "config",
                component: CONFIG
              }, {
                id: "superadmin",
                component: SUPERADMIN
              }, {
                id: "flight-task",
                component: FLIGHT_TASK
              }, {
                id: "_app",
                component: _APP
              }, {
                id: "video-record",
                component: VIDEO_RECORD
              }, {
                id: "tips",
                component: TIPS
              }, {
                id: "scenic-management",
                component: SCENIC_MANAGEMENT
              }, {
                id: "login",
                component: LOGIN
              }]