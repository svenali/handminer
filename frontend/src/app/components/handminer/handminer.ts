import { Component } from '@angular/core';
import { BlockchainComponent } from '../blockchain/blockchain.component';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-handminer',
  templateUrl: './handminer.html',
  styleUrl: './handminer.scss',
  imports: [SharedModule],
})
export class Handminer {
  
}
