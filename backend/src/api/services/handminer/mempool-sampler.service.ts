import { HandminerMempoolTx } from '../../handminer/handminer.types';

export class MempoolSamplerService {

  sample(raw: Record<string, any>, limit = 300): HandminerMempoolTx[] {

    const all: HandminerMempoolTx[] = Object.entries(raw).map(
      ([txid, entry]) => {

        const vsize = entry.vsize ?? entry.adjustedVsize;
        if (!vsize) {
          throw new Error(`TX ${txid} has no vsize`);
        }

        // fee ist bei dir bereits in SAT
        const feeSat =
          typeof entry.fee === 'number'
            ? entry.fee
            : Math.round((entry.fees?.base ?? 0) * 1e8);

        const rate =
          entry.effectiveFeePerVsize ??
          entry.feePerVsize ??
          feeSat / vsize;

        return {
          txid,
          vsize,
          fee: feeSat,
          rate
        };
      }
    );

    // Fee-Rate-Buckets (miner-realistisch)
    const buckets = [
      all.filter(tx => tx.rate < 2),
      all.filter(tx => tx.rate >= 2 && tx.rate < 5),
      all.filter(tx => tx.rate >= 5 && tx.rate < 10),
      all.filter(tx => tx.rate >= 10 && tx.rate < 50),
      all.filter(tx => tx.rate >= 50),
    ];

    const perBucket = Math.floor(limit / buckets.length);

    return buckets.flatMap(bucket =>
      bucket
        .sort(() => Math.random() - 0.5)
        .slice(0, perBucket)
    );
  }
}