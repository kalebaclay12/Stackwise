import { Router } from 'express';
import {
  updateStack,
  deleteStack,
  allocateToStack,
  deallocateFromStack,
  getStackTransactions,
  triggerAutoAllocations,
  resetStack,
  dismissStackReset,
  getPendingStackResets,
} from '../controllers/stack.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkSubscriptionTier, checkAutoAllocationFeature, requireProTier } from '../middleware/subscription';
import { z } from 'zod';

const router = Router();

const updateStackSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    targetAmount: z.number().positive().optional(),
    targetDueDate: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    priority: z.number().int().optional(),
    isActive: z.boolean().optional(),
    autoAllocate: z.boolean().optional(),
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

const allocateSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
  }),
});

const resetStackSchema = z.object({
  body: z.object({
    newTargetAmount: z.number().positive().optional(),
    newTargetDueDate: z.string().datetime().optional(),
    newAutoAllocateAmount: z.number().positive().optional(),
    newAutoAllocateFrequency: z.enum([
      'daily',
      'every_other_day',
      'weekly',
      'bi_weekly',
      'bi_monthly',
      'monthly',
      'semi_annually',
      'annually',
    ]).optional(),
  }),
});

router.use(authenticate);
router.use(checkSubscriptionTier);

router.post('/trigger-auto-allocations', requireProTier, triggerAutoAllocations);
router.get('/pending-resets', getPendingStackResets);
router.put('/:id', validate(updateStackSchema), checkAutoAllocationFeature, updateStack);
router.delete('/:id', deleteStack);
router.post('/:id/allocate', validate(allocateSchema), allocateToStack);
router.post('/:id/deallocate', validate(allocateSchema), deallocateFromStack);
router.post('/:id/reset', validate(resetStackSchema), resetStack);
router.post('/:id/dismiss-reset', dismissStackReset);
router.get('/:id/transactions', getStackTransactions);

export default router;
