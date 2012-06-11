var PEG = require('pegjs')
  , fs = require('fs')
  , input_file = 'scheem.peg'
  , output_file = 'parser.js';

task('default', ['build']);

task('build', [], function() {
  fs.readFile(input_file, function(err, data) {
    if(err) throw err;
    fs.writeFile(output_file,
      'var parser = '
      + PEG.buildParser(String(data), {}).toSource()
      + ';\nvar parseScheem = parser.parse;\nif (typeof module !== "undefined") { module.exports.parseScheem = parseScheem;\nmodule.exports.parser = parser; }',
      function(err) {
        if(err) throw err;
        complete();
      });
  });
});
