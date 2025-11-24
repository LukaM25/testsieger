/**
 * Generates a PDF and sends it via email to the customer.
 * @param certificateId - The UUID of the certificate to process.
 * @param userEmail - The email address to send the certificate to.
 * @returns A promise that resolves to a success object.
 */
export function processAndSendCertificate(
  certificateId: string, 
  userEmail: string
): Promise<{ success: boolean; messageId?: string }>;