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
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.id='${META_SCRIPT_ID}';t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];if(s&&s.parentNode){s.parentNode.insertBefore(t,s)}else{b.head.appendChild(t)}}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');`,
      `fbq('init',${serializedPixelId});`,
      `fbq('track','PageView');`,
      `window.__STOREFRONT_META_PIXEL_IDS__[${serializedPixelId}]=true;`,
      '}',
      `window.__STOREFRONT_META_PAGEVIEW_PIXEL_ID__=${serializedPixelId};`,
    )
  }

  return lines.join('')
}

function buildNoscriptPixel(pixelId: string) {
  if (!pixelId.trim()) return ''

  const escapedPixelId = pixelId.replace(/"/g, '&quot;')
  return `<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${escapedPixelId}&ev=PageView&noscript=1" alt=""/></noscript>`
}

class HeadScriptInjector {
  constructor(private script: string) {}

  element(element: Element) {
    element.prepend(`<script>${this.script}</script>`, { html: true })
  }
}

class BodyNoscriptInjector {
  constructor(private markup: string) {}

  element(element: Element) {
    if (!this.markup) return
    element.prepend(this.markup, { html: true })
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
  const pixelId = settings.analytics.meta.enabled ? settings.analytics.meta.pixelId.trim() : ''
  const injector = new HeadScriptInjector(buildBootstrapScript(settings))
  const noscriptInjector = new BodyNoscriptInjector(buildNoscriptPixel(pixelId))
  return new HTMLRewriter()
    .on('head', injector)
    .on('body', noscriptInjector)
    .transform(response)
}
