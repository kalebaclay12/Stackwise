import prisma from '../utils/prisma';

interface MatchResult {
  stackId: string;
  stackName: string;
  confidence: number;
  reason: string;
}

/**
 * Calculate similarity between two strings using an improved keyword matching algorithm
 * Returns a score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^\w\s]/g, '');

  const normalized1 = normalize(str1);
  const normalized2 = normalize(str2);

  // Exact match - highest confidence
  if (normalized1 === normalized2) {
    return 1.0;
  }

  // Full contains match - very high confidence
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.95;
  }

  // Common words to ignore (stop words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by', 'as', 'is', 'was', 'be']);

  // Word-level matching with improved scoring
  const words1 = normalized1.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const words2 = normalized2.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  if (words1.length === 0 || words2.length === 0) {
    return 0;
  }

  let matchScore = 0;
  const matchedWords = new Set<string>();

  for (const word1 of words1) {
    let bestWordMatch = 0;

    for (const word2 of words2) {
      if (matchedWords.has(word2)) continue;

      // Exact word match
      if (word1 === word2) {
        bestWordMatch = 1.0;
        matchedWords.add(word2);
        break;
      }

      // Substring match (one word contains the other)
      if (word1.length > 3 && word2.length > 3) {
        if (word1.includes(word2) || word2.includes(word1)) {
          const similarity = Math.min(word1.length, word2.length) / Math.max(word1.length, word2.length);
          bestWordMatch = Math.max(bestWordMatch, 0.85 * similarity);
        }
      }

      // Levenshtein-like similarity for typos
      if (word1.length > 3 && word2.length > 3 && Math.abs(word1.length - word2.length) <= 2) {
        const distance = levenshteinDistance(word1, word2);
        const maxLen = Math.max(word1.length, word2.length);
        if (distance <= 2) {
          const similarity = 1 - (distance / maxLen);
          bestWordMatch = Math.max(bestWordMatch, 0.8 * similarity);
        }
      }
    }

    matchScore += bestWordMatch;
  }

  // Normalize by the number of words in the shorter string
  const normalizedScore = matchScore / Math.min(words1.length, words2.length);

  return Math.min(normalizedScore, 1.0);
}

/**
 * Calculate Levenshtein distance between two strings (for typo detection)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Find the best matching stack for a transaction
 * Only returns a match if confidence is above the threshold
 */
export async function findStackMatch(
  transactionDescription: string,
  accountId: string,
  minConfidence: number = 0.6
): Promise<MatchResult | null> {
  // Get all active stacks for this account sorted by priority
  const stacks = await prisma.stack.findMany({
    where: {
      accountId,
      isActive: true,
    },
    orderBy: {
      priority: 'asc',
    },
  });

  if (stacks.length === 0) {
    return null;
  }

  let bestMatch: MatchResult | null = null;

  for (const stack of stacks) {
    // Calculate similarity with stack name
    const nameScore = calculateSimilarity(transactionDescription, stack.name);

    // Calculate similarity with stack description if it exists
    const descScore = stack.description
      ? calculateSimilarity(transactionDescription, stack.description)
      : 0;

    // Use the higher score
    const confidence = Math.max(nameScore, descScore);

    // Only consider matches above the minimum confidence threshold
    if (confidence >= minConfidence) {
      const reason = nameScore >= descScore
        ? `Matches stack name "${stack.name}"`
        : `Matches stack description`;

      // Keep the best match (highest confidence, or highest priority if tied)
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = {
          stackId: stack.id,
          stackName: stack.name,
          confidence,
          reason,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Process unmatched transactions and auto-match or suggest stack matches
 * Auto-confirms high-confidence matches (>= 0.95)
 * Returns stats about matches processed
 */
export async function processUnmatchedTransactions(
  accountId: string,
  autoConfirmThreshold: number = 0.95
): Promise<{ autoConfirmed: number; suggested: number }> {
  // Find all real (non-virtual) transactions without a stack assignment
  // and without existing suggestions
  const unmatchedTransactions = await prisma.transaction.findMany({
    where: {
      accountId,
      isVirtual: false,
      stackId: null,
      suggestedStackId: null,
      matchRejected: false,
      amount: { lt: 0 }, // Only match expenses (negative amounts)
    },
    orderBy: {
      date: 'desc',
    },
    take: 50, // Process up to 50 recent transactions at a time
  });

  let autoConfirmed = 0;
  let suggested = 0;

  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    return { autoConfirmed: 0, suggested: 0 };
  }

  for (const transaction of unmatchedTransactions) {
    const match = await findStackMatch(transaction.description, accountId, 0.6);

    if (match) {
      // High confidence - auto-confirm the match
      if (match.confidence >= autoConfirmThreshold) {
        const amountToDeduct = Math.abs(transaction.amount);

        await prisma.$transaction(async (tx) => {
          // Update stack balance
          await tx.stack.update({
            where: { id: match.stackId },
            data: {
              currentAmount: {
                decrement: amountToDeduct,
              },
            },
          });

          // Mark transaction as auto-matched
          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              stackId: match.stackId,
              matchConfirmed: true,
              matchConfidenceScore: match.confidence,
              suggestedStackId: match.stackId,
            },
          });

          // Create a virtual transaction for the stack deduction
          await tx.transaction.create({
            data: {
              accountId: transaction.accountId,
              stackId: match.stackId,
              type: 'deduction',
              amount: -amountToDeduct,
              description: `Auto-matched: ${transaction.description}`,
              balance: account.balance,
              isVirtual: true,
            },
          });
        });

        autoConfirmed++;
        console.log(
          `Auto-confirmed match: "${transaction.description}" → "${match.stackName}" (${(match.confidence * 100).toFixed(0)}% confidence)`
        );
      } else {
        // Lower confidence - suggest for user review
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            suggestedStackId: match.stackId,
            matchConfidenceScore: match.confidence,
          },
        });
        suggested++;
        console.log(
          `Suggested match: "${transaction.description}" → "${match.stackName}" (${(match.confidence * 100).toFixed(0)}% confidence)`
        );
      }
    }
  }

  return { autoConfirmed, suggested };
}

/**
 * Confirm a transaction-stack match
 * This will reduce the available balance and increase the stack balance
 */
export async function confirmTransactionMatch(
  transactionId: string,
  userId: string
): Promise<void> {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId },
    include: {
      account: true,
    },
  });

  if (!transaction || transaction.account.userId !== userId) {
    throw new Error('Transaction not found');
  }

  if (!transaction.suggestedStackId) {
    throw new Error('No suggested stack for this transaction');
  }

  if (transaction.matchConfirmed) {
    throw new Error('Match already confirmed');
  }

  const stack = await prisma.stack.findFirst({
    where: {
      id: transaction.suggestedStackId,
      accountId: transaction.accountId,
    },
  });

  if (!stack) {
    throw new Error('Suggested stack not found');
  }

  // The transaction amount is negative for expenses
  // We want to deduct from the stack
  const amountToDeduct = Math.abs(transaction.amount);

  await prisma.$transaction(async (tx) => {
    // Update stack balance
    await tx.stack.update({
      where: { id: stack.id },
      data: {
        currentAmount: {
          decrement: amountToDeduct,
        },
      },
    });

    // Mark transaction as confirmed
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        stackId: transaction.suggestedStackId,
        matchConfirmed: true,
      },
    });

    // Create a virtual transaction for the stack
    await tx.transaction.create({
      data: {
        accountId: transaction.accountId,
        stackId: stack.id,
        type: 'allocation',
        amount: -amountToDeduct,
        description: `Matched: ${transaction.description}`,
        balance: transaction.account.balance,
        isVirtual: true,
      },
    });
  });
}

/**
 * Reject a transaction-stack match suggestion
 */
export async function rejectTransactionMatch(
  transactionId: string,
  userId: string
): Promise<void> {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId },
    include: {
      account: true,
    },
  });

  if (!transaction || transaction.account.userId !== userId) {
    throw new Error('Transaction not found');
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      suggestedStackId: null,
      matchConfidenceScore: null,
      matchRejected: true,
    },
  });
}

/**
 * Unmatch a confirmed transaction (reverse the match)
 * This will add the amount back to the stack
 */
export async function unmatchTransaction(
  transactionId: string,
  userId: string
): Promise<void> {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId },
    include: {
      account: true,
    },
  });

  if (!transaction || transaction.account.userId !== userId) {
    throw new Error('Transaction not found');
  }

  if (!transaction.matchConfirmed || !transaction.stackId) {
    throw new Error('Transaction is not matched');
  }

  const stack = await prisma.stack.findUnique({
    where: { id: transaction.stackId },
  });

  if (!stack) {
    throw new Error('Stack not found');
  }

  const amountToRestore = Math.abs(transaction.amount);

  await prisma.$transaction(async (tx) => {
    // Restore amount to the stack
    await tx.stack.update({
      where: { id: stack.id },
      data: {
        currentAmount: {
          increment: amountToRestore,
        },
      },
    });

    // Clear the match from the transaction
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        stackId: null,
        matchConfirmed: false,
        suggestedStackId: null,
        matchConfidenceScore: null,
        matchRejected: true, // Mark as rejected to prevent re-matching
      },
    });

    // Delete the virtual transaction that was created for the match
    await tx.transaction.deleteMany({
      where: {
        accountId: transaction.accountId,
        stackId: stack.id,
        isVirtual: true,
        description: {
          contains: transaction.description,
        },
      },
    });
  });

  console.log(`Unmatched transaction: "${transaction.description}" from stack "${stack.name}"`);
}

/**
 * Get pending transaction matches for an account
 */
export async function getPendingMatches(accountId: string, userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });

  if (!account) {
    throw new Error('Account not found');
  }

  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      accountId,
      isVirtual: false,
      suggestedStackId: { not: null },
      matchConfirmed: false,
      matchRejected: false,
    },
    orderBy: {
      date: 'desc',
    },
    take: 20,
  });

  // Get the suggested stacks
  const stackIds = pendingTransactions
    .map((t) => t.suggestedStackId)
    .filter((id): id is string => id !== null);

  const stacks = await prisma.stack.findMany({
    where: {
      id: { in: stackIds },
    },
  });

  const stackMap = new Map(stacks.map((s) => [s.id, s]));

  return pendingTransactions.map((transaction) => ({
    transaction,
    suggestedStack: transaction.suggestedStackId
      ? stackMap.get(transaction.suggestedStackId)
      : null,
  }));
}
