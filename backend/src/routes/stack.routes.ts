import { Router } from 'express';
import {
  updateStack,
  deleteStack,
  allocateToStack,
  deallocateFromStack,
  getStackTransactions,
} from '../controllers/stack.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

const updateStackSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    targetAmount: z.number().positive().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    priority: z.number().int().optional(),
    isActive: z.boolean().optional(),
    autoAllocate: z.boolean().optional(),
    autoAllocateAmount: z.number().positive().optional(),
  }),
});

const allocateSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
  }),
});

router.use(authenticate);

router.put('/:id', validate(updateStackSchema), updateStack);
router.delete('/:id', deleteStack);
router.post('/:id/allocate', validate(allocateSchema), allocateToStack);
router.post('/:id/deallocate', validate(allocateSchema), deallocateFromStack);
router.get('/:id/transactions', getStackTransactions);

export default router;
