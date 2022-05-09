import { Handler } from '@netlify/functions';
import * as Solana from '@solana/web3.js';
import assert from 'assert';
import * as jose from 'jose';
import * as env from '../lib/env';
import { getSolanaConnection } from '../lib/utils';

const handler: Handler = async (event) => {
    try {
        assert(event.httpMethod === 'POST');
        assert(event.body);
        const j = JSON.parse(event.isBase64Encoded
            ? Buffer.from(event.body, 'base64').toString('utf-8')
            : event.body);

        const jwt1: string = j.jwt;
        const sig: string = j.sig;

        assert(env.JWK_PRIVATE_KEY);
        const key = await jose.importJWK(JSON.parse(env.JWK_PRIVATE_KEY), env.JWT_ALGORITHM);
        const payload = (await jose.jwtVerify(jwt1, key)).payload;

        assert(payload.exp && payload.exp > +new Date());

        const solana = getSolanaConnection();
        const sigs = await solana.getConfirmedSignaturesForAddress2(new Solana.PublicKey(payload.from as string))

        assert(sigs.length > 0);
        assert(sigs[0].signature === sig);
        if (!payload.prevSig) {
            assert(sigs.length === 1);
        } else {
            assert(sigs[1].signature === payload.prevSig);
        }

        const tx = await solana.getParsedTransaction(sig, 'confirmed');
        assert(tx);

        assert(tx.transaction.signatures.length === 1);
        assert(tx.transaction.signatures[0] === sig);
        assert(tx.transaction.message.accountKeys.length === 2);
        assert(tx.transaction.message.accountKeys[0].signer);
        assert(tx.transaction.message.accountKeys[0].writable);
        assert(tx.transaction.message.accountKeys[0].pubkey.toString() === payload.from);
        assert(!tx.transaction.message.accountKeys[1].signer);
        assert(!tx.transaction.message.accountKeys[1].writable);
        assert(tx.transaction.message.accountKeys[1].pubkey.equals(Solana.SystemProgram.programId));
        assert(tx.transaction.message.instructions.length === 1);

        const instr = tx.transaction.message.instructions[0] as Solana.ParsedInstruction;
        assert(instr.programId.equals(Solana.SystemProgram.programId));
        assert(instr.program === 'system');
        assert(instr.parsed.type === 'transfer');
        assert(instr.parsed.info.destination === payload.destination);
        assert(instr.parsed.info.lamports === payload.lamports);
        assert(instr.parsed.info.source === payload.from);

        return {
            statusCode: 200,
            body: JSON.stringify({
                jwt: await new jose.SignJWT({
                    message: payload.message,
                    from: payload.from
                }).setProtectedHeader({
                    alg: env.JWT_ALGORITHM
                }).sign(key)
            })
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500
        };
    }
}

export { handler };