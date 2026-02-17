export interface HandminerMempoolTx {
  txid: string;
  vsize: number;
  fee: number;   // satoshi
  rate: number;  // sat/vB
}