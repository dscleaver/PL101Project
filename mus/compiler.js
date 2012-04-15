var midi = { 
  a0: 21, b0: 23, c1: 24, d1: 26, e1: 28, f1: 29, g1: 31, a1: 33,
  b1: 35, c2: 36, d2: 38, e2: 40, f2: 41, g2: 43, a2: 45, b2: 47, 
  c3: 48, d3: 50, e3: 52, f3: 53, g3: 55, a3: 57, b3: 59, c4: 60,
  d4: 62, e4: 64, f4: 65, g4: 67, a4: 69, b4: 71, c5: 72, d5: 74, 
  e5: 76, f5: 77, g5: 79, a5: 81, b5: 83, c6: 84, d6: 86, e6: 88,
  f6: 89, g6: 91, a6: 93, b6: 95, c7: 96, d7: 98, e7: 100, f7: 101,
  g7: 103, a7: 105, b7: 107, c8: 108 };

var endTime = function(startTime, expr) {
  if(expr.tag === 'note') {
    return startTime + expr.dur;
  }
  if(expr.tag === 'rest') {
    return startTime + expr.duration;
  }
  if(expr.tag === 'seq') {
    var leftEnd = endTime(startTime, expr.left);
    return endTime(leftEnd, expr.right);
  }
  if(expr.tag === 'par') {
    var leftEnd = endTime(startTime, expr.left);
    return Math.max(leftEnd, endTime(startTime, expr.right));
  }
  if(expr.tag === 'repeat') {
    var i = 0;
    var end = startTime;
    for(i = 0; i < expr.count; i++) {
      end = endTime(end, expr.section);
    }
    return end;
  }
};

var mus2Note = function(startTime, expr) {
  if(expr.tag === 'note') {
    return [ { tag: 'note', pitch: midi[expr.pitch], start: startTime, dur: expr.dur } ];
  }
  if(expr.tag === 'rest') {
    return [];
  }
  if(expr.tag === 'seq') {
    var leftNotes = mus2Note(startTime, expr.left);
    var leftEnd = endTime(startTime, expr.left);
    var rightNotes = mus2Note(leftEnd, expr.right);
    return leftNotes.concat(rightNotes);
  }
  if(expr.tag === 'par') {
    var leftNotes = mus2Note(startTime, expr.left);
    var rightNotes = mus2Note(startTime, expr.right);
    return leftNotes.concat(rightNotes);
  }
  if(expr.tag === 'repeat') {
    var notes = [];
    var end = startTime;
    var i = 0;
    for(i = 0; i < expr.count; i++) {
      notes = notes.concat(mus2Note(end, expr.section));
      end = endTime(end, expr.section);
    }
    return notes;
  }
};

var compile = function(musexpr) {
  return mus2Note(0, musexpr);
};

var melody_mus = 
  { tag : 'repeat',
    count: 3,
    section: { tag: 'seq',
               left: 
                 { tag: 'seq',
                   left: { tag: 'note', pitch: 'a4', dur: 250 },
                   right: { tag: 'rest', duration: 250 } },
               right:
                 { tag: 'par',
                   left: { tag: 'note', pitch: 'c4', dur: 500 },
                   right: { tag: 'note', pitch: 'd4', dur: 500 } } } };

console.log(melody_mus);
console.log(compile(melody_mus));
