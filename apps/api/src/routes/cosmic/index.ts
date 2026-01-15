/**
 * Cosmic Companion Routes Index
 *
 * Aggregates all Cosmic Companion API routes.
 */

import { Router } from 'express';
import birthChartRoutes from './birth-chart.routes.js';
import companionRoutes from './companion.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

// Mount routes
router.use(birthChartRoutes);
router.use(companionRoutes);
router.use(chatRoutes);

export default router;
