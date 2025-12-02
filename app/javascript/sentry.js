import * as Sentry from '@sentry/browser'
import { Integrations } from '@sentry/tracing'

let sentryScript = document.getElementById('sentry-js')

if (sentryScript.hasAttribute('data-sentry-dsn')) {
  Sentry.init({
    dsn: sentryScript.attributes['data-sentry-dsn'].value,
    // TODO: change athena to the actual app name
    release: 'athena@1.0.0',
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0,
  })

  if (sentryScript.hasAttribute('data-current-account')) {
    Sentry.setUser(JSON.parse(sentryScript.attributes['data-current-account'].value))
  }
}
