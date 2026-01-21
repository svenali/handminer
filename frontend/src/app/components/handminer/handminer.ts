import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { HandminerService, MempoolTx } from './handminer.service';
import { SlicePipe, DecimalPipe } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-handminer',
  templateUrl: './handminer.html',
  styleUrl: './handminer.scss',
  imports: [SharedModule, SlicePipe, DecimalPipe, CommonModule],  // Angular 14 standalone component, wichtig hier, damit diese auch im HTML - Template genutzt werden können
})
export class Handminer implements OnInit {
  mempoolTxs: MempoolTx[] = [];
  blockTxs: MempoolTx[] = [];

  constructor(private handminerService: HandminerService) {}

  ngOnInit(): void {
    this.loadMempool();
  }

  loadMempool(): void {
    this.handminerService.getRecentMempoolTxs().subscribe(txs => {
      this.mempoolTxs = txs;
    });
  }

  addToBlock(tx: MempoolTx): void {
    this.blockTxs.push(tx);
    this.mempoolTxs = this.mempoolTxs.filter(t => t.txid !== tx.txid);
  }

  removeFromBlock(tx: MempoolTx): void {
    this.mempoolTxs.push(tx);
    this.blockTxs = this.blockTxs.filter(t => t.txid !== tx.txid);
  }

  get totalVSize(): number {
    return this.blockTxs.reduce((sum, tx) => sum + tx.vsize, 0);
  }

  get totalFees(): number {
    return this.blockTxs.reduce((sum, tx) => sum + tx.fee, 0);
  }
}
