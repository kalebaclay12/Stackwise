import { Router } from 'express';
import { deleteTransaction } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Note: Transaction creation is handled in account.routes.ts at POST /accounts/:id/transactions
// This route file only contains the delete operation for transactions

router.use(authenticate);

router.delete('/:id', deleteTransaction);

export default router;
