import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const DARK_BG = '#0a0a0f';
const LIGHT_BG = '#e8e8ef';

const BASE_URL = (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');
const asset = (p: string): string => `${BASE_URL}/${p}`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />

        <title>Cashly</title>

        <meta name="application-name" content="Cashly" />
        <meta name="apple-mobile-web-app-title" content="Cashly" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content={DARK_BG} media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content={LIGHT_BG} media="(prefers-color-scheme: light)" />
        <meta name="format-detection" content="telephone=no" />

        <link rel="manifest" href={asset('manifest.webmanifest')} />
        <link rel="icon" href={asset('favicon.png')} />
        <link rel="apple-touch-icon" href={asset('icon-512.png')} />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT.replace('__BASE_URL__', BASE_URL),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

const BASE_CSS = `
  :root {
    --cashly-sab: env(safe-area-inset-bottom, 0px);
    --cashly-sat: env(safe-area-inset-top, 0px);
  }
  /* Tab bar: pin to viewport bottom so no react-navigation container or
     safe-area wrapper can eat the offset. iOS PWA in standalone mode +
     viewport-fit=cover lets 'bottom: N' anchor to the display edge. */
  #cashly-tabbar {
    position: fixed !important;
    bottom: 10px !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background-color: ${DARK_BG};
    color-scheme: dark light;
    overscroll-behavior: none;
  }
  html[data-theme='light'], html[data-theme='light'] body {
    background-color: ${LIGHT_BG};
  }
  html, body, #root {
    min-height: 100vh;
    min-height: 100dvh;
  }
  body {
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }
  :focus { outline: none; }
`;

const THEME_INIT = `
  (function() {
    try {
      var stored = localStorage.getItem('cashly:theme');
      var mode = stored === 'light' || stored === 'dark'
        ? stored
        : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      document.documentElement.setAttribute('data-theme', mode);
    } catch (e) {}
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('__BASE_URL__/sw.js').catch(function () {});
    }
  })();
`;
