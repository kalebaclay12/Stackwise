# CSV Import Guide

Import bank transactions from CSV files to test transaction matching and stack features without connecting to Plaid.

## How to Import CSV Transactions

1. **Navigate to Dashboard**: Select the account you want to import transactions into
2. **Click "Import CSV"**: Button appears next to Edit/Delete for local accounts
3. **Drag & Drop or Select**: Upload your bank statement CSV file
4. **Review Import**: Check success message and review imported transactions

## Supported CSV Formats

The CSV import feature automatically detects and supports multiple bank formats:

### Standard Format (Most Banks)

```csv
Date,Description,Amount,Category
01/01/2026,Paycheck Deposit,2500.00,Income
01/02/2026,Grocery Store,-85.43,Groceries
01/03/2026,Gas Station,-45.20,Transportation
```

**Required Columns:**
- **Date** - Transaction date (MM/DD/YYYY, YYYY-MM-DD, or similar)
- **Description** - Transaction description/memo
- **Amount** - Transaction amount (positive for deposits, negative for withdrawals)

**Optional Columns:**
- **Category** - Transaction category

### Chase Bank Format (Debit/Credit Columns)

```csv
Transaction Date,Description,Debit,Credit,Type
01/01/2026,DIRECT DEPOSIT PAYROLL,,2500.00,ACH_CREDIT
01/02/2026,WHOLE FOODS MARKET,85.43,,DEBIT
01/03/2026,SHELL OIL,45.20,,DEBIT
```

**Required Columns:**
- **Transaction Date** or **Date** - Transaction date
- **Description** or **Memo** - Transaction description
- **Debit** and **Credit** - Separate columns for debits/credits (one will be empty per row)

**Optional Columns:**
- **Type** or **Category** - Transaction type/category

## Column Name Variations

The importer recognizes common variations:

| Purpose | Recognized Names |
|---------|------------------|
| **Date** | Date, Transaction Date, Posting Date, date |
| **Description** | Description, Memo, Transaction Description, description, memo |
| **Amount** | Amount, Transaction Amount, amount |
| **Debit** | Debit, debit |
| **Credit** | Credit, credit |
| **Category** | Category, Type, category, type |

## Sample Files

Two sample CSV files are included in the project root:

1. **sample-bank-statement.csv** - Standard format with Amount column
2. **sample-chase-format.csv** - Chase-style format with Debit/Credit columns

## How to Get Your Bank Statement CSV

### Most Online Banks:

1. Log into your online banking
2. Navigate to Transactions or Account History
3. Look for "Export" or "Download" option
4. Select CSV or Excel format
5. Choose date range (e.g., last 30 days)
6. Download the file

### Common Banks:

- **Chase**: Transactions → Download → CSV
- **Bank of America**: Transactions → Export Transactions → CSV
- **Wells Fargo**: Download → CSV
- **Capital One**: Export → CSV Format
- **Discover**: Download → CSV

## After Import

Once transactions are imported:

1. **Account Balance Updated**: Balance reflects imported transactions
2. **Transaction Matching**: Use "Review Matches" to match transactions with stacks
3. **Transaction History**: View all imported transactions in the account
4. **Stack Allocation**: Manually allocate funds to stacks or use auto-allocation

## Tips

- **Clean Data**: Remove header rows from bank exports (keep only column names + data)
- **Date Format**: Most common date formats are automatically detected
- **Positive/Negative**: Standard format uses negative for withdrawals, positive for deposits
- **Debit/Credit**: Chase format uses separate columns (both positive numbers)
- **Duplicates**: Importing the same transactions twice will create duplicates (be careful!)

## Troubleshooting

### "Invalid CSV format" Error

**Problem**: CSV doesn't have required columns

**Solution**: Ensure your CSV has these columns:
- Date (or Transaction Date, Posting Date)
- Description (or Memo)
- Amount OR (Debit + Credit)

### "No valid transactions found"

**Problem**: CSV is empty or all rows failed validation

**Solution**:
- Check that CSV has data rows (not just headers)
- Verify dates are in a valid format
- Ensure amounts are numbers (not text)

### Some Transactions Skipped

**Problem**: Some rows failed validation

**Solution**: Check error messages for specific issues:
- Invalid dates → Use MM/DD/YYYY or YYYY-MM-DD format
- Missing description → Add description text
- Invalid amount → Ensure amount is a number

### Imported Twice by Accident

**Problem**: Same transactions imported multiple times

**Solution**:
- Delete the account and recreate it (if using local test account)
- Or manually track which transactions are duplicates

## Future Enhancement: Plaid Integration

CSV import is a testing feature. Once Plaid is integrated:

- **Automatic Sync**: Transactions sync automatically from your real bank
- **No Duplicates**: Plaid transactions have unique IDs to prevent duplicates
- **Real-Time Updates**: Balance and transactions update automatically
- **Multiple Accounts**: Link multiple bank accounts at once

CSV import will remain available for:
- Testing without linking real bank accounts
- Importing historical transactions
- Manual transaction entry

---

## Example Workflow

1. **Create Test Account**: Add a local "Checking" account
2. **Download Sample**: Use `sample-bank-statement.csv`
3. **Import CSV**: Click "Import CSV" → Upload file
4. **Create Stacks**: Create stacks for Groceries, Gas, Entertainment
5. **Review Matches**: Click "Review Matches" to auto-match transactions to stacks
6. **Test Features**: Try auto-allocation, stack completion, overflow behavior

This lets you test the full Stackwise experience before connecting real bank accounts!
