// This file tells TypeScript how to interact with the JS file

/**
 * Generates a PDF Buffer from the provided data using Puppeteer.
 * @param data - The data object containing product and certificate details (handlebars context).
 * @returns A Promise that resolves to a PDF Buffer.
 */
export function generateCertificatePdf(data: Record<string, any>): Promise<Buffer>; 