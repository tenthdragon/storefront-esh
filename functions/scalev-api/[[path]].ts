export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const targetPath = url.pathname.replace('/scalev-api', '')
  const targetUrl = `https://api.scalev.com${targetPath}${url.search}`

  const headers = new Headers(context.request.headers)
  headers.delete('origin')
  headers.delete('referer')

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers,
    body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
  })

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  })
}
