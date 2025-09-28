import { Router } from 'express';
import {
  getAllAvitoAccounts,
  getAllAvitoAccountsWithProxy,
  getAvitoAccountById,
  createAvitoAccount,
  updateAvitoAccount,
  deleteAvitoAccount,
  testAvitoConnection,
  syncAvitoAccount,
  syncAllAvitoAccounts,
  testProxyConnection,
  getOnlineStatuses,
  toggleEternalOnline,
  diagnoseAvitoConnection,
  getAllRatingsInfo,
  getAccountReviews,
  createReviewAnswer,
} from '../controllers/avitoController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// All Avito routes require admin privileges
router.use(requireAdmin);

// GET /api/avito - Get all Avito accounts
router.get('/', getAllAvitoAccounts);

// GET /api/avito/proxy-data - Get all Avito accounts with proxy data
router.get('/proxy-data', getAllAvitoAccountsWithProxy);

// GET /api/avito/online-statuses - Get online statuses and eternal online settings
router.get('/online-statuses', getOnlineStatuses);

// GET /api/avito/ratings - Get ratings info for all accounts
router.get('/ratings', getAllRatingsInfo);

// GET /api/avito/:id - Get Avito account by ID
router.get('/:id', getAvitoAccountById);

// POST /api/avito - Create new Avito account
router.post('/', createAvitoAccount);

// PUT /api/avito/:id - Update Avito account
router.put('/:id', updateAvitoAccount);

// DELETE /api/avito/:id - Delete Avito account
router.delete('/:id', deleteAvitoAccount);

// POST /api/avito/:id/test - Test Avito API connection
router.post('/:id/test', testAvitoConnection);

// POST /api/avito/:id/sync - Sync Avito account data
router.post('/:id/sync', syncAvitoAccount);

// POST /api/avito/sync-all - Sync all Avito accounts
router.post('/sync-all', syncAllAvitoAccounts);

// POST /api/avito/test-proxy - Test proxy connection
router.post('/test-proxy', testProxyConnection);

// POST /api/avito/:id/eternal-online - Toggle eternal online for account
router.post('/:id/eternal-online', toggleEternalOnline);

// POST /api/avito/:id/diagnose - Detailed diagnosis of proxy and Avito API issues
router.post('/:id/diagnose', diagnoseAvitoConnection);

// === ROUTES FOR REVIEWS AND RATINGS ===

// GET /api/avito/:id/reviews - Get reviews for specific account
router.get('/:id/reviews', getAccountReviews);

// POST /api/avito/:id/reviews/answer - Create answer for review
router.post('/:id/reviews/answer', createReviewAnswer);

export default router;
