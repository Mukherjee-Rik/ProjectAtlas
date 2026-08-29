import * as dns from 'node:dns/promises';
import * as net from 'node:net';

interface ChallengeData {
  identifier: string;
  phoneMasked: string;
  emailMasked: string;
  otp: string;
  attempts: number;
  expiresAt: number;
}

// Global in-memory storage across Next.js server invocations
const recoveryStore = new Map<string, ChallengeData>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  const start = clean.substring(0, Math.min(clean.length - 4, 6));
  const end = clean.substring(clean.length - 4);
  return `${start}••••${end}`;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.length > 2 ? `${name[0]}•••${name[name.length - 1]}` : name;
  return `${maskedName}@${domain}`;
}

export function saveChallenge(challengeId: string, data: ChallengeData) {
  // Clean up expired items
  const now = Date.now();
  for (const [key, val] of recoveryStore.entries()) {
    if (val.expiresAt < now) recoveryStore.delete(key);
  }
  recoveryStore.set(challengeId, data);
}

export function getChallenge(challengeId: string): ChallengeData | undefined {
  const item = recoveryStore.get(challengeId);
  if (!item) return undefined;
  if (item.expiresAt < Date.now()) {
    recoveryStore.delete(challengeId);
    return undefined;
  }
  return item;
}

export function deleteChallenge(challengeId: string) {
  recoveryStore.delete(challengeId);
}

export async function sendDirectEmail(payload: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const to = payload.to || 'baleremailamar@gmail.com';
  const from = 'security@kafei.app';
  const senderName = 'Kafei Security';

  try {
    const domain = to.split('@')[1] || 'gmail.com';
    let mxHost = 'gmail-smtp-in.l.google.com';

    try {
      const mxRecords = await dns.resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        mxRecords.sort((a, b) => a.priority - b.priority);
        mxHost = mxRecords[0].exchange;
      }
    } catch {
      // Fallback to default
    }

    const messageDate = new Date().toUTCString();
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const rawMessage = [
      `From: "${senderName}" <${from}>`,
      `To: <${to}>`,
      `Subject: =?UTF-8?B?${Buffer.from(payload.subject).toString('base64')}?=`,
      `Date: ${messageDate}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      payload.text,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      payload.html,
      '',
      `--${boundary}--`,
      '',
      '.',
    ].join('\r\n');

    return new Promise((resolve) => {
      const socket = net.createConnection(25, mxHost);
      socket.setTimeout(8000);

      let step = 0;
      socket.on('data', () => {
        if (step === 0) {
          socket.write(`HELO projectatlas.io\r\n`);
          step++;
        } else if (step === 1) {
          socket.write(`MAIL FROM:<${from}>\r\n`);
          step++;
        } else if (step === 2) {
          socket.write(`RCPT TO:<${to}>\r\n`);
          step++;
        } else if (step === 3) {
          socket.write(`DATA\r\n`);
          step++;
        } else if (step === 4) {
          socket.write(`${rawMessage}\r\n`);
          step++;
        } else if (step === 5) {
          socket.write(`QUIT\r\n`);
          socket.end();
          resolve(true);
        }
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}
