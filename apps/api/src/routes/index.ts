import { Router } from 'express';

import healthRouter from './health';
import profileRouter from './profile';
import projectsRouter from './projects';

const router = Router();

// Health check routes
router.use('/health', healthRouter);

// Profile routes
router.use('/profile', profileRouter);

// Project routes
router.use('/projects', projectsRouter);

// TODO: Add more routes here
// router.use('/chat', chatRouter);
// router.use('/proposals', proposalsRouter);
// router.use('/blog', blogRouter);

export default router;
