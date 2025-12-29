import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Building2, Loader2 } from 'lucide-react';
import axios from '../services/api';

interface BankLinkButtonProps {
  onSuccess?: () => void;
}

export default function BankLinkButton({ onSuccess }: BankLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        const response = await axios.post('/plaid/link-token');
        setLinkToken(response.data.link_token);
      } catch (error) {
        console.error('Error creating link token:', error);
      }
    };
    createLinkToken();
  }, []);

  const onPlaidSuccess = useCallback(async (public_token: string) => {
    setIsLoading(true);
    try {
      await axios.post('/plaid/exchange-token', { public_token });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error exchanging token:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  const config = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  if (!linkToken) {
    return (
      <button disabled className="btn-primary flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready || isLoading}
      className="btn-primary flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Building2 className="w-4 h-4" />
          Link Bank Account
        </>
      )}
    </button>
  );
}
