import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { HandminerService, MempoolTx } from './handminer.service';
import { SlicePipe, DecimalPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MempoolBarrelComponent } from './mempool-barrel/mempool-barral.component';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-handminer',
  templateUrl: './handminer.html',
  styleUrl: './handminer.scss',
  imports: [MempoolBarrelComponent, SharedModule, SlicePipe, DecimalPipe, CommonModule, DragDropModule],  // Angular 14 standalone component, wichtig hier, damit diese auch im HTML - Template genutzt werden können
})

export class Handminer implements OnInit {
  mempoolTxs: MempoolTx[] = [];
  blockTxs: MempoolTx[] = [];

  private mempoolTimer?: any;
  public fillLevel = 0; // 0 … 1 -> the more txs are added to the block, the higher the fill level

  constructor(private handminerService: HandminerService) {}

  ngOnInit(): void {
    this.loadMempool();

    this.mempoolTimer = setInterval(() => {
      this.loadMempool();
    }, 8000); // 👈 alle 8 Sekunden
  }

  ngOnDestroy(): void {
    clearInterval(this.mempoolTimer);
  }

  loadMempool(): void {
    this.handminerService.getMempoolTX().subscribe(res => {
      //this.mempoolTxs = res.txs;
      this.mergeMempoolTxs(res.txs);
    });
  }

  private mergeMempoolTxs(newTxs: MempoolTx[]): void {
    this.fillLevel = Math.min(1, this.fillLevel + newTxs.length * 0.0005);
    this.fillLevel = Math.max(0, this.fillLevel - 0.01);
    const now = Date.now();

    // Index bestehender TXs
    const index = new Map(
      this.mempoolTxs.map(tx => [tx.txid, tx])
    );

    // neue TXs oder „wieder gesehene“ behandeln
    for (const tx of newTxs) {
      const existing = index.get(tx.txid);

      if (existing) {
        // 👈 DAS ist dein „Beim Wiederfinden“
        existing.lastSeen = now;
      } else {
        this.mempoolTxs.push({
          ...tx,
          lastSeen: now
        });
      }
    }

    // 🧹 Soft-Eviction statt hartem Löschen
    const TTL = 30_000; // 30 Sekunden

    this.mempoolTxs = this.mempoolTxs.filter(tx => {
      return now - tx.lastSeen < TTL;
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

  onDropToBlock(event: CdkDragDrop<MempoolTx[]>): void {
    const tx = event.item.data as MempoolTx;

    // schon im Block? → ignorieren
    if (this.blockTxs.find(t => t.txid === tx.txid)) {
      return;
    }

    // ➕ in Block
    this.blockTxs.push(tx);

    // ➖ aus Mempool entfernen
    this.mempoolTxs = this.mempoolTxs.filter(t => t.txid !== tx.txid);
  }

}
