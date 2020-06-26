export function decodeAndVerifySignature(
  key: JsonWebKey,
  importAlgorithm:
    | string
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | DhImportKeyParams
    | AesKeyAlgorithm,
  verifyAlgorithm: string | RsaPssParams | EcdsaParams | AesCmacParams
) {
  if (!self.crypto || !self.crypto.subtle) {
    return () => Promise.resolve(null);
  }
  const keyPromise = self.crypto.subtle.importKey('jwk', key, importAlgorithm, false, ['verify']);

  return (code: string) => {
    try {
      if (!code.includes(':')) {
        return null;
      }
      const text = btoa(code.slice(0, code.indexOf(':')));
      const sig = new Uint8Array(Array.from(btoa(code.slice(code.indexOf(':') + 1))).map((d) => d.charCodeAt(0)));
      const payload = atob(text);

      const encoded = new TextEncoder().encode(payload);

      return Promise.resolve(
        keyPromise
          .then((key) => self.crypto.subtle.verify(verifyAlgorithm, key, sig, encoded))
          .then((verified) => (verified ? payload : null))
      ).catch(() => null);
    } catch {
      return Promise.resolve(null);
    }
  };
}

export function decodeAndVerifyECDSASignature(key: JsonWebKey) {
  return decodeAndVerifySignature(
    key,
    {
      name: 'ECDSA',
      namedCurve: 'P-384',
    },
    {
      name: 'ECDSA',
      hash: { name: 'SHA-384' },
    }
  );
}

export function signAndEncode(
  key: JsonWebKey,
  importAlgorithm:
    | string
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | DhImportKeyParams
    | AesKeyAlgorithm,
  signAlgorithm: string | RsaPssParams | EcdsaParams | AesCmacParams
) {
  if (!self.crypto || !self.crypto.subtle) {
    return (text: string) => Promise.resolve(text);
  }
  const keyPromise = self.crypto.subtle.importKey('jwk', key, importAlgorithm, false, ['sign']);

  return (payload: string) => {
    try {
      const encoded = new TextEncoder().encode(payload);

      return Promise.resolve(
        keyPromise
          .then((key) => self.crypto.subtle.sign(signAlgorithm, key, encoded))
          .then((sig) => `${btoa(payload)}:${btoa(String.fromCharCode(...new Uint8Array(sig)))}`)
      ).catch(() => null);
    } catch {
      return Promise.resolve(payload);
    }
  };
}

export function signAndEncodeECDA(key: JsonWebKey) {
  return signAndEncode(
    key,
    {
      name: 'ECDSA',
      namedCurve: 'P-384',
    },
    {
      name: 'ECDSA',
      hash: { name: 'SHA-384' },
    }
  );
}

export function compositeDecoder(decoder: readonly ((code: string) => Promise<string | null>)[]) {
  return (code: string) => {
    if (decoder.length === 1) {
      return decoder[0](code);
    }
    if (decoder.length === 0) {
      return Promise.resolve(null);
    }
    const remaining = decoder.slice();
    function next(r: string | null): Promise<string | null> {
      if (r != null || remaining.length === 0) {
        return Promise.resolve(r);
      }
      return remaining.shift()!(code).then(next);
    }
    return next(null);
  };
}
