// Minimal mock for chalk v5: provide default and common named methods
const passthrough = (s: any) => String(s)
const proxy: any = new Proxy(passthrough, {
  get: () => passthrough,
  apply: (_t, _this, args) => String(args[0]),
})

// CJS exports
module.exports = proxy
module.exports.default = proxy
module.exports.blueBright = passthrough
module.exports.greenBright = passthrough
module.exports.yellowBright = passthrough
module.exports.cyanBright = passthrough
module.exports.redBright = passthrough
