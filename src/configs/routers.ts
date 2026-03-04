import WORKSPACE_SHELL from '../pages/workspace-shell.jsx';
import LEGACY_REDIRECT from '../pages/legacy-redirect.jsx';
import LOGIN from '../pages/login.jsx';
import SRT_GENERATOR from '../pages/srt-generator.jsx';
export const routers = [
  {
    id: 'workspace',
    component: WORKSPACE_SHELL,
    isHome: true,
  },
  {
    id: 'workspace/:pageId',
    component: WORKSPACE_SHELL,
  },
  {
    id: 'login',
    component: LOGIN,
  },
  {
    id: 'srt-generator',
    component: SRT_GENERATOR,
  },
  {
    id: 'dashboard',
    component: LEGACY_REDIRECT,
  },
  {
    id: 'drone',
    component: LEGACY_REDIRECT,
  },
  {
    id: 'route',
    component: LEGACY_REDIRECT,
  },
  {
    id: 'poi',
    component: LEGACY_REDIRECT,
  },
  {
    id: 'config',
    component: LEGACY_REDIRECT,
  },
  {
    id: 'superadmin',
    component: LEGACY_REDIRECT,
  },
  {
    id: 'flight-task',
    component: LEGACY_REDIRECT,
  },
  {
    id: 'video-record',
    component: LEGACY_REDIRECT,
  },
  {
    id: 'tips',
    component: LEGACY_REDIRECT,
  },
  {
    id: 'scenic-management',
    component: LEGACY_REDIRECT,
  },
];
