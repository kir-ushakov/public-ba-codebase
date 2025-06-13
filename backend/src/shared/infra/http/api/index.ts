import express from 'express';
import { syncRouter } from '../../../../modules/sync/routers/index.js';
import { authRouter } from '../../../../modules/auth/routers/index.js';
import { integrationsRouter } from '../../../../modules/integrations/router.js';
import { isAuthenticated } from '../../auth/index.js';
import { filesRouter } from '../../../../modules/files/router.js';
import { aIRouter } from '../../../../modules/ai/router.js';

const apiRouters = express.Router();

apiRouters.get('/', (req, res) => {
  return res.json({ message: 'BA backend up!' });
});

apiRouters.use('/api/auth', authRouter);
apiRouters.use('/api/sync', isAuthenticated, syncRouter);
apiRouters.use('/api/integrations', integrationsRouter);
apiRouters.use('/api/files/', isAuthenticated, filesRouter);
apiRouters.use('/api/ai/', isAuthenticated, aIRouter);

export { apiRouters };
