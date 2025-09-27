var M = Object.defineProperty;
var W = (a, e, o) => e in a ? M(a, e, { enumerable: !0, configurable: !0, writable: !0, value: o }) : a[e] = o;
var u = (a, e, o) => W(a, typeof e != "symbol" ? e + "" : e, o);
class x {
  constructor(e) {
    u(this, "config");
    u(this, "pool", []);
    u(this, "jobs", /* @__PURE__ */ new Map());
    u(this, "jobSeq", 0);
    const o = (() => {
      try {
        const t = navigator == null ? void 0 : navigator.hardwareConcurrency;
        if (typeof t == "number" && t > 0) return Math.min(8, Math.max(1, Math.floor(t / 2)));
      } catch {
      }
      return 2;
    })();
    this.config = {
      poolSize: Math.max(1, e.poolSize ?? o),
      workerURL: e.workerURL || "/search-worker.js",
      workerTimeout: Math.max(200, e.workerTimeout),
      earlyStopThreshold: e.earlyStopThreshold ?? 1 / 0,
      consoleTag: e.consoleTag ?? "[SearchMgr]",
      engineModuleURL: e.engineModuleURL ?? "/engine-zenith.js",
      engineExportName: e.engineExportName ?? "alphaBetaSearch"
    }, this.spawnPool();
  }
  /* ------------------------ Public API ------------------------ */
  async searchSingle(e, o, t) {
    const r = this.newJobId(), s = t.timeLimit ?? this.config.workerTimeout, n = this.getFreeWorker();
    if (!n) throw new Error("No available workers");
    return new Promise((i, l) => {
      const c = {
        id: r,
        distributed: !1,
        start: performance.now(),
        timer: null,
        resolve: i,
        reject: l,
        assignedWorkerIds: [n.id],
        responses: [],
        player: o
      };
      this.jobs.set(r, c), c.timer = setTimeout(() => {
        this.log("Timeout(single):", r), this.finishWithBest(
          r,
          /*hardCancel=*/
          !0
        );
      }, s), n.busy = !0, n.currentJob = r;
      const h = {
        type: "search",
        payload: {
          id: r,
          mode: "single",
          player: o,
          gameCore: e,
          options: {
            ...t,
            engineModuleURL: t.engineModuleURL ?? this.config.engineModuleURL,
            engineExportName: t.engineExportName ?? this.config.engineExportName
          }
        }
      };
      n.worker.postMessage(h);
    });
  }
  async searchDistributed(e, o, t, r) {
    if (!r || r.length === 0)
      return this.searchSingle(e, o, t);
    const s = this.newJobId(), n = t.timeLimit ?? this.config.workerTimeout, i = this.getFreeWorkers(Math.min(this.pool.length, r.length));
    if (i.length === 0) throw new Error("No available workers");
    const l = i.length, c = Math.max(50, Math.floor(n * 0.9 / l)), h = E(r), d = v(h, l);
    return new Promise((w, b) => {
      const p = {
        id: s,
        distributed: !0,
        start: performance.now(),
        timer: null,
        resolve: w,
        reject: b,
        assignedWorkerIds: [],
        responses: [],
        player: o
      };
      this.jobs.set(s, p), p.timer = setTimeout(() => {
        this.log("Timeout(distributed):", s), this.finishWithBest(
          s,
          /*hardCancel=*/
          !0
        );
      }, n);
      for (let f = 0; f < i.length; f++) {
        const g = i[f], k = d[f];
        p.assignedWorkerIds.push(g.id), g.busy = !0, g.currentJob = s;
        const y = {
          type: "search",
          payload: {
            id: s,
            mode: "distributed",
            player: o,
            gameCore: e,
            options: {
              ...t,
              timeLimit: c,
              engineModuleURL: t.engineModuleURL ?? this.config.engineModuleURL,
              engineExportName: t.engineExportName ?? this.config.engineExportName
            },
            rootMoves: k
          }
        };
        g.worker.postMessage(y);
      }
    });
  }
  /** 현재 진행 중인 잡을 강제 취소(하드 캔슬 + 재시작) */
  cancelJob(e) {
    const o = this.jobs.get(e);
    if (!o) return;
    this.log("Cancel job:", e), this.jobs.delete(e), o.timer && clearTimeout(o.timer);
    for (const r of o.assignedWorkerIds)
      this.restartWorker(r);
    const t = performance.now() - o.start;
    o.reject(new Error(`Job cancelled: ${e} (${t.toFixed(1)}ms)`));
  }
  /** 풀 정리 */
  destroy() {
    for (const e of this.pool)
      try {
        e.worker.terminate();
      } catch {
      }
    this.pool = [];
    for (const [, e] of this.jobs)
      e.timer && clearTimeout(e.timer), e.reject(new Error("Manager destroyed"));
    this.jobs.clear();
  }
  /* ------------------------ Internals ------------------------ */
  spawnPool() {
    for (let e = 0; e < this.config.poolSize; e++)
      this.pool.push(this.spawnWorker(e));
  }
  spawnWorker(e) {
    const o = new Worker(this.config.workerURL, { type: "module" }), t = { id: e, worker: o, busy: !1 };
    return o.onmessage = (r) => {
      const s = r.data;
      this.onWorkerMessage(t, s);
    }, o.onerror = (r) => {
      this.log("Worker error:", e, r), this.restartWorker(e);
    }, t;
  }
  restartWorker(e) {
    const o = this.pool.findIndex((r) => r.id === e);
    if (o < 0) return;
    try {
      this.pool[o].worker.terminate();
    } catch {
    }
    const t = this.spawnWorker(e);
    this.pool[o] = t;
  }
  onWorkerMessage(e, o) {
    const t = this.jobs.get(o.id);
    if (e.busy = !1, e.currentJob = void 0, !t) {
      this.log("Stale response from worker", e.id, o.id);
      return;
    }
    if (t.responses.push(o), o.success && typeof o.evaluation == "number" && Math.abs(o.evaluation) >= this.config.earlyStopThreshold) {
      this.log("Early stop by worker", e.id, "score", o.evaluation), this.finishWithBest(
        t.id,
        /*hardCancel=*/
        !0
      );
      return;
    }
    t.distributed ? t.assignedWorkerIds.every(
      (s) => {
        var n;
        return ((n = this.pool.find((i) => i.id === s)) == null ? void 0 : n.busy) === !1;
      }
    ) && this.finishWithBest(
      t.id,
      /*hardCancel=*/
      !1
    ) : this.finishWithBest(
      t.id,
      /*hardCancel=*/
      !1
    );
  }
  finishWithBest(e, o) {
    const t = this.jobs.get(e);
    if (!t) return;
    this.jobs.delete(e), t.timer && clearTimeout(t.timer);
    for (const n of t.assignedWorkerIds)
      if (o) this.restartWorker(n);
      else {
        const i = this.pool.find((l) => l.id === n);
        i && (i.busy = !1, i.currentJob = void 0);
      }
    const r = performance.now() - t.start, s = j(t.responses, t.player);
    if (s) {
      const n = t.responses.reduce((i, l) => i + (l.nodes ?? 0), 0);
      t.resolve({
        success: !0,
        bestMove: s.bestMove,
        evaluation: s.evaluation,
        nodes: n,
        pv: s.pv ?? [],
        time: r,
        details: t.responses.map(({ id: i, ...l }) => l)
      });
    } else
      t.resolve({
        success: !1,
        time: r,
        details: t.responses.map(({ id: n, ...i }) => i)
      });
  }
  newJobId() {
    return `job-${++this.jobSeq}-${Date.now()}`;
  }
  getFreeWorker() {
    return this.pool.find((e) => !e.busy);
  }
  getFreeWorkers(e) {
    const o = [];
    for (const t of this.pool)
      if (t.busy || o.push(t), o.length >= e) break;
    return o;
  }
  log(...e) {
    this.config.consoleTag && console.log(this.config.consoleTag, ...e);
  }
}
function v(a, e) {
  const o = Array.from({ length: e }, () => []);
  for (let t = 0; t < a.length; t++)
    o[t % e].push(a[t]);
  return o;
}
function j(a, e) {
  const o = a.filter((r) => r.success && typeof r.evaluation == "number");
  if (o.length === 0) return null;
  let t = o[0];
  for (let r = 1; r < o.length; r++) {
    const s = o[r], n = s.evaluation, i = t.evaluation, l = s.bestMove, c = t.bestMove;
    if (l && c) {
      const h = m(l), d = m(c);
      h === d ? n > i && (t = s) : !h && d && n >= i - 20 && (t = s);
    } else
      n > i && (t = s);
  }
  return t;
}
function m(a) {
  const { row: e, col: o } = a;
  return e === 1 && o === 1 || e === 1 && o === 6 || e === 6 && o === 1 || e === 6 && o === 6;
}
function E(a) {
  return a.slice().sort((e, o) => {
    const t = (e.row === 0 || e.row === 7) && (e.col === 0 || e.col === 7), r = (o.row === 0 || o.row === 7) && (o.col === 0 || o.col === 7);
    if (t && !r) return -1;
    if (!t && r) return 1;
    const s = m(e), n = m(o);
    if (!s && n) return -1;
    if (s && !n) return 1;
    const i = e.row === 0 || e.row === 7 || e.col === 0 || e.col === 7 ? 1 : 0;
    return (o.row === 0 || o.row === 7 || o.col === 0 || o.col === 7 ? 1 : 0) - i;
  });
}
export {
  x as SearchWorkerManager
};
