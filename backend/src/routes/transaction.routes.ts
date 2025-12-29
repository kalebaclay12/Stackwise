import { Router } from 'express';
import { createTransaction } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

const createTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['deposit', 'withdrawal']),
    amount: z.number().positive(),
    description: z.string().min(1),
    category: z.string().optional(),
  }),
});

router.use(authenticate);

router.post('/:accountId', validate(createTransactionSchema), createTransaction);

export default router;
