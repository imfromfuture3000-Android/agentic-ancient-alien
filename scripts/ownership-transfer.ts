import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

async function transferOwnership() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    
    // This is a placeholder for the actual program and instruction
    console.log('Transferring program ownership to multisig authority...');
    
    // Example: Calling the transferOwnership instruction
    // await program.methods.transferOwnership(newAuthority).accounts({ ... }).rpc();
    
    console.log('Ownership transfer initiated via multisig.');
}

transferOwnership().catch(err => {
    console.error(err);
    process.exit(1);
});
