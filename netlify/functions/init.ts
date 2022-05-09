import { Handler } from '@netlify/functions';
import * as Solana from '@solana/web3.js';
import assert from 'assert';
import * as jose from 'jose';
import _ from 'lodash';
import * as env from '../lib/env';
import { getSolanaConnection } from '../lib/utils';

const handler: Handler = async (event) => {
    try {
        assert(event.httpMethod === 'POST');

        assert(event.body);
        const j = JSON.parse(event.isBase64Encoded
            ? Buffer.from(event.body, 'base64').toString('utf-8')
            : event.body);

        const message: string = j.message;
        const from: string = j.from;
        const solana = getSolanaConnection();
        const sigs = await solana.getConfirmedSignaturesForAddress2(new Solana.PublicKey(from))
        const lamports = _.random(env.MIN_LAMPORTS, env.MAX_LAMPORTS)
        const destination = env.PAYMENT_DESTINATION ?? from;

        assert(env.JWK_PRIVATE_KEY);
        const key = await jose.importJWK(JSON.parse(env.JWK_PRIVATE_KEY), env.JWT_ALGORITHM);
        const jwt1 = await new jose.SignJWT({
            message,
            from,
            prevSig: sigs ? sigs[0].signature : null,
            destination,
            lamports
        }).setProtectedHeader({
            alg: env.JWT_ALGORITHM
        }).setExpirationTime(+Date.now() + env.JWT_EXPIRY * 1000)
            .sign(key)
        return {
            statusCode: 200,
            body: JSON.stringify({ jwt: jwt1, lamports, destination })
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500
        };
    }
}

export { handler };