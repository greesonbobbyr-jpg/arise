// Builds standards.js from published strength standards.
// usage: node tools/build-standards.js
//
// Source: Strength Level (https://strengthlevel.com/strength-standards), 1RM standards by bodyweight, lb.
// Their standards are computed from lifts logged by their users (about 48.7 million lifts, 2015–2026).
// Levels are percentiles AMONG PEOPLE WHO LIFT AND LOG, same sex and bodyweight:
//   Beginner = stronger than 5% of lifters, Novice 20%, Intermediate 50%, Advanced 80%, Elite 95%.
// We keep five bodyweight anchors per sex and interpolate between them. Retrieved 2026-10-13.
//
// Row format: SEX,BW,Beginner,Novice,Intermediate,Advanced,Elite
// Dumbbell lifts: per dumbbell (as published). Pull-ups, chin-ups, dips: ADDED weight (negative = assisted);
// the build converts them to total load (bodyweight + added) to match how the app computes e1RM.
const fs = require('fs'), path = require('path');
const ANCHORS = { m: [120, 160, 200, 250, 300], f: [100, 130, 160, 200, 250] };
const RAW = {
  bench: `M,120,70,102,142,189,240
M,160,108,148,196,250,308
M,200,144,189,243,303,367
M,250,185,236,295,361,431
M,300,222,278,342,413,487
F,100,27,50,81,119,163
F,130,40,67,102,145,192
F,160,52,82,120,166,217
F,200,66,99,141,191,245
F,250,82,119,164,217,275`,
  squat: `M,120,92,136,192,257,327
M,160,145,199,265,340,421
M,200,193,255,329,413,501
M,250,249,319,401,493,589
M,300,300,376,465,563,666
F,100,50,84,129,183,243
F,130,69,107,157,216,281
F,160,85,128,181,244,313
F,200,105,151,209,277,350
F,250,126,177,239,311,389`,
  deadlift: `M,120,116,168,233,308,389
M,160,174,236,312,398,490
M,200,227,297,382,476,576
M,250,287,365,458,561,669
M,300,341,426,526,636,751
F,100,67,106,157,218,286
F,130,87,131,187,253,326
F,160,105,153,213,283,359
F,200,126,178,242,317,397
F,250,148,205,274,353,437`,
  front_squat: `M,120,76,112,156,208,265
M,160,115,158,210,270,334
M,200,150,199,257,323,393
M,250,191,245,309,381,456
M,300,227,286,355,432,512
F,100,53,79,112,150,192
F,130,67,95,131,172,216
F,160,78,109,147,190,237
F,200,92,125,165,211,260
F,250,106,142,184,233,284`,
  incline_bench: `M,120,58,86,121,162,206
M,160,95,130,172,220,271
M,200,130,170,217,271,327
M,250,169,215,268,327,389
M,300,206,256,313,377,443
F,100,20,39,65,99,138
F,130,31,54,85,123,165
F,160,41,67,102,143,189
F,200,54,84,122,167,216
F,250,69,102,144,192,245`,
  close_grip: `M,120,65,93,128,169,214
M,160,105,141,183,232,283
M,200,143,184,232,287,343
M,250,187,233,287,347,410
M,300,227,278,337,401,468
F,100,30,51,78,111,149
F,130,43,68,99,137,178
F,160,56,83,118,158,202
F,200,71,102,140,183,231
F,250,88,122,163,210,261`,
  ohp: `M,120,39,61,89,123,160
M,160,63,90,124,163,206
M,200,86,117,155,199,245
M,250,112,147,190,238,288
M,300,136,175,221,272,326
F,100,19,34,54,79,107
F,130,27,44,66,94,124
F,160,34,53,77,106,138
F,200,42,63,90,121,155
F,250,51,74,103,136,172`,
  push_press: `M,120,53,80,116,158,204
M,160,82,116,158,207,259
M,200,110,148,195,249,306
M,250,141,185,237,295,357
M,300,170,217,273,336,402
F,100,40,59,83,110,141
F,130,48,69,95,125,157
F,160,56,78,105,137,170
F,200,65,88,117,150,185
F,250,74,99,129,164,201`,
  sumo_deadlift: `M,120,140,198,270,352,441
M,160,201,270,353,446,546
M,200,257,334,425,527,635
M,250,319,404,504,615,731
M,300,375,467,573,691,814
F,100,89,131,184,245,312
F,130,103,148,204,268,338
F,160,116,163,221,287,359
F,200,129,179,239,309,383
F,250,144,196,259,331,408`,
  rdl: `M,120,81,126,185,255,331
M,160,126,181,250,330,417
M,200,168,231,308,396,491
M,250,215,286,372,468,570
M,300,259,336,428,531,639
F,100,56,88,129,178,232
F,130,67,102,146,198,254
F,160,77,113,160,214,272
F,200,88,127,175,232,293
F,250,99,140,191,250,314`,
  barbell_row: `M,120,58,89,128,174,225
M,160,92,130,176,230,287
M,200,124,167,219,278,341
M,250,160,208,266,331,400
M,300,193,246,308,378,451
F,100,30,52,80,114,152
F,130,39,62,93,130,170
F,160,46,72,104,143,185
F,200,55,82,117,158,202
F,250,64,94,130,173,220`,
  lat_pulldown: `M,120,70,102,140,186,235
M,160,95,131,174,224,278
M,200,116,156,203,257,314
M,250,140,183,234,291,352
M,300,161,207,261,321,385
F,100,42,62,88,119,152
F,130,50,72,100,132,168
F,160,57,81,110,144,180
F,200,65,90,121,156,194
F,250,74,100,133,170,209`,
  hip_thrust: `M,120,56,119,209,325,459
M,160,105,186,296,431,583
M,200,153,248,373,523,690
M,250,209,319,459,624,806
M,300,262,384,536,714,907
F,100,61,117,194,290,400
F,130,76,137,219,321,436
F,160,89,154,241,347,467
F,200,104,174,265,376,500
F,250,120,194,291,406,535`,
  leg_press: `M,120,132,222,342,488,651
M,160,209,320,462,629,812
M,200,282,409,567,751,950
M,250,365,508,683,883,1099
M,300,442,597,786,1000,1228
F,100,74,147,249,379,527
F,130,105,189,304,445,605
F,160,134,227,351,502,671
F,200,168,271,405,566,745
F,250,206,319,463,635,824`,
  barbell_curl: `M,120,28,47,72,103,137
M,160,42,65,94,129,167
M,200,55,81,113,151,192
M,250,70,99,134,175,219
M,300,84,115,153,196,242
F,100,12,24,42,64,90
F,130,17,31,50,75,103
F,160,21,37,58,84,113
F,200,26,44,67,94,125
F,250,32,51,76,105,138`,
  power_clean: `M,120,71,101,137,180,225
M,160,102,137,179,227,278
M,200,130,169,216,268,323
M,250,161,205,255,312,371
M,300,189,236,290,350,413
F,100,48,69,95,125,158
F,130,59,82,111,143,178
F,160,69,94,124,159,196
F,200,81,108,140,176,215
F,250,93,122,156,194,235`,
  db_bench: `M,120,23,39,59,84,112
M,160,37,56,80,109,140
M,200,49,71,98,129,163
M,250,64,88,118,152,189
M,300,77,104,136,172,211
F,100,10,20,33,51,71
F,130,14,26,41,60,82
F,160,18,31,48,68,91
F,200,23,37,56,78,102
F,250,29,44,64,87,113`,
  db_incline: `M,120,27,40,57,78,100
M,160,42,58,79,102,127
M,200,55,74,97,123,151
M,250,71,92,118,146,176
M,300,86,109,136,166,198
F,100,11,20,32,48,65
F,130,16,27,40,57,76
F,160,20,32,47,65,85
F,200,26,39,55,75,96
F,250,32,46,64,85,107`,
  db_shoulder: `M,120,18,30,46,65,87
M,160,29,44,63,85,110
M,200,39,57,78,103,130
M,250,52,71,95,122,151
M,300,63,84,110,139,170
F,100,10,17,27,38,52
F,130,13,21,32,45,59
F,160,16,25,36,50,65
F,200,19,29,41,56,72
F,250,23,34,47,62,79`,
  pull_up: `M,120,-10,19,54,92,133
M,160,-5,30,70,113,159
M,200,-5,34,78,126,175
M,250,-10,32,81,133,186
M,300,-20,26,77,133,190
F,100,-31,-10,15,43,73
F,130,-34,-10,19,51,84
F,160,-40,-13,19,54,89
F,200,-51,-20,14,52,91
F,250,-68,-35,3,43,85`,
  chin_up: `M,120,-7,22,56,93,132
M,160,-1,32,71,114,157
M,200,-1,37,79,126,174
M,250,-6,35,82,133,184
M,300,-16,29,79,133,187
F,100,-21,-4,16,38,61
F,130,-22,-1,22,47,72
F,160,-25,-2,23,50,78
F,200,-33,-8,20,50,80
F,250,-47,-20,11,43,76`,
  dip: `M,120,-7,31,77,129,185
M,160,6,52,106,166,229
M,200,14,66,126,193,262
M,250,19,76,143,215,290
M,300,18,80,152,229,309
F,100,-32,-6,27,65,106
F,130,-33,-1,37,80,126
F,160,-35,0,43,90,139
F,200,-42,-2,44,96,150
F,250,-55,-11,40,96,154`,
};
const ADDED = { pull_up: 1, chin_up: 1, dip: 1 };   // published as added weight → store bodyweight + added

const lifts = {}, problems = [];
for (const key of Object.keys(RAW)) {
  const out = { m: [], f: [] };
  for (const line of RAW[key].trim().split('\n')) {
    const p = line.split(','), s = p[0] === 'M' ? 'm' : p[0] === 'F' ? 'f' : null, bw = +p[1], v = p.slice(2).map(Number);
    if (!s || v.length !== 5 || v.some(isNaN)) { problems.push(key + ': bad line ' + line); continue; }
    if (ANCHORS[s][out[s].length] !== bw) problems.push(key + ': expected anchor ' + ANCHORS[s][out[s].length] + ' got ' + bw);
    out[s].push(ADDED[key] ? v.map(x => x + bw) : v);
  }
  for (const s of ['m', 'f']) {
    if (out[s].length !== 5) problems.push(key + ' ' + s + ': need 5 rows, have ' + out[s].length);
    out[s].forEach((row, i) => {
      for (let k = 1; k < 5; k++) if (!(row[k] > row[k - 1])) problems.push(key + ' ' + s + ' bw ' + ANCHORS[s][i] + ': levels not increasing ' + row);
      if (i) for (let k = 0; k < 5; k++) if (!(row[k] > out[s][i - 1][k])) problems.push(key + ' ' + s + ' level ' + k + ': not increasing with bodyweight at ' + ANCHORS[s][i]);
      const r = row[2] / ANCHORS[s][i];          // intermediate / bodyweight sanity window
      if (r < 0.15 || r > 4) problems.push(key + ' ' + s + ' bw ' + ANCHORS[s][i] + ': intermediate ratio ' + r.toFixed(2) + ' out of range');
    });
  }
  lifts[key] = out;
}
if (problems.length) { console.error('STANDARDS VALIDATION FAILED\n' + problems.join('\n')); process.exit(1); }

const data = {
  source: 'Strength Level (strengthlevel.com) published strength standards, 1RM by bodyweight',
  url: 'https://strengthlevel.com/strength-standards',
  retrieved: '2026-10-13',
  population: 'people who lift and log their lifts, same sex and bodyweight',
  pcts: [5, 20, 50, 80, 95],
  anchors: ANCHORS,
  lifts,
};
const js = `/* Arise strength standards. GENERATED by tools/build-standards.js — do not edit by hand.
   Thresholds are 1RM in lb at five bodyweight anchors per sex, for the levels
   Beginner / Novice / Intermediate / Advanced / Elite = stronger than 5 / 20 / 50 / 80 / 95% of
   PEOPLE WHO LIFT AND LOG THEIR LIFTS (same sex and bodyweight). Not the general population.
   Calibrated to the published standards at ${data.url} (retrieved ${data.retrieved}). See THIRD_PARTY.md.
   Dumbbell lifts are per dumbbell. Pull-up, chin-up and dip are total load (bodyweight + added). */
(typeof module !== 'undefined' && module.exports ? module.exports : window).ARISE_STANDARDS = ${JSON.stringify(data)};
`;
fs.writeFileSync(path.join(__dirname, '..', 'standards.js'), js);
console.log('standards.js written:', Object.keys(lifts).length, 'lifts,', js.length, 'bytes');
