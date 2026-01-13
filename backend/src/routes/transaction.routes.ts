import { Router } from 'express';
import { updateTransaction, deleteTransaction } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Note: Transaction creation is handled in account.routes.ts at POST /accounts/:id/transactions
// This route file contains update and delete operations for transactions

router.use(authenticate);

router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
