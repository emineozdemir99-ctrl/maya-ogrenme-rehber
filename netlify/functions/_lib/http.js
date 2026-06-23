export const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
})

export function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}')
  } catch {
    return null
  }
}

export function errorResponse(error) {
  console.error(error)
  const status = error?.statusCode || 500
  const message = status >= 500 ? 'Sunucuda beklenmeyen bir sorun oluştu.' : error.message
  return json(status, { error: message })
}

export function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode })
}
