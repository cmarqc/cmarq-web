// Custom server for Hostinger Node.js web app hosting.
//
// Hostinger's LiteSpeed proxy talks to the app over a Unix socket
// (/usr/local/lsws/extapp-sock/...), passed via environment variable.
// `next start` can only bind a TCP port, so the proxy never reaches it and
// every request 503s. This wrapper listens on the socket path when one is
// provided and falls back to a TCP port otherwise (e.g. `npm start` locally).

const { createServer } = require('http')
const { parse } = require('url')
const fs = require('fs')
const next = require('next')

function getListenTarget() {
  // A value containing a path separator is a Unix socket path.
  for (const value of [process.env.PORT, process.env.HOST, process.env.HOSTNAME]) {
    if (value && value.includes('/')) return value
  }
  const port = Number(process.env.PORT)
  return Number.isFinite(port) && port > 0 ? port : 3000
}

const app = next({ dev: false })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const target = getListenTarget()

  // Remove a stale socket left by a previous run, or listen() fails with EADDRINUSE.
  if (typeof target === 'string' && fs.existsSync(target)) {
    fs.unlinkSync(target)
  }

  createServer((req, res) => handle(req, res, parse(req.url, true)))
    .listen(target, () => {
      console.log(`> Ready, listening on ${typeof target === 'string' ? target : `port ${target}`}`)
    })
    .on('error', (err) => {
      console.error('> Server failed to start:', err)
      process.exit(1)
    })
})
