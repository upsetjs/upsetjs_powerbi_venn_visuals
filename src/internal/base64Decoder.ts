function utf8Decode(e: string) {
  let t = '';
  let n = 0;
  // 6 bit encoding
  while (n < e.length) {
    const r = e.charCodeAt(n++);
    if (r < 128) {
      t += String.fromCharCode(r);
    } else if (r > 191 && r < 224) {
      const c2 = e.charCodeAt(n++);
      t += String.fromCharCode(((r & 31) << 6) | (c2 & 63));
    } else {
      const c2 = e.charCodeAt(n++);
      const c3 = e.charCodeAt(n++);
      t += String.fromCharCode(((r & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
    }
  }
  return t;
}

// base 64 decoding with custom key order
function decode(e: string, key: string) {
  let t = '';
  let f = 0;
  e = e.replace(/[^A-Za-z0-9+/=]/g, '');
  while (f < e.length) {
    const s = key.indexOf(e.charAt(f++));
    const o = key.indexOf(e.charAt(f++));
    const u = key.indexOf(e.charAt(f++));
    const a = key.indexOf(e.charAt(f++));
    const n = (s << 2) | (o >> 4);
    const r = ((o & 15) << 4) | (u >> 2);
    const i = ((u & 3) << 6) | a;
    t = t + String.fromCharCode(n);
    if (u !== 64) {
      t = t + String.fromCharCode(r);
    }
    if (a !== 64) {
      t = t + String.fromCharCode(i);
    }
  }
  t = utf8Decode(t);
  return t;
}

export default function base64Decoder(key: string) {
  function decodeImpl(code: string) {
    if (!code || code.trim().length === 0) {
      return null;
    }
    if (!code.includes(':')) {
      return null;
    }
    // decode each : part
    return code
      .split(':')
      .map((d) => decode(d, key))
      .join(':');
  }

  return (code: string) => Promise.resolve(decodeImpl(code));
}
