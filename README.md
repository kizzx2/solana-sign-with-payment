# solana-sign-with-payment

## Motivation

Because as of writing it's still difficult for some people to sign a message in Solana, for example: https://github.com/phantom-labs/sandbox/issues/14

So we go back to basics -- just ask the user to send some fund.

## How it works

The server will generate a (by default) 6 digit number that serves as some sort of OTP. The client can then send this amount of lamports to his/her own wallet within the challenge timeframe to prove ownership of the wallet. The server will issue an JWT that can then be passed to other services, just like how you would pass a signature that is obtained from e.g. Phantom wallet.

Note that this is intended to be used in an interactive setting. The signed JWT emitted by the server contains a `prevSig` which would be invalidated if the user does any other transaction in-between `init` and `verify`.

## Quick Start

This repository is already deployed at https://solana-sign-with-payment.netlify.app. If you trust the author you can use it directly but there is no uptime guarantee. Alternatively you can deploy this repository directly as a netlify app and set the environment variables found in [`netlify/lib/env.ts`](netlify/lib/env.ts)

The only variable that really needs to be set is `JWK_PRIVATE_KEY`. You can generate one with a tool such as https://mkjwk.org/

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/kizzx2/solana-sign-with-payment)

**Client**

```typescript
// 1. Request payment amount and destination
const resp = await (await fetch('https://solana-sign-with-payment.netlify.app/init', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: "hello, world!", from: window.solana.publicKey.toString() }),
})).json();

// 2. Make the payment
const { signature } = await window.solana.signAndSendTransaction(new Transaction().add(SystemProgram.transfer({
    fromPubkey: window.solana.publicKey,
    toPubkey: new PublicKey(resp.destination),
    lamports: resp.lamports
})));
await connection.confirmTransaction(signature);

// 3. Submit the payment signature (i.e. txid) for verification
const resp2 = await (await fetch('https://solana-sign-with-payment.netlify.app/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jwt: resp.jwt, sig: signature }),
})).json();

// 4. We get a JWT signed by the verification service
// Call your app with the resultant JWT
fetch(`https://your-app.com/next-step?jwt=${resp2.jwt}`)
```

**Server**

From the above example, your app server can verify the authenticity of the JWT by something like:

```typescript
import * as jose from 'jose';
//...
const jwks = jose.createRemoteJWKSet(new URL('https://solana-sign-with-payment.netlify.app/.well-known/jwks.json'));

// 5. Verify the JWT using the verification service's public key
const { payload } = await jose.jwtVerify(payload.jwt, jwks);

// Finally!
// 6. Consume the signed message
console.log(payload.from);
console.log(payload.message);
```

## Configuration

If you run your own deployment you can change this settings by environment variable:

| Env | Description | Default |
| - | - | - |
| `JWK_PRIVATE_KEY` | Private key in JWK JSON format. Required | |
| `SOLANA_API_URL` | `mainnet-beta`, `testnet`, `devnet`, or REST URL of your RPC | `mainnet-beta` |
| `PAYMENT_DESTINATION` | You can specify an address for user to send to. Leave blank for user to send SOL to back to himself | |
| `JWT_ALGORITHM` | e.g. ES256, RS256 | `ES256` |
| `JWT_EXPIRY` | JWT expiry in seconds, must `verify` within this timeframe | `600` |
| `MIN_LAMPORTS` | Minimum lamports that will be requested | `100000` |
| `MAX_LAMPORTS` | Maximum lamports that will be requested | `999999` |
