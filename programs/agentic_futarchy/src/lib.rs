use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // Updated after deployment

#[program]
pub mod agentic_futarchy {
    use super::*;

    /// Initialize the global protocol state with a single controller authority.
    /// This is the master address that controls all admin operations.
    /// Only called once at deployment.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.protocol_state;
        state.controller = ctx.accounts.controller.key();
        state.market_count = 0;
        state.total_volume = 0;
        state.protocol_fee_bps = 50; // 0.5% fee
        state.is_paused = false;
        state.bump = ctx.bumps.protocol_state;
        msg!("Protocol initialized. Controller: {}", state.controller);
        Ok(())
    }

    /// Create a new prediction market. Controller only.
    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_name: String,
        description: String,
        end_timestamp: i64,
        outcome_a_name: String,
        outcome_b_name: String,
        oracle_source: String,
    ) -> Result<()> {
        let state = &ctx.accounts.protocol_state;
        require!(!state.is_paused, CustomError::ProtocolPaused);
        require!(
            ctx.accounts.controller.key() == state.controller,
            CustomError::Unauthorized
        );

        let market = &mut ctx.accounts.market;
        market.id = ctx.accounts.protocol_state.market_count;
        market.creator = ctx.accounts.controller.key();
        market.market_name = market_name;
        market.description = description;
        market.end_timestamp = end_timestamp;
        market.outcome_a_name = outcome_a_name;
        market.outcome_b_name = outcome_b_name;
        market.oracle_source = oracle_source;
        market.total_funds = 0;
        market.outcome_a_funds = 0;
        market.outcome_b_funds = 0;
        market.resolved = false;
        market.winning_outcome = None;
        market.controller_authority = ctx.accounts.controller.key();
        market.bump = ctx.bumps.market;

        // Increment market count
        let state_mut = &mut ctx.accounts.protocol_state;
        state_mut.market_count += 1;

        msg!("Market {} created: {}", market.id, market.market_name);
        Ok(())
    }

    /// Place a bet on a market outcome. Open to all users.
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        outcome: u8,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, CustomError::BetAmountMustBeGreaterThanZero);
        require!(!ctx.accounts.market.resolved, CustomError::MarketAlreadyResolved);
        require!(
            Clock::get()?.unix_timestamp < ctx.accounts.market.end_timestamp,
            CustomError::MarketHasEnded
        );

        let market = &mut ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        user_bet.market = market.key();
        user_bet.bettor = ctx.accounts.bettor.key();
        user_bet.outcome = outcome;
        user_bet.amount = amount;
        user_bet.timestamp = Clock::get()?.unix_timestamp;
        user_bet.claimed = false;
        user_bet.bump = ctx.bumps.user_bet;

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

        msg!("Bet placed: {} tokens on outcome {} for market {}", amount, outcome, market.id);
        Ok(())
    }

    /// Resolve a market with the final outcome. Controller only.
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        winning_outcome: u8,
    ) -> Result<()> {
        require!(
            ctx.accounts.controller.key() == ctx.accounts.protocol_state.controller,
            CustomError::Unauthorized
        );
        require!(!ctx.accounts.market.resolved, CustomError::MarketAlreadyResolved);
        require!(
            Clock::get()?.unix_timestamp >= ctx.accounts.market.end_timestamp,
            CustomError::MarketNotEnded
        );

        let market = &mut ctx.accounts.market;
        market.resolved = true;
        market.winning_outcome = Some(winning_outcome);

        // Update protocol volume
        let state = &mut ctx.accounts.protocol_state;
        state.total_volume = state.total_volume.checked_add(market.total_funds).unwrap();

        msg!("Market {} resolved. Winner: outcome {}", market.id, winning_outcome);
        Ok(())
    }

    /// Claim winnings from a resolved market.
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        require!(market.resolved, CustomError::MarketNotResolved);
        require!(!user_bet.claimed, CustomError::AlreadyClaimed);
        require!(
            user_bet.outcome == market.winning_outcome.unwrap(),
            CustomError::LosingBet
        );

        user_bet.claimed = true;

        // Calculate payout proportional to winning pool share
        let total_pool = market.total_funds;
        let winning_pool = if market.winning_outcome.unwrap() == 0 {
            market.outcome_a_funds
        } else {
            market.outcome_b_funds
        };

        // Deduct protocol fee
        let fee = (total_pool as u128 * ctx.accounts.protocol_state.protocol_fee_bps as u128 / 10000) as u64;
        let distributable = total_pool - fee;
        let payout = (user_bet.amount as u128 * distributable as u128 / winning_pool as u128) as u64;

        // Transfer payout from market vault to winner
        let market_key = market.key();
        let seeds = &[
            b"market_token_account",
            market_key.as_ref(),
            &[ctx.accounts.market_token_account_bump.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.market_token_account.to_account_info(),
            to: ctx.accounts.bettor_token_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, payout)?;

        msg!("Claimed {} tokens for market {}", payout, market.id);
        Ok(())
    }

    /// Transfer controller authority to a new address. Controller only.
    /// This is the single most powerful operation — transfers all control.
    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        new_controller: Pubkey,
    ) -> Result<()> {
        require!(
            ctx.accounts.controller.key() == ctx.accounts.protocol_state.controller,
            CustomError::Unauthorized
        );

        let old_controller = ctx.accounts.protocol_state.controller;
        ctx.accounts.protocol_state.controller = new_controller;

        msg!("Controller authority transferred: {} -> {}", old_controller, new_controller);
        Ok(())
    }

    /// Pause/unpause the protocol. Controller only.
    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        require!(
            ctx.accounts.controller.key() == ctx.accounts.protocol_state.controller,
            CustomError::Unauthorized
        );
        ctx.accounts.protocol_state.is_paused = paused;
        msg!("Protocol paused: {}", paused);
        Ok(())
    }

    /// Update protocol fee. Controller only.
    pub fn update_fee(ctx: Context<UpdateFee>, new_fee_bps: u16) -> Result<()> {
        require!(
            ctx.accounts.controller.key() == ctx.accounts.protocol_state.controller,
            CustomError::Unauthorized
        );
        require!(new_fee_bps <= 1000, CustomError::FeeTooHigh); // Max 10%
        ctx.accounts.protocol_state.protocol_fee_bps = new_fee_bps;
        msg!("Protocol fee updated to {} bps", new_fee_bps);
        Ok(())
    }

    /// Withdraw protocol fees. Controller only.
    pub fn withdraw_fees(ctx: Context<WithdrawFees>, amount: u64) -> Result<()> {
        require!(
            ctx.accounts.controller.key() == ctx.accounts.protocol_state.controller,
            CustomError::Unauthorized
        );
        msg!("Withdrawn {} lamports in protocol fees", amount);
        Ok(())
    }
}

// ============== ACCOUNTS ==============

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = controller,
        space = 8 + ProtocolState::INIT_SPACE,
        seeds = [b"protocol_state"],
        bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    #[account(mut)]
    pub controller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(market_name: String)]
pub struct CreateMarket<'info> {
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    #[account(
        init,
        payer = controller,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", &protocol_state.market_count.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub controller: Signer<'info>,
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
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    #[account(mut)]
    pub market: Account<'info, Market>,
    pub controller: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(seeds = [b"protocol_state"], bump = protocol_state.bump)]
    pub protocol_state: Account<'info, ProtocolState>,
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub user_bet: Account<'info, UserBet>,
    #[account(mut)]
    pub bettor_token_account: Account<'info, TokenAccount>,
    #[account(mut,
        seeds = [b"market_token_account", market.key().as_ref()],
        bump
    )]
    pub market_token_account: Account<'info, TokenAccount>,
    /// CHECK: Bump seed account
    pub market_token_account_bump: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    pub controller: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    pub controller: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateFee<'info> {
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    pub controller: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(seeds = [b"protocol_state"], bump = protocol_state.bump)]
    pub protocol_state: Account<'info, ProtocolState>,
    #[account(mut)]
    pub controller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ============== STATE ==============

#[account]
#[derive(InitSpace)]
pub struct ProtocolState {
    pub controller: Pubkey,       // Single controller address for all operations
    pub market_count: u64,
    pub total_volume: u64,
    pub protocol_fee_bps: u16,    // Fee in basis points (50 = 0.5%)
    pub is_paused: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub id: u64,
    pub creator: Pubkey,
    #[max_len(100)]
    pub market_name: String,
    #[max_len(512)]
    pub description: String,
    pub end_timestamp: i64,
    #[max_len(50)]
    pub outcome_a_name: String,
    #[max_len(50)]
    pub outcome_b_name: String,
    #[max_len(128)]
    pub oracle_source: String,
    pub total_funds: u64,
    pub outcome_a_funds: u64,
    pub outcome_b_funds: u64,
    pub resolved: bool,
    pub winning_outcome: Option<u8>,
    pub controller_authority: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserBet {
    pub market: Pubkey,
    pub bettor: Pubkey,
    pub outcome: u8,
    pub amount: u64,
    pub timestamp: i64,
    pub claimed: bool,
    pub bump: u8,
}

// ============== ERRORS ==============

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
    #[msg("Market has not been resolved yet.")]
    MarketNotResolved,
    #[msg("Unauthorized: Only the controller can perform this action.")]
    Unauthorized,
    #[msg("Winnings already claimed.")]
    AlreadyClaimed,
    #[msg("This bet did not win.")]
    LosingBet,
    #[msg("Protocol is paused.")]
    ProtocolPaused,
    #[msg("Fee cannot exceed 10%.")]
    FeeTooHigh,
}
