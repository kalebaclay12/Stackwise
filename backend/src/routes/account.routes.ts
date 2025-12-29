import { Router } from 'express';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountTransactions,
} from '../controllers/account.controller';
import {
  getStacksByAccount,
  createStack,
} from '../controllers/stack.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

const createAccountSchema = z.object({
  body: z.object({
    type: z.enum(['checking', 'savings']),
    name: z.string().min(1),
  }),
});

const updateAccountSchema = z.object({
  body: z.object({
    type: z.enum(['checking', 'savings']).optional(),
    name: z.string().min(1).optional(),
  }),
});

const createStackSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    targetAmount: z.number().positive().optional(),
    color: z.string(),
    icon: z.string(),
    priority: z.number().int(),
    autoAllocate: z.boolean(),
    autoAllocateAmount: z.number().positive().optional(),
  }),
});

router.use(authenticate);

router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.post('/', validate(createAccountSchema), createAccount);
router.put('/:id', validate(updateAccountSchema), updateAccount);
router.delete('/:id', deleteAccount);
router.get('/:id/transactions', getAccountTransactions);
router.get('/:accountId/stacks', getStacksByAccount);
router.post('/:accountId/stacks', validate(createStackSchema), createStack);

export default router;
