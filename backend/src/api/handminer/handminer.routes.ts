import { Application, Router } from 'express';
import { HandminerController } from './handminer.controller';
import config from '../../config';

const router = Router();
const controller = new HandminerController();

//router.get('/mempool', controller.getMempool.bind(controller));

//export default router;

class HandminerRoutes {
  public initRoutes(app: Application) {
    const path = config.MEMPOOL.API_URL_PREFIX + 'handminer/mempool';
    const last_blockhash_path = config.MEMPOOL.API_URL_PREFIX + 'handminer/tip';
    console.log("Registering route:", path);

    app.get(path, controller.getMempool);
    app.get(last_blockhash_path, controller.getTipHash);
  }
}

export default new HandminerRoutes();