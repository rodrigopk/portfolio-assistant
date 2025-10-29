import { Router } from 'express';

import healthRouter from './health';

const router = Router();

// Health check routes
router.use('/health', healthRouter);

// TODO: Add more routes here
// router.use('/profile', profileRouter);
// router.use('/projects', projectsRouter);
// router.use('/chat', chatRouter);
// router.use('/proposals', proposalsRouter);
// router.use('/blog', blogRouter);

export default router;
