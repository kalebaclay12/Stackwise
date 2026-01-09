import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useAccountStore } from '../store/accountStore';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ isOpen, onClose, accountId }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importCSVTransactions } = useAccountStore();

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please drop a CSV file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const parseCSV = (csvFile: File): Promise<ParsedTransaction[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const transactions: ParsedTransaction[] = results.data.map((row: any) => {
              // Try to detect common CSV formats from different banks
              let date = '';
              let description = '';
              let amount = 0;
              let category = '';

              // Common date field names
              if (row['Date']) date = row['Date'];
              else if (row['Transaction Date']) date = row['Transaction Date'];
              else if (row['Posting Date']) date = row['Posting Date'];
              else if (row['date']) date = row['date'];

              // Common description field names
              if (row['Description']) description = row['Description'];
              else if (row['Memo']) description = row['Memo'];
              else if (row['Transaction Description']) description = row['Transaction Description'];
              else if (row['description']) description = row['description'];
              else if (row['memo']) description = row['memo'];

              // Common amount field names
              if (row['Amount']) amount = parseFloat(row['Amount'].replace(/[$,]/g, ''));
              else if (row['Transaction Amount']) amount = parseFloat(row['Transaction Amount'].replace(/[$,]/g, ''));
              else if (row['amount']) amount = parseFloat(row['amount'].replace(/[$,]/g, ''));

              // Handle separate debit/credit columns
              if (row['Debit']) {
                const debit = parseFloat(row['Debit'].replace(/[$,]/g, ''));
                if (!isNaN(debit) && debit !== 0) amount = -Math.abs(debit);
              }
              if (row['Credit']) {
                const credit = parseFloat(row['Credit'].replace(/[$,]/g, ''));
                if (!isNaN(credit) && credit !== 0) amount = Math.abs(credit);
              }

              // Category
              if (row['Category']) category = row['Category'];
              else if (row['Type']) category = row['Type'];
              else if (row['category']) category = row['category'];

              if (!date || !description || isNaN(amount)) {
                throw new Error('Invalid CSV format. Required columns: Date, Description, Amount (or Debit/Credit)');
              }

              return {
                date: new Date(date).toISOString(),
                description: description.trim(),
                amount,
                category: category || undefined,
              };
            });

            resolve(transactions);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error('Failed to parse CSV: ' + error.message));
        },
      });
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const transactions = await parseCSV(file);

      if (transactions.length === 0) {
        throw new Error('No valid transactions found in CSV');
      }

      await importCSVTransactions(accountId, transactions);

      setSuccess(`Successfully imported ${transactions.length} transactions`);
      setFile(null);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to import transactions');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Import Bank Statement</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">CSV Format Requirements</h3>
            <p className="text-sm text-blue-800 mb-2">Your CSV file should have these columns:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>Date</strong> - Transaction date (any common format)</li>
              <li><strong>Description</strong> - Transaction description or memo</li>
              <li><strong>Amount</strong> - Transaction amount (or separate Debit/Credit columns)</li>
              <li><strong>Category</strong> (optional) - Transaction category</li>
            </ul>
            <p className="text-xs text-blue-700 mt-2">
              Supported banks: Chase, Bank of America, Wells Fargo, Capital One, and most standard formats
            </p>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
              ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}
              ${file ? 'bg-green-50 border-green-500' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="space-y-3">
                <CheckCircle className="mx-auto text-green-500" size={48} />
                <p className="text-lg font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-700 underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="mx-auto text-gray-400" size={48} />
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    Drag & drop your CSV file here
                  </p>
                  <p className="text-sm text-gray-600">or click to browse</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className={`
                flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all
                ${!file || importing
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                }
              `}
            >
              {importing ? 'Importing...' : 'Import Transactions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportCSVModal;
