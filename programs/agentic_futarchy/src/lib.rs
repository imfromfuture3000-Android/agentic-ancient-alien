
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // Placeholder ID

#[program]
pub mod agentic_futarchy {
    use super::*;

    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_name: String,
        end_timestamp: i64,
        outcome_a_name: String,
        outcome_b_name: String,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.creator = ctx.accounts.creator.key();
        market.market_name = market_name;
        market.end_timestamp = end_timestamp;
        market.outcome_a_name = outcome_a_name;
        market.outcome_b_name = outcome_b_name;
        market.total_funds = 0;
        market.outcome_a_funds = 0;
        market.outcome_b_funds = 0;
        market.resolved = false;
        market.winning_outcome = None;
        market.multisig_authority = ctx.accounts.multisig_authority.key();
        market.bump = *ctx.bumps.get("market").unwrap();
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        outcome: u8,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, CustomError::BetAmountMustBeGreaterThanZero);
        require!(!ctx.accounts.market.resolved, CustomError::MarketAlreadyResolved);
        require!(Clock::get()?.unix_timestamp < ctx.accounts.market.end_timestamp, CustomError::MarketHasEnded);

        let market = &mut ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        user_bet.market = market.key();
        user_bet.bettor = ctx.accounts.bettor.key();
        user_bet.outcome = outcome;
        user_bet.amount = amount;
        user_bet.bump = *ctx.bumps.get("user_bet").unwrap();

        // Transfer tokens from user to market PDA
        let cpi_accounts = Transfer {
            from: ctx.accounts.bettor_token_account.to_account_info(),
            to: ctx.accounts.market_token_account.to_account_info(),
            authority: ctx.accounts.bettor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        market.total_funds = market.total_funds.checked_add(amount).unwrap();
        if outcome == 0 {
            market.outcome_a_funds = market.outcome_a_funds.checked_add(amount).unwrap();
        } else {
            market.outcome_b_funds = market.outcome_b_funds.checked_add(amount).unwrap();
        }

        Ok(())
    }

    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        winning_outcome: u8,
    ) -> Result<()> {
        require!(!ctx.accounts.market.resolved, CustomError::MarketAlreadyResolved);
        require!(Clock::get()?.unix_timestamp >= ctx.accounts.market.end_timestamp, CustomError::MarketNotEnded);
        require!(ctx.accounts.multisig_authority.key() == ctx.accounts.market.multisig_authority, CustomError::Unauthorized);

        let market = &mut ctx.accounts.market;
        market.resolved = true;
        market.winning_outcome = Some(winning_outcome);

        // TODO: Implement payout logic

        Ok(())
    }

    pub fn transfer_ownership(
        ctx: Context<TransferOwnership>,
        new_authority: Pubkey,
    ) -> Result<()> {
        require!(ctx.accounts.current_authority.key() == ctx.accounts.market.multisig_authority, CustomError::Unauthorized);
        ctx.accounts.market.multisig_authority = new_authority;
        Ok(())
    }

    pub fn withdraw_fees(
        ctx: Context<WithdrawFees>,
        amount: u64,
    ) -> Result<()> {
        require!(ctx.accounts.multisig_authority.key() == ctx.accounts.market.multisig_authority, CustomError::Unauthorized);
        // TODO: Implement fee withdrawal logic
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(market_name: String)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", market_name.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub creator: Signer<'info>,
    /// CHECK: This is the multisig authority for admin operations
    pub multisig_authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        init,
        payer = bettor,
        space = 8 + UserBet::INIT_SPACE,
        seeds = [b"user_bet", market.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub user_bet: Account<'info, UserBet>,
    #[account(mut)]
    pub bettor: Signer<'info>,
    #[account(mut,
        constraint = bettor_token_account.owner == bettor.key(),
        constraint = bettor_token_account.mint == market_token_account.mint
    )]
    pub bettor_token_account: Account<'info, TokenAccount>,
    #[account(mut,
        seeds = [b"market_token_account", market.key().as_ref()],
        bump,
        token::mint = bettor_token_account.mint,
        token::authority = market
    )]
    pub market_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    /// CHECK: This is the multisig authority for admin operations
    pub multisig_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferOwnership<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    /// CHECK: Current multisig authority
    pub current_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    /// CHECK: This is the multisig authority for admin operations
    pub multisig_authority: Signer<'info>,
    // TODO: Add fee destination account
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub creator: Pubkey,
    #[max_len(100)]
    pub market_name: String,
    pub end_timestamp: i64,
    #[max_len(50)]
    pub outcome_a_name: String,
    #[max_len(50)]
    pub outcome_b_name: String,
    pub total_funds: u64,
    pub outcome_a_funds: u64,
    pub outcome_b_funds: u64,
    pub resolved: bool,
    pub winning_outcome: Option<u8>,
    pub multisig_authority: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserBet {
    pub market: Pubkey,
    pub bettor: Pubkey,
    pub outcome: u8,
    pub amount: u64,
    pub bump: u8,
}

#[error_code]
pub enum CustomError {
    #[msg("Bet amount must be greater than zero.")]
    BetAmountMustBeGreaterThanZero,
    #[msg("Market has already been resolved.")]
    MarketAlreadyResolved,
    #[msg("Market has not ended yet.")]
    MarketNotEnded,
    #[msg("Market has ended, no more bets can be placed.")]
    MarketHasEnded,
    #[msg("Unauthorized to perform this action.")]
    Unauthorized,
}
