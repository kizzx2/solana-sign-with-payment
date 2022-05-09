import * as Solana from '@solana/web3.js';
import * as env from './env';

export function getSolanaConnection() {
    const clusters = ['mainnet-beta', 'devnet', 'testnet'];
    return new Solana.Connection(clusters.includes(env.SOLANA_API_URL)
        ? Solana.clusterApiUrl(env.SOLANA_API_URL as Solana.Cluster)
        : env.SOLANA_API_URL);
}
