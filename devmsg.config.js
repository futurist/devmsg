
const state = {}
module.exports = {
  handler: (req, res) => {
    res.end('' + state.ok)
    state.ok = 0
  },
  console: (data, type) => {
    console.log(type, data + '')
    if (data.indexOf('sdf') > -1) state.ok = 1
  },
  init: () => {

  }
}
