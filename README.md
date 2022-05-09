# solana-sign-with-payment

## Motivation

Because as of writing it's still difficult for some people to sign a message in Solana, for example: https://github.com/phantom-labs/sandbox/issues/14

## How it works

The server will generate (by default) 6 digit number that serves as some sort of OTP. The client can then send this amount of lamports to his/her own wallet within the challenge timeframe to prove ownership of the wallet. The server will issue an JWT that can then be passed to other services, just like how you would pass a signature that is obtained from e.g. Phantom wallet.

## Quick Start

This repository is already deployed at https://solana-sign-with-payment.netlify.app. If you trust the author you can use it directly but there is no uptime guarantee. Alternatively you can deploy this repository directly as a netlify app and set the environment variables found in [`.netlify/functions/lib/env.ts`](.netlify/functions/lib/env.ts)

**Client**

```typescript
const resp = await (await fetch('https://solana-sign-with-payment.netlify.app/init', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: "hello, world!", from: window.solana.publicKey.toString() }),
})).json();
const { signature } = await window.solana.signAndSendTransaction(new Transaction().add(SystemProgram.transfer({
    fromPubkey: window.solana.publicKey,
    toPubkey: new PublicKey(resp.destination),
    lamports: resp.lamports
})));
await connection.confirmTransaction(signature);

const resp2 = await (await fetch('https://solana-sign-with-payment.netlify.app/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jwt: resp.jwt, sig: signature }),
})).json();

// Call your app with the resultant JWT
fetch(`https://your-app.com/next-step?jwt=${resp2.jwt}`)
```

**Server**

From the above example, your app server can verify the authenticity of the JWT by something like:

```typescript
import * as jose from 'jose';
//...
const jwks = jose.createRemoteJWKSet(new URL('https://solana-sign-with-payment.netlify.app/.well-known/jwks.json'));
const { payload } = await jose.jwtVerify(payload.jwt, jwks);

// Finally!
console.log(payload.from);
console.log(payload.message);
```