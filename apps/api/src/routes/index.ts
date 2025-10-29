import { Router } from 'express';

import healthRouter from './health';
import profileRouter from './profile';

const router = Router();

// Health check routes
router.use('/health', healthRouter);

// Profile routes
router.use('/profile', profileRouter);

// TODO: Add more routes here
// router.use('/projects', projectsRouter);
// router.use('/chat', chatRouter);
// router.use('/proposals', proposalsRouter);
// router.use('/blog', blogRouter);

export default router;
