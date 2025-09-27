const y = 0x0101010101010101n, b = 0x8080808080808080n, f = 0xffffffffffffffffn, u = f ^ y, l = f ^ b;
function h(t) {
  return (t & l) << 1n;
}
function _(t) {
  return (t & u) >> 1n;
}
function m(t) {
  return t << 8n;
}
function A(t) {
  return t >> 8n;
}
function B(t) {
  return (t & l) << 9n;
}
function I(t) {
  return (t & u) << 7n;
}
function d(t) {
  return (t & l) >> 7n;
}
function v(t) {
  return (t & u) >> 9n;
}
const E = [
  h,
  _,
  m,
  A,
  B,
  I,
  d,
  v
];
function T(t) {
  let n = 0n, o = BigInt(t);
  for (; o > 1n; )
    o >>= 1n, n++;
  return Number(n);
}
function g(t, n) {
  return (7 - t) * 8 + n;
}
function k(t) {
  if (t < 0 || t > 63) throw new Error("Invalid bit index: " + t);
  const o = 7 - (t / 8 | 0), r = t % 8;
  return [o, r];
}
function x(t) {
  const n = [];
  let o = BigInt(t);
  for (; o; ) {
    const r = o & -o, e = T(r), [i, c] = k(e);
    n.push({ row: i, col: c }), o ^= r;
  }
  return n;
}
function p(t) {
  return t && typeof t.length == "number" && typeof t.subarray == "function";
}
function L(t) {
  const n = new Uint8Array(64);
  for (let o = 0; o < 8; o++)
    for (let r = 0; r < 8; r++) {
      const e = t[o][r];
      n[o * 8 + r] = e === "black" ? 1 : e === "white" ? 2 : 0;
    }
  return n;
}
function N(t) {
  let n = 0n, o = 0n;
  for (let r = 0; r < 64; r++) {
    const e = t[r] | 0;
    if (e === 0) continue;
    const i = r / 8 | 0, c = r % 8, s = g(i, c), a = 1n << BigInt(s);
    e === 1 ? n |= a : e === 2 && (o |= a);
  }
  return { bp: n, wp: o };
}
function w(t) {
  let n;
  if (p(t) ? n = t : Array.isArray(t) && Array.isArray(t[0]) ? n = L(t) : Array.isArray(t) ? n = Uint8Array.from(t) : t && t.cells && p(t.cells) ? n = t.cells : n = new Uint8Array(64), n._bp === void 0 || n._wp === void 0) {
    const { bp: o, wp: r } = N(n);
    n._bp = o, n._wp = r;
  }
  return n;
}
function S(t, n, o) {
  let r = o(t) & n;
  return r |= o(r) & n, r |= o(r) & n, r |= o(r) & n, r |= o(r) & n, r |= o(r) & n, o(r);
}
function M(t, n) {
  const o = w(n), r = t === 1 ? o._bp : o._wp, e = t === 1 ? o._wp : o._bp, i = ~(r | e) & f;
  let c = 0n;
  for (const s of E)
    c |= S(r, e, s);
  return c & i;
}
function U(t) {
  return t === "black" ? 1 : 2;
}
function O(t, n) {
  const o = U(t), r = M(o, n);
  return x(r);
}
function R(t) {
  const n = new Uint8Array(64);
  for (let o = 0; o < 8; o++)
    for (let r = 0; r < 8; r++) {
      const e = t[o][r], i = o * 8 + r;
      e === "black" ? n[i] = 1 : e === "white" ? n[i] = 2 : n[i] = 0;
    }
  return n;
}
function V(t, n) {
  const o = w(R(t));
  return O(n, o);
}
export {
  R as boardToBitBoard,
  V as getValidMoves
};
