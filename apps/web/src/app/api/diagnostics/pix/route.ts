import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, string> = {};

  // Check env vars (masked)
  results['EFI_PIX_CLIENT_ID'] = process.env.EFI_PIX_CLIENT_ID ? '✅ configurado' : '❌ ausente';
  results['EFI_PIX_CLIENT_SECRET'] = process.env.EFI_PIX_CLIENT_SECRET ? '✅ configurado' : '❌ ausente';
  results['PIX_KEY'] = process.env.PIX_KEY ? '✅ configurado' : '❌ ausente';
  results['EFI_SANDBOX'] = process.env.EFI_SANDBOX || '❌ ausente';
  results['EFI_PIX_CERT'] = process.env.EFI_PIX_CERT ? '✅ configurado' : 'não usado';
  results['EFI_PIX_CERT_BASE64'] = process.env.EFI_PIX_CERT_BASE64 ? `✅ configurado (${process.env.EFI_PIX_CERT_BASE64.length} chars)` : '❌ ausente';

  // Try to create the mTLS agent
  try {
    const https = await import('node:https');
    const fs = await import('node:fs');
    
    const certPath = process.env.EFI_PIX_CERT;
    const certB64 = process.env.EFI_PIX_CERT_BASE64;
    
    let agent;
    if (certPath) {
      agent = new https.Agent({ pfx: fs.readFileSync(certPath), passphrase: '' });
      results['agent'] = '✅ criado via arquivo';
    } else if (certB64) {
      agent = new https.Agent({ pfx: Buffer.from(certB64, 'base64'), passphrase: '' });
      results['agent'] = '✅ criado via base64';
    } else {
      results['agent'] = '❌ sem certificado';
    }

    // Try to call PIX API
    if (agent) {
      try {
        const clientId = process.env.EFI_PIX_CLIENT_ID;
        const clientSecret = process.env.EFI_PIX_CLIENT_SECRET;
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
        const response = await fetch('https://pix.api.efipay.com.br/oauth/token', {
          method: 'POST',
          headers: {
            authorization: `Basic ${auth}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ grant_type: 'client_credentials' }),
          // @ts-expect-error - agent not in fetch types
          agent,
        });
        
        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          results['pix_auth'] = data.access_token ? '✅ Token obtido!' : '❌ Sem token';
        } else {
          const err = await response.text().catch(() => 'unknown');
          results['pix_auth'] = `❌ HTTP ${response.status}: ${err.substring(0, 100)}`;
        }
      } catch (err) {
        results['pix_auth'] = `❌ Erro: ${err instanceof Error ? err.message : 'unknown'}`;
      }
    }
  } catch (err) {
    results['agent_error'] = err instanceof Error ? err.message : 'unknown';
  }

  return NextResponse.json(results);
}
