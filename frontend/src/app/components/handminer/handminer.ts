import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { HandminerService, MempoolTx } from './handminer.service';
import { SlicePipe, DecimalPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MempoolBarrelComponent } from './mempool-barrel/mempool-barral.component';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

import {
  computeMerkleRoot,
  computeBlockHash,
  isValidHash
} from './mining.utils';

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

  merkleRoot = '';
  blockHash = '';
  nonce = 0;
  mining = false;
  difficulty = 4; // didaktisch sinnvoll
  prevHash = '';
  timestamp = Date.now();

  constructor(private handminerService: HandminerService) {}

  ngOnInit(): void {
    this.loadMempool();

    this.handminerService.getTipHash().subscribe(res => {
      this.prevHash = res.hash;
      this.timestamp = Date.now();
      this.updateHash();
    });

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

  updateHash(): void {
    this.blockHash = computeBlockHash(this.prevHash, this.merkleRoot, this.nonce, this.timestamp);
  }

  updateMerkleRoot(): void {
    const txids = this.blockTxs.map(tx => tx.txid);
    this.merkleRoot = computeMerkleRoot(txids);
    this.updateHash();
  }

  addToBlock(tx: MempoolTx): void {
    this.updateMerkleRoot();

    this.blockTxs.push(tx);
    this.mempoolTxs = this.mempoolTxs.filter(t => t.txid !== tx.txid);
  }

  removeFromBlock(tx: MempoolTx): void {
    this.updateMerkleRoot();

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

  // add random tx to the new mined block, for testing purposes
  addRandomTx(): void {
    const available =
      this.mempoolTxs.filter(
        tx => !this.blockTxs.includes(tx)
      );

    if (!available.length) { 
      return;
    }

    const tx =
      available[Math.floor(Math.random() * available.length)];

    this.addToBlock(tx);
  }

  // add the best tx (highest rate) to the new mined block, for testing purposes
  addBestTx(): void {
    const available =
      this.mempoolTxs.filter(
        tx => !this.blockTxs.includes(tx)
      );

    if (!available.length) {
      return;
    }

    const best =
      available.reduce((a,b)=>
        a.rate > b.rate ? a : b
      );

    this.addToBlock(best);
  }

  autoFillBlock(): void {
    const sorted =
      [...this.mempoolTxs]
        .sort((a,b)=>b.rate-a.rate);

    for (const tx of sorted) {

      if (!this.blockTxs.includes(tx)) {
        this.addToBlock(tx);
      }

      if (this.totalVSize > 1000000) {
        break;
      }
    }
  }

  // Mining
  mine(): void {
    if (this.mining) {
      return;
    }
    this.mining = true;
    const loop = () => {
      if (!this.mining) { 
        return;
      }
      this.nonce++;
      this.updateHash();

      if (isValidHash(this.blockHash, this.difficulty)) {
        console.log('BLOCK FOUND!', this.nonce, this.blockHash);
        this.mining = false;
        return;
      }
      setTimeout(loop, 0);
    };

    loop();
  }

  stopMining(): void {
    this.mining = false;
  }
}
