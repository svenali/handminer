import { Component, Input, OnChanges, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MempoolTx } from '../handminer.service';
import { DragDropModule } from '@angular/cdk/drag-drop';

interface BarrelTx extends MempoolTx {
  sizePx: number;
  color: string;
  x: number;
  y: number;
  rot: number;
  targetY: number;
};

@Component({
  selector: 'mempool-barrel',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './mempool-barrel.component.html',
  styleUrls: ['./mempool-barrel.component.scss']
})
export class MempoolBarrelComponent implements OnChanges, AfterViewInit {
  @ViewChild('barrel')
  barrelRef!: ElementRef<HTMLDivElement>;

  private barrelWidth = 0;
  private barrelHeight = 0;

  // prevent overload
  private readonly MAX_TXS = 180;

  // Save and remember tx by txid for easy access, served by backend
  private txIndex = new Map<string, BarrelTx>();

  ngAfterViewInit(): void {
    this.updateBarrelSize();

    console.log(
      '[ngAfterViewInit] measured barrel:',
      this.barrelWidth,
      this.barrelHeight
    );
  }

  private updateBarrelSize(): void {
    const rect = this.barrelRef.nativeElement.getBoundingClientRect();
    this.barrelWidth = rect.width;
    this.barrelHeight = rect.height;
  }

  @HostListener('window:resize') onResize(): void {
    this.updateBarrelSize();
  }

  @Input() txs: MempoolTx[] = [];
  @Input() fillLevel = 0;

  barrelTxs: BarrelTx[] = [];

  ngOnChanges(): void {
    if (!this.barrelWidth || !this.barrelHeight) return;

    for (const tx of this.txs) {
      if (!this.txIndex.has(tx.txid)) {
        const barrelTx = this.spawnTx(tx);
        this.txIndex.set(tx.txid, barrelTx);
        this.barrelTxs.push(barrelTx);
        this.dropTx(barrelTx);
      }
    }

    const TTL = 30_000; // 30 Sekunden

    this.barrelTxs = this.barrelTxs.filter(tx => {
      const alive = Date.now() - tx.lastSeen < TTL;
      if (!alive) {
        this.txIndex.delete(tx.txid);
      } 
      return alive;
    });
  }

  private dropTx(tx: BarrelTx): void {
    setTimeout(() => {
      tx.y = tx.targetY;
      tx.x += (Math.random() - 0.5) * 14;
    }, 30);
  }

  private spawnTx(tx: MempoolTx): BarrelTx {
    const size = this.computeSize(tx.vsize);
    const bottom = this.barrelHeight - 30;
    //const depth = 120;
    const maxDepth = 120 + this.fillLevel * 180;

    return {
      ...tx,
      sizePx: size,
      color: this.computeColor(tx.rate),
      x: Math.random() * (this.barrelWidth - size),
      y: -size - Math.random() * 50,
      targetY: bottom - Math.random() * maxDepth, // 👈 EINMAL
      rot: (Math.random() - 0.5) * 25,
      lastSeen: Date.now()
    };
  }

  private computeSize(vsize: number): number {
    return Math.max(8, Math.min(24, vsize / 80));
  }

  computeColor(rate: number): string {
    if (rate < 2) {
      return '#7a0000';
    }
    if (rate < 5) {
      return '#d35400';
    }
    if (rate < 10) {
      return '#f1c40f';
    }
    if (rate < 50) {
      return '#2ecc71';
    }

    return '#00ff6a';
  }

  randomTransform(i: number): string {
    const r = (i * 17) % 15 - 7;   // leichte Rotation
    const x = (i%2 === 0) ? (i * 37) % 80 : (i * 12) % 80;
    const y = (i%2 === 0) ? (i * 53) % 20 : ((i * 13) % 120);

    return `translate(${x}px, ${y}px) rotate(${r}deg)`;
  }

  blockSize(tx: MempoolTx): number {
    return Math.max(6, Math.min(40, tx.vsize / 30));
  }
}