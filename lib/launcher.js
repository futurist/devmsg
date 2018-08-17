
const http = require('http')
const stream = require('stream')
const childProcess = require('child_process')

const name = '[devmsg]'

function createServer (port, handler) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler)
    const tryListen = () => server.listen(port, () => resolve({ server, port, destroy }))
    const serverSockets = new Set()

    server.on('connection', socket => {
      serverSockets.add(socket)
      socket.on('close', () => {
        serverSockets.delete(socket)
      })
    })

    function destroy () {
      for (const socket of serverSockets.values()) {
        socket.destroy()
      }
      if (server.listening) server.close()
    }

    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(name, `port ${port} in use, try another port...`)
        setTimeout(() => {
          ++port
          server.close()
          tryListen()
        }, 0)
      } else {
        console.log(name, e)
      }
    })
    tryListen()
  })
}

async function launch (options) {
  const { argv, cwd, localConfigFile, maxServer, globalConfigFile } = options

  if (!isNaN(maxServer)) require('events').EventEmitter.defaultMaxListeners = Number(maxServer)

  const [cmd, ...args] = argv.slice(2)

  try { var localConfig = require(localConfigFile) } catch (e) { }
  try { var globalConfig = require(globalConfigFile) } catch (e) { }
  const config = Object.assign({}, globalConfig, localConfig)

  const server = await createServer(config.port || 3000, config.handler)
  console.log(name, 'server listening on', server.port)

  const cpOpts = {
    cwd,
    env: { ...process.env, FORCE_COLOR: true, ...config.env },
    stdio: ['inherit', 'pipe', 'pipe']
  }
  const cp = childProcess.spawn(cmd, args, cpOpts)

  return new Promise((resolve, reject) => {
    if (config.init) config.init({ cp, server, config })

    // capture stdout
    var stdout = new stream.Writable()
    stdout._write = function (data, ...argv) {
      config.console && config.console(data, 'stdout')
      process.stdout._write(data, ...argv)
    }
    cp.stdout.pipe(stdout)

    // capture stderr
    var stderr = new stream.Writable()
    stderr._write = function (data, ...argv) {
      config.console && config.console(data, 'stderr')
      process.stderr._write(data, ...argv)
    }
    cp.stderr.pipe(stderr)

    cp.once('error', reject)

    cp.once('close', code => {
      server.destroy()
      if (code > 0) {
        reject(new Error('Exited with code ' + code))
        return
      }
      resolve(cp)
    })
  })
}

module.exports = {
  launch
}
