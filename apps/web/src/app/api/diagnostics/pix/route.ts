import { NextResponse } from 'next/server';
import * as https from 'node:https';

function httpsRequest(url: string, options: { method: string; headers: Record<string, string>; agent?: https.Agent }, body?: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = https.request(
      { hostname: parsedUrl.hostname, path: parsedUrl.pathname + parsedUrl.search, method: options.method, headers: options.headers, agent: options.agent },
      (res) => {
        let data = '';
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => {
          try { resolve({ status: res.statusCode ?? 500, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode ?? 500, body: data }); }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function GET() {
  const results: Record<string, string> = {};

  results['EFI_PIX_CLIENT_ID'] = process.env.EFI_PIX_CLIENT_ID ? '✅ configurado' : '❌ ausente';
  results['EFI_PIX_CLIENT_SECRET'] = process.env.EFI_PIX_CLIENT_SECRET ? '✅ configurado' : '❌ ausente';
  results['PIX_KEY'] = process.env.PIX_KEY ? '✅ configurado' : '❌ ausente';
  results['EFI_SANDBOX'] = process.env.EFI_SANDBOX || '❌ ausente';
  results['EFI_PIX_CERT'] = process.env.EFI_PIX_CERT ? '✅ configurado' : 'não usado';
  results['EFI_PIX_CERT_BASE64'] = process.env.EFI_PIX_CERT_BASE64 ? `✅ configurado (${process.env.EFI_PIX_CERT_BASE64.length} chars)` : '❌ ausente';

  try {
    const certPath = process.env.EFI_PIX_CERT;
    const certB64 = process.env.EFI_PIX_CERT_BASE64;
    let agent;

    if (certPath) {
      const fs = await import('node:fs');
      const certPem = fs.readFileSync(certPath, 'utf8');
      const certMatch = certPem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
      const keyMatch = certPem.match(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/);
      agent = new https.Agent({ cert: certMatch?.[0] || certPem, key: keyMatch?.[0], rejectUnauthorized: false });
      results['agent'] = '✅ criado via arquivo (PEM)';
    } else if (certB64) {
      const certPem = Buffer.from(certB64, 'base64').toString('utf8');
      const certMatch = certPem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
      const keyMatch = certPem.match(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/);
      agent = new https.Agent({ cert: certMatch?.[0] || certPem, key: keyMatch?.[0], rejectUnauthorized: false });
      results['agent'] = '✅ criado via base64 (PEM)';
    } else {
      results['agent'] = '❌ sem certificado';
    }

    if (agent) {
      const auth = Buffer.from(`${process.env.EFI_PIX_CLIENT_ID}:${process.env.EFI_PIX_CLIENT_SECRET}`).toString('base64');
      const { status, body } = await httpsRequest('https://pix.api.efipay.com.br/oauth/token', {
        method: 'POST',
        headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
        agent,
      }, JSON.stringify({ grant_type: 'client_credentials' }));

      if (status === 200 && body?.access_token) {
        results['pix_auth'] = '✅ Token obtido!';
        
        // Try creating a PIX charge
        const { status: chargeStatus, body: chargeBody } = await httpsRequest('https://pix.api.efipay.com.br/v2/cob', {
          method: 'POST',
          headers: { authorization: `Bearer ${body.access_token}`, 'content-type': 'application/json' },
          agent,
        }, JSON.stringify({
          calendario: { expiracao: 3600 },
          valor: { original: '0.01' },
          chave: process.env.PIX_KEY,
          solicitacaoPagador: 'Jornada Leve - Diagnóstico'
        }));

        if (chargeStatus === 201) {
          results['pix_charge'] = `✅ Criada! txid: ${chargeBody?.txid || '?'}`;
        } else {
          results['pix_charge'] = `❌ HTTP ${chargeStatus}: ${typeof chargeBody === 'string' ? chargeBody.substring(0, 100) : JSON.stringify(chargeBody).substring(0, 100)}`;
        }
      } else {
        results['pix_auth'] = `❌ HTTP ${status}: ${typeof body === 'string' ? body.substring(0, 100) : JSON.stringify(body).substring(0, 100)}`;
      }
    }
  } catch (err) {
    results['error'] = err instanceof Error ? err.message.substring(0, 200) : 'unknown';
  }

  return NextResponse.json(results);
}
