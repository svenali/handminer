import { Request, Response } from 'express';
import mempool from '../mempool';
import { MempoolSamplerService } from '../services/handminer/mempool-sampler.service';
import blocks from '../blocks';

const sampler = new MempoolSamplerService();

export class HandminerController {

  public getMempool(req: Request, res: Response) {
    console.log('HandminerController.getMempool called');
    if (!mempool.isInSync()) {
      res.status(503).send('Service Unavailable');
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

  public async getTipHash(req: Request, res: Response) {
    try {
      const blocksList = blocks.getBlocks();

      if (!blocksList.length) {
        return res.status(500).json({
          error: "no blocks available"
        });
      }

      const tip = blocksList[0];

      res.json({
        hash: tip.id,
        height: tip.height
      });

    }
    catch (e) {
      res.status(500).json({
        error: "failed to fetch tip hash"
      });

    }
  }
}