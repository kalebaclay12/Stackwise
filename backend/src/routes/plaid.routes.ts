import { Router } from 'express';
import {
  createLinkToken,
  exchangePublicToken,
  getLinkedBanks,
  getBalances,
  transferFunds,
  syncAccount,
  syncTransactions,
  unlinkBank,
} from '../controllers/plaid.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkSubscriptionTier, requireProTier } from '../middleware/subscription';
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
router.use(checkSubscriptionTier);

// All Plaid features require Pro tier
router.post('/link-token', requireProTier, createLinkToken);
router.post('/exchange-token', requireProTier, validate(exchangeTokenSchema), exchangePublicToken);
router.get('/linked-banks', requireProTier, getLinkedBanks);
router.get('/balances/:id', requireProTier, getBalances);
router.post('/sync/:id', requireProTier, syncAccount);
router.post('/sync-transactions/:id', requireProTier, syncTransactions);
router.post('/transfer', requireProTier, validate(transferFundsSchema), transferFunds);
router.delete('/linked-banks/:id', requireProTier, unlinkBank);

export default router;
