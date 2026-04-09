import { PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

async function mapPDAs() {
    const programId = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
    
    console.log(`Mapping PDAs for program ${programId.toBase58()}...`);
    
    // Example: Derived PDAs for a specific market name
    const marketName = 'Example Market';
    const [marketPda, marketBump] = await PublicKey.findProgramAddress(
        [Buffer.from('market'), Buffer.from(marketName)],
        programId
    );
    
    const pdaMap = {
        programId: programId.toBase58(),
        mappings: [
            { type: 'market', seeds: ['market', marketName], address: marketPda.toBase58(), bump: marketBump },
        ],
    };
    
    const reportPath = path.join(__dirname, '../scan-reports/pda-map.json');
    fs.writeFileSync(reportPath, JSON.stringify(pdaMap, null, 2));
    console.log(`PDA map saved to ${reportPath}`);
}

mapPDAs().catch(err => {
    console.error(err);
    process.exit(1);
});
