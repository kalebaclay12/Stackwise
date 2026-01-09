import { Router } from 'express';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountTransactions,
  importCSVTransactions,
} from '../controllers/account.controller';
import {
  getStacksByAccount,
  createStack,
  updateStackPriorities,
} from '../controllers/stack.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkSubscriptionTier, checkStackLimit, checkAutoAllocationFeature } from '../middleware/subscription';
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
    targetDueDate: z.string().optional(),
    color: z.string(),
    icon: z.string(),
    priority: z.number().int(),
    currentAmount: z.number().optional(),
    isActive: z.boolean().optional(),
    autoAllocate: z.boolean(),
    autoAllocateAmount: z.number().positive().optional(),
    autoAllocateFrequency: z.enum([
      'daily',
      'every_other_day',
      'weekly',
      'bi_weekly',
      'bi_monthly',
      'monthly',
      'semi_annually',
      'annually',
    ]).optional(),
    autoAllocateStartDate: z.string().optional(),
    resetBehavior: z.enum(['none', 'auto_reset', 'ask_reset', 'delete']).optional(),
    recurringPeriod: z.enum(['none', 'weekly', 'bi_weekly', 'bi_monthly', 'monthly', 'quarterly', 'semi_annually', 'annually']).optional(),
    overflowBehavior: z.enum(['next_priority', 'available_balance', 'keep_in_stack']).optional(),
  }),
});

const updateStackPrioritiesSchema = z.object({
  body: z.object({
    priorities: z.array(
      z.object({
        id: z.string(),
        priority: z.number().int().nonnegative(),
      })
    ),
  }),
});

router.use(authenticate);
router.use(checkSubscriptionTier);

router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.post('/', validate(createAccountSchema), createAccount);
router.put('/:id', validate(updateAccountSchema), updateAccount);
router.delete('/:id', deleteAccount);
router.get('/:id/transactions', getAccountTransactions);
router.post('/:id/import-csv', importCSVTransactions);
router.get('/:accountId/stacks', getStacksByAccount);
router.post('/:accountId/stacks', validate(createStackSchema), checkStackLimit, checkAutoAllocationFeature, createStack);
router.put('/:accountId/stacks/priorities', validate(updateStackPrioritiesSchema), updateStackPriorities);

export default router;
