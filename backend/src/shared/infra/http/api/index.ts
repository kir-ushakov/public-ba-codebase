import express from 'express';
import { syncRouter } from '../../../../modules/sync/routers';
import { authRouter } from '../../../../modules/auth/routers';
import { integrationsRouter } from '../../../../modules/integrations/router';
import { isAuthenticated } from '../../auth';

const apiRouters = express.Router();

apiRouters.get('/', (req, res) => {
  return res.json({ message: 'BA backend up!' });
});

apiRouters.use('/api/auth', authRouter);
apiRouters.use('/api/sync', isAuthenticated, syncRouter);
apiRouters.use('/api/integrations', integrationsRouter);

export { apiRouters };
