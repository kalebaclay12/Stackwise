import { Router } from 'express';
import {
  createLinkToken,
  exchangePublicToken,
  getLinkedBanks,
  getBalances,
  transferFunds,
  unlinkBank,
} from '../controllers/plaid.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

const exchangeTokenSchema = z.object({
  body: z.object({
    public_token: z.string(),
  }),
});

const transferFundsSchema = z.object({
  body: z.object({
    linkedBankId: z.string(),
    accountId: z.string(),
    amount: z.number().positive(),
    description: z.string().optional(),
  }),
});

router.use(authenticate);

router.post('/link-token', createLinkToken);
router.post('/exchange-token', validate(exchangeTokenSchema), exchangePublicToken);
router.get('/linked-banks', getLinkedBanks);
router.get('/balances/:id', getBalances);
router.post('/transfer', validate(transferFundsSchema), transferFunds);
router.delete('/linked-banks/:id', unlinkBank);

export default router;
