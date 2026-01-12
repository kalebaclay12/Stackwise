import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';
import stackRoutes from './routes/stack.routes';
import transactionRoutes from './routes/transaction.routes';
import plaidRoutes from './routes/plaid.routes';
import userRoutes from './routes/user.routes';
import transactionMatcherRoutes from './routes/transactionMatcher.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import subscriptionRoutes from './routes/subscription.routes';
import { errorHandler } from './middleware/errorHandler';
import { processPendingAllocations } from './services/autoAllocation.service';
import stackCompletionService from './services/stackCompletion.service';

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Trust Railway proxy
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(cors());

// Stripe webhook needs raw body, so we add it before express.json()
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/stacks', stackRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/plaid', plaidRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', transactionMatcherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

// Schedule auto-allocation processing to run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled auto-allocation processing...');
  try {
    const result = await processPendingAllocations();
    console.log(`Auto-allocation processing completed: ${result.processed} stacks processed`);
  } catch (error) {
    console.error('Error in scheduled auto-allocation processing:', error);
  }
});

// Schedule stack completion processing to run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled stack completion processing...');
  try {
    await stackCompletionService.processCompletedStacks();
    console.log('Stack completion processing completed');
  } catch (error) {
    console.error('Error in scheduled stack completion processing:', error);
  }
});

// Schedule daily bank sync at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('Running scheduled daily bank sync...');
  try {
    const { syncAllBanksDaily } = await import('./services/bankSync.service');
    const result = await syncAllBanksDaily();
    console.log(`Daily bank sync completed: ${result.usersSynced} users, ${result.banksSynced} banks, ${result.totalNewTransactions} transactions`);
  } catch (error) {
    console.error('Error in scheduled daily bank sync:', error);
  }
});

// Also run once at startup to process any missed allocations
processPendingAllocations()
  .then((result) => {
    console.log(`Initial auto-allocation processing: ${result.processed} stacks processed`);
  })
  .catch((error) => {
    console.error('Error in initial auto-allocation processing:', error);
  });

// Run stack completion processing at startup
stackCompletionService.processCompletedStacks()
  .then(() => {
    console.log('Initial stack completion processing completed');
  })
  .catch((error) => {
    console.error('Error in initial stack completion processing:', error);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Auto-allocation cron job scheduled (runs every hour)');
  console.log('Stack completion cron job scheduled (runs every hour)');
  console.log('Bank sync cron job scheduled (runs daily at 3 AM)');
});

export default app;

