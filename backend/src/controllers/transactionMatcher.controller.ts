import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  processUnmatchedTransactions,
  confirmTransactionMatch,
  rejectTransactionMatch,
  unmatchTransaction,
  getPendingMatches,
} from '../services/transactionMatcher.service';

export const scanForMatches = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;

    // Verify account ownership
    const prisma = (await import('../utils/prisma')).default;
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const suggestionsCreated = await processUnmatchedTransactions(accountId);

    res.json({
      message: 'Transaction matching completed',
      suggestionsCreated,
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingTransactionMatches = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountId } = req.params;

    const pendingMatches = await getPendingMatches(accountId, req.userId!);

    res.json(pendingMatches);
  } catch (error) {
    next(error);
  }
};

export const confirmMatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;

    await confirmTransactionMatch(transactionId, req.userId!);

    res.json({ message: 'Transaction match confirmed successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectMatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;

    await rejectTransactionMatch(transactionId, req.userId!);

    res.json({ message: 'Transaction match rejected' });
  } catch (error) {
    next(error);
  }
};

export const unmatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;

    await unmatchTransaction(transactionId, req.userId!);

    res.json({ message: 'Transaction unmatched successfully' });
  } catch (error) {
    next(error);
  }
};
