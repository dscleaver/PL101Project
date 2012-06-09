var PEG = require('pegjs')
  , fs = require('fs')
  , input_file = 'scheem.peg'
  , output_file = 'parser.js';

task('default', ['build']);

task('build', [], function() {
  fs.readFile(input_file, function(err, data) {
    if(err) throw err;
    fs.writeFile(output_file,
      'var parseScheem = '
      + PEG.buildParser(String(data), {}).toSource()
      + '.parse;\nif (typeof module !== "undefined") { module.exports.parseScheem = parseScheem; }',
      function(err) {
        if(err) throw err;
        complete();
      });
  });
});
