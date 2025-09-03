# Blockstat WBTC Vault (ERC-4626)

An ERC-4626 vault for **WBTC (8 decimals)**. Users deposit WBTC and receive vault shares. The vault adds:

- **Global TVL cap**
- **Per-user max deposit (cumulative)**
- **Per-transaction min deposit**
- **Owner-triggered `rebalance()`** that sends idle WBTC to two whitelisted wallets (e.g., Drift + Hyperliquid legs)
- **NAV accounting** via `externalNav` so the share price stays correct after funds are moved off-contract.

## Files

- `contracts/Vault.sol` – the vault implementation (4626 + caps/min + rebalance + NAV).
- `contracts/MockWBTC.sol` – simple 8-decimals mock token for tests.
- `test/Vault.test.js` – Hardhat (CJS) tests covering deposits, caps, rebalance, and NAV.

## Quick start (Hardhat 2.x / CommonJS)

```bash
npm i -D hardhat@2.22.10 @nomicfoundation/hardhat-toolbox@3.0.0
npm i @openzeppelin/contracts
# ensure package.json does NOT have "type": "module"

npx hardhat compile
npx hardhat test
```

## Owner controls (runtime configurable)

In the version we just built, you (the owner) can change all of these at any time:

- **Max TVL (global cap)** → `setDepositCap(uint256 newCap)`
- **Max deposit per user (cumulative)** → `setPerUserDepositCap(uint256 newCap)` _(set `0` to disable)_
- **Min deposit per tx** → `setDepositMin(uint256 newMin)`
- **Rebalance split (e.g., 85/15)** → `setSplitBPS(uint16 bps)` _(0–10000; 8500 = 85%)_
- **Rebalance threshold (min chunk)** → `setRebalanceMin(uint256 minAmount)`
- **Rebalance destination wallets** → `setRecipients(address recipientA, address recipientB)`

> Notes
>
> - `maxDeposit(receiver)` returns the remaining room for that address considering **both** the global cap and per-user cap.
> - `pause()` blocks `deposit`/`mint`, while **withdraw/redeem still work**.
> - `rescue()` **cannot** move the underlying asset (WBTC).

## Rebalance & NAV

`rebalance(amount)` (owner/keeper-called) pushes **idle** WBTC to `recipientA` and `recipientB` using `splitA_BPS`. It requires:

- recipients set,
- `amount >= rebalanceMin`,
- `amount <= idleAssets()`.

When a rebalance moves funds out, the vault **increases** `externalNav` by `amount` so `totalAssets()` and the share price don’t drop. Later, as PnL changes off-chain, the owner updates NAV with `reportExternalNav(newNav)` (still in WBTC units).

**NAV = Net Asset Value**

- **Total NAV (in WBTC units)** = on-chain WBTC held by the vault **+** `externalNav` (the WBTC-denominated value of assets deployed off-contract, e.g., on Drift/Hyperliquid). _In code, that’s what `totalAssets()` returns._
- **Per-share NAV (share price)** ≈ `totalAssets() / totalSupply()` in underlying units (WBTC). ERC-4626 exposes this via `convertToShares()` / `convertToAssets()`.
- **`externalNav`** is the accounting hook for off-chain/on-other-chain positions. After a `rebalance()` moves WBTC out, we **increase** `externalNav` by that amount so share price doesn’t drop. Later, as PnL changes, **update** it with `reportExternalNav(newNav)` (still in WBTC units).

**Quick example**

- On-chain idle = **10.0 WBTC**
- `externalNav` = **15.0 WBTC**
- `totalAssets()` = **25.0 WBTC**
- `totalSupply()` = **20.0 shares** → per-share NAV ≈ **1.25 WBTC/share**

## What the tests cover (`test/Vault.test.js`)

- Deploy mock WBTC + vault; verifies **deposit** (≥ min) mints shares 1:1 initially.
- Enforces **per-user cumulative cap** and **global TVL cap**.
- **Pause** blocks deposits/mints but allows withdraw/redeem.
- **Rebalance** moves idle WBTC to recipients, respects split & threshold, **keeps totalAssets stable** (via `externalNav`).
- **reportExternalNav** updates share price for off-chain PnL.
- `rescue()` cannot rescue the underlying asset.

## Tips

- WBTC uses **8 decimals**: use `ethers.parseUnits("amount", 8)`.
- Per-user cap is **cumulative exposure** (`convertToAssets(balanceOf(user))`), not Sybil-resistant.
- Keep a sensible **idle buffer** operationally to serve routine withdrawals quickly.

```

```
