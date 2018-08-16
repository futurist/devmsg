const fs = require('fs');
const stream = require('stream');
const readline = require('readline');

class EchoStream extends stream.Writable {
    _write(chunk, enc, next) {
      fs.appendFileSync('abc', chunk);
      next();
    }
  }

new  EchoStream().write(''+1234)

const state = {}
module.exports = {
    stdout: fs.createWriteStream('abc', {encoding: 'utf8'}),
    handler: (req, res)=>{
        res.end(''+state.ok)
        state.ok = 0
    },
    console: ({type, data}) => {
      if(data.indexOf('sdf')>-1) state.ok = 1
    },
    init: ()=>{

    }
}
