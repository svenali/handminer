import { Request, Response } from 'express';
import mempool from '../mempool';
import { MempoolSamplerService } from '../services/handminer/mempool-sampler.service';

const sampler = new MempoolSamplerService();

export class HandminerController {

  public getMempool(req: Request, res: Response) {
    console.log('HandminerController.getMempool called');
    if (!mempool.isInSync()) {
      res.statusCode = 503;
      res.send('Service Unavailable');
      return;
    }
    const raw = mempool.getMempool();
    const txs = sampler.sample(raw, 300);

    res.json({
      total: Object.keys(raw).length,
      sampled: txs.length,
      txs
    });
  }
}