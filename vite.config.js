import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handler as authLogin } from './netlify/functions/auth-login.js'
import { handler as chat } from './netlify/functions/chat.js'
import { handler as chatHistory } from './netlify/functions/chat-history.js'
import { handler as teacherDashboard } from './netlify/functions/teacher-dashboard.js'
import { handler as teacherHistory } from './netlify/functions/teacher-history.js'

const functions = {
  '/api/auth-login': authLogin,
  '/api/chat': chat,
  '/api/chat-history': chatHistory,
  '/api/teacher-dashboard': teacherDashboard,
  '/api/teacher-history': teacherHistory,
}

function localFunctionsPlugin() {
  return {
    name: 'maya-local-functions',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url, 'http://localhost')
        const handler = functions[url.pathname]
        if (!handler) return next()

        try {
          const chunks = []
          for await (const chunk of request) chunks.push(chunk)
          const result = await handler({
            httpMethod: request.method,
            headers: request.headers,
            body: Buffer.concat(chunks).toString('utf8'),
            queryStringParameters: Object.fromEntries(url.searchParams),
          })

          response.statusCode = result.statusCode || 200
          for (const [name, value] of Object.entries(result.headers || {})) {
            response.setHeader(name, value)
          }
          response.end(result.body || '')
        } catch (error) {
          server.config.logger.error(error.stack || error.message)
          response.statusCode = 500
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: 'Yerel sunucuda beklenmeyen bir sorun oluştu.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    plugins: [react(), localFunctionsPlugin()],
    server: { port: 8888, strictPort: true },
  }
})
