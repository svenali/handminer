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
    console.log("Registering route:", path);

    app.get(path, controller.getMempool);
  }
}

export default new HandminerRoutes();