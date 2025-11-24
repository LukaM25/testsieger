import { useState, useCallback } from 'react';

type Status = 'idle' | 'generating' | 'sending' | 'success' | 'error';

export const useCertificateActions = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Handle Preview (Generates Blob)
  const handlePreview = useCallback(async (certificateId: string) => {
    if (!certificateId) return;
    
    setStatus('generating');
    setError(null);

    try {
      // Clean up previous blob to prevent memory leaks
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      const response = await fetch(`/api/certificates/${certificateId}/preview`);
      
      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      // Create a blob URL from the binary PDF data
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      setStatus('idle'); // Back to idle so we don't show loading forever
    } catch (err) {
      console.error(err);
      setError('Preview generation failed');
      setStatus('error');
    }
  }, [previewUrl]);

  // 2. Handle Email Sending
  const handleSend = useCallback(async (certificateId: string) => {
    if (!certificateId) return;

    setStatus('sending');
    setError(null);

    try {
      const response = await fetch(`/api/certificates/${certificateId}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email');
      }

      setStatus('success');
      // Optional: Reset to idle after 2 seconds so the "Success" state clears
      setTimeout(() => setStatus('idle'), 3000);
      
      return { success: true };
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setStatus('error');
      return { success: false };
    }
  }, []);

  // 3. Cleanup function (Call this when closing modal)
  const clearPreview = useCallback(() => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setStatus('idle');
  }, [previewUrl]);

  return {
    handlePreview,
    handleSend,
    clearPreview,
    previewUrl,
    status,
    error,
    // Helper booleans to make your UI code happy:
    isLoading: status === 'generating', 
    isSending: status === 'sending',
    isSuccess: status === 'success'
  };
};