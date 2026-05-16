import { loadSettings, toPublicSettings } from './_lib/settings'
import type { StorefrontEnv, StorefrontPublicSettings } from './_lib/types'

const META_SCRIPT_ID = 'storefront-meta-pixel'

function escapeInlineJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function isStorefrontHtmlPath(pathname: string) {
  return (
    !pathname.startsWith('/admin')
    && !pathname.startsWith('/admin-api')
    && !pathname.startsWith('/storefront-api')
    && !pathname.startsWith('/scalev-api')
    && !pathname.startsWith('/assets/')
  )
}

function buildBootstrapScript(settings: StorefrontPublicSettings) {
  const serializedSettings = escapeInlineJson(settings)
  const pixelId = settings.analytics.meta.enabled ? settings.analytics.meta.pixelId.trim() : ''
  const serializedPixelId = escapeInlineJson(pixelId)

  const lines = [
    `window.__STOREFRONT_PUBLIC_SETTINGS__=${serializedSettings};`,
    'window.__STOREFRONT_PUBLIC_SETTINGS_PROMISE__=Promise.resolve(window.__STOREFRONT_PUBLIC_SETTINGS__);',
  ]

  if (pixelId) {
    lines.push(
      'window.__STOREFRONT_META_PIXEL_IDS__=window.__STOREFRONT_META_PIXEL_IDS__||{};',
      `if(!window.__STOREFRONT_META_PIXEL_IDS__[${serializedPixelId}]){`,
      `!(function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.id='${META_SCRIPT_ID}';t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];if(s&&s.parentNode){s.parentNode.insertBefore(t,s)}else{b.head.appendChild(t)}})(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');`,
      `fbq('init',${serializedPixelId});`,
      `window.__STOREFRONT_META_PIXEL_IDS__[${serializedPixelId}]=true;`,
      '}',
      `fbq('track','PageView');`,
      `window.__STOREFRONT_META_PAGEVIEW_PIXEL_ID__=${serializedPixelId};`,
    )
  }

  return lines.join('')
}

class HeadScriptInjector {
  constructor(private script: string) {}

  element(element: Element) {
    element.append(`<script>${this.script}</script>`, { html: true })
  }
}

export const onRequest: PagesFunction<StorefrontEnv> = async (context) => {
  const url = new URL(context.request.url)
  const response = await context.next()
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('text/html') || !isStorefrontHtmlPath(url.pathname)) {
    return response
  }

  const settings = toPublicSettings(await loadSettings(context.env))
  const injector = new HeadScriptInjector(buildBootstrapScript(settings))
  return new HTMLRewriter().on('head', injector).transform(response)
}
