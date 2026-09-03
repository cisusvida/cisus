import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { contextGuard } from './core/guards/context-guard';

export const routes: Routes = [
  {
    path: '',
    title: 'Cisus — Productos y empresas asociadas',
    loadComponent: () => import('./features/home/pages/home/home').then((m) => m.Home),
  },
  {
    path: 'catalogo',
    title: 'Catálogo — Cisus',
    loadComponent: () => import('./features/catalog/pages/catalog/catalog').then((m) => m.Catalog),
  },
  {
    path: 'login',
    title: 'Iniciar sesión — Cisus',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Crear cuenta — Cisus',
    loadComponent: () => import('./features/auth/pages/register/register').then((m) => m.Register),
  },
  {
    path: 'cuenta',
    title: 'Mi cuenta — Cisus',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/pages/account/account').then((m) => m.Account),
  },
  {
    path: 'dashboard',
    title: 'Operación — Cisus',
    canActivate: [contextGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: '**',
    title: 'Página no encontrada — Cisus',
    loadComponent: () =>
      import('./features/not-found/pages/not-found/not-found').then((m) => m.NotFound),
  },
];
