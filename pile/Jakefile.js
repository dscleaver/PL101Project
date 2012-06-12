var PEG = require('pegjs')
  , fs = require('fs')
  , input_file = 'pile.peg'
  , output_file = 'parser.js';

task('default', ['build']);

task('build', [], function() {
  fs.readFile(input_file, function(err, data) {
    if(err) throw err;
    fs.writeFile(output_file,
      'var parse = '
      + PEG.buildParser(String(data), {}).toSource()
      + '.parse;\nif (typeof module !== "undefined") { module.exports.parse = parse; }',
      function(err) {
        if(err) throw err;
        complete();
      });
  });
});
