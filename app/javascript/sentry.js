import * as Sentry from '@sentry/browser'

let sentryScript = document.getElementById('sentry-js')

if (sentryScript && sentryScript.hasAttribute('data-dsn')) {
  Sentry.init({
    dsn: sentryScript.attributes['data-dsn'].value,
    release: 'bmx4@1.0.0', // 'release' is based on latest sprint or upgrade
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: parseFloat(sentryScript.attributes['data-traces-sample-rate'].value),
  })

  if (sentryScript.hasAttribute('data-current-account')) {
    Sentry.setUser(JSON.parse(sentryScript.attributes['data-current-account'].value))
  }
}
