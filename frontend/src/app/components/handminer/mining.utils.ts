import SHA256 from '../../../../node_modules/crypto-js/sha256';
import Hex from '../../../../node_modules/crypto-js/enc-hex';

export function sha256d(data: string): string {
  return SHA256(SHA256(data)).toString(Hex);
}

export function computeMerkleRoot(txids: string[]): string {

  if (!txids.length) {
    return '';
  }

  let layer = [...txids];

  while (layer.length > 1) {

    const next: string[] = [];

    for (let i = 0; i < layer.length; i += 2) {

      const left = layer[i];
      const right = i + 1 < layer.length ? layer[i+1] : left;

      next.push(sha256d(left + right));
    }

    layer = next;
  }

  return layer[0];
}

export function computeBlockHash(
  prevHash: string,
  merkleRoot: string,
  nonce: number,
  timestamp: number
): string {

  const header =
    prevHash +
    merkleRoot +
    timestamp.toString(16) +
    nonce.toString(16);

  return sha256d(header);
}

export function isValidHash(hash: string, difficulty: number): boolean {

  const prefix = "0".repeat(difficulty);

  return hash.startsWith(prefix);
}