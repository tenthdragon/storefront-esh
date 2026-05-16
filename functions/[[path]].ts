import { loadSettings, toPublicSettings } from './_lib/settings'
import type { StorefrontEnv, StorefrontPublicSettings } from './_lib/types'

const META_SCRIPT_ID = 'storefront-meta-pixel'

function escapeInlineJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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

function buildSettingsScript(settings: StorefrontPublicSettings) {
  const serializedSettings = escapeInlineJson(settings)
  return [
    `window.__STOREFRONT_PUBLIC_SETTINGS__=${serializedSettings};`,
    'window.__STOREFRONT_PUBLIC_SETTINGS_PROMISE__=Promise.resolve(window.__STOREFRONT_PUBLIC_SETTINGS__);',
  ].join('')
}

function buildMetaPixelScript(pixelId: string) {
  const serializedPixelId = escapeInlineJson(pixelId)

  return [
    `var META_PIXEL_IDS=[${serializedPixelId}];`,
    `!(function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.id='${META_SCRIPT_ID}';t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];if(s&&s.parentNode){s.parentNode.insertBefore(t,s)}else{b.head.appendChild(t)}})(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');`,
    'function initPixels(){',
    'if(window.__scalevStorefrontPixelsInitialized)return;',
    'window.__scalevStorefrontPixelsInitialized=true;',
    'for(var i=0;i<META_PIXEL_IDS.length;i++){window.fbq&&window.fbq("init",META_PIXEL_IDS[i]);}',
    'window.fbq&&window.fbq("track","PageView");',
    '}',
    'initPixels();',
    'window.__STOREFRONT_META_PIXEL_IDS__=window.__STOREFRONT_META_PIXEL_IDS__||{};',
    'for(var j=0;j<META_PIXEL_IDS.length;j++){window.__STOREFRONT_META_PIXEL_IDS__[META_PIXEL_IDS[j]]=true;}',
    `window.__STOREFRONT_META_PAGEVIEW_PIXEL_ID__=${serializedPixelId};`,
  ].join('')
}

function buildNoscriptPixel(pixelId: string) {
  const escapedPixelId = escapeHtmlAttribute(pixelId)
  return `<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${escapedPixelId}&amp;ev=PageView&amp;noscript=1" alt=""/></noscript>`
}

class HeadInjector {
  constructor(private markup: string) {}

  element(element: Element) {
    if (!this.markup) return
    element.append(this.markup, { html: true })
  }
}

class BodyInjector {
  constructor(private markup: string) {}

  element(element: Element) {
    if (!this.markup) return
    element.append(this.markup, { html: true })
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

  const headBlocks: string[] = [`<script>${buildSettingsScript(settings)}</script>`]
  if (pixelId) {
    headBlocks.push(`<script>${buildMetaPixelScript(pixelId)}</script>`)
  }

  const bodyMarkup = pixelId ? buildNoscriptPixel(pixelId) : ''

  return new HTMLRewriter()
    .on('head', new HeadInjector(headBlocks.join('')))
    .on('body', new BodyInjector(bodyMarkup))
    .transform(response)
}
