
import { useState } from 'react';

export const useCopyToClipboard = (): ['idle' | 'success' | 'error', (text: string) => void] => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return [status, copyToClipboard];
};
