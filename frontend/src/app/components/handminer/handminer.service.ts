import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';

export interface MempoolTx {
  txid: string;
  fee: number;
  vsize: number;
  rate: number;
  value: number;
  time: number;
}

export interface MempoolTxIds {
  txid: string;
}

@Injectable({ providedIn: 'root' })
export class HandminerService {
  private apiBaseUrl: string; // base URL is protocol, hostname, and port
  private apiBasePath: string; // network path is /testnet, etc. or '' for mainnet

  constructor(private http: HttpClient, private stateService: StateService, private apiService: ApiService) {
    this.apiBaseUrl = '';
    this.apiBasePath = '';

    if (!stateService.isBrowser) { // except when inside AU SSR process
      this.apiBaseUrl = this.stateService.env.NGINX_PROTOCOL + '://' + this.stateService.env.NGINX_HOSTNAME + ':' + this.stateService.env.NGINX_PORT;
    }

    this.stateService.networkChanged$.subscribe((network) => {
      this.apiBasePath = network && network !== this.stateService.env.ROOT_NETWORK ? '/' + network : '';
    });
  }

  getRecentMempoolTxs(): Observable<MempoolTx[]> {
    return this.http.get<MempoolTx[]>(this.apiBaseUrl + this.apiBasePath + '/api/v1/mempool/recent');
  }

  getAllMempoolTxIds(): Observable<MempoolTxIds[]> {
    return this.http.get<MempoolTxIds[]>(this.apiBaseUrl + this.apiBasePath + '/api/v1/mempool/txids');
  }

  getMempoolTxDetails(txid: string): Observable<MempoolTx> {
    return this.http.get<MempoolTx>(this.apiBaseUrl + this.apiBasePath + '/api/v1/mempool/tx/' + txid);
  }

  /* getAllMempoolTxs(): Observable<MempoolTx[]> {
    return this.http.get<MempoolTx[]>(this.apiBaseUrl + this.apiBasePath + '/api/v1/mempool/txs');
  } */
}
