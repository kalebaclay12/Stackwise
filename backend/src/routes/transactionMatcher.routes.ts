import { Router } from 'express';
import {
  scanForMatches,
  getPendingTransactionMatches,
  confirmMatch,
  rejectMatch,
  unmatch,
} from '../controllers/transactionMatcher.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Scan account for unmatched transactions and suggest matches
router.post('/accounts/:accountId/scan-matches', scanForMatches);

// Get pending transaction matches for an account
router.get('/accounts/:accountId/pending-matches', getPendingTransactionMatches);

// Confirm a transaction match
router.post('/transactions/:transactionId/confirm-match', confirmMatch);

// Reject a transaction match
router.post('/transactions/:transactionId/reject-match', rejectMatch);

// Unmatch a confirmed transaction
router.post('/transactions/:transactionId/unmatch', unmatch);

export default router;
