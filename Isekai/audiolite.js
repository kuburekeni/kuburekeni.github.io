// =====================================================================
//  audiolite.js : keeps the music scheduler steady after a stall
//  Music is queued a little ahead of the audio clock. If a frame or a
//  pause outlasts that queue, the scheduler used to fire every missed
//  note at once (a crunchy burst). Now it skips the missed notes and
//  picks the tune up where the audio clock actually is.
//  (The old low-power sound modes are gone: full-quality sound everywhere.)
// =====================================================================
const AudioLite = { tier: 0, ratio: 1, skips: 0, AHEAD: 0.3 };

(function () {
  const S = Sound;
  const sched0 = S._sched;
  S._sched = function (tr, until) {
    const c = this.ctx;
    if (c && tr && !tr.done) {
      const now = c.currentTime, P = tr.piece, N = tr.n;
      if (tr.t < now - 0.03 && P && N) {
        const stepDur = 60 / P.bpm / 2;
        let guard = 0;
        while (tr.t < now + 0.05 && guard++ < 5000) {
          tr.step++; tr.t += stepDur;
          if (tr.step >= N.secs[tr.sec].total) {
            tr.step = 0; tr.sec++;
            if (tr.sec >= N.secs.length) {
              if (P.loop === false) { tr.done = true; if (this.timer) clearInterval(this.timer); this.timer = null; return; }
              tr.sec = P.loopFrom || 0; tr.pass = (tr.pass || 0) + 1;
            }
          }
        }
        AudioLite.skips++;
      }
      until = Math.max(until, now + AudioLite.AHEAD);
    }
    return sched0.call(this, tr, until);
  };
})();
