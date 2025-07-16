//SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";


// Addresses are here: https://docs.uniswap.org/contracts/v3/reference/deployments/ethereum-deployments
// Pool info is here: https://www.geckoterminal.com/sepolia-testnet/pools/0x224cc4e5b50036108c1d862442365054600c260c

// On SEPOLIA contract factory address v3 = 0x0227628f3F023bb0B980b67D528571c95c6DaC1c
// WETH: 0xfff9976782d46cc05630d1f6ebab18b2324d6b14
// UNI: 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984
// FEE: 500 (=0.5%) 

contract UniswapV3Twap {
    address public immutable token0;
    address public immutable token1;
    address public immutable pool;

    constructor(
        address _factory,
        address _token0,
        address _token1,
        uint24 _fee
    ) {
        token0 = _token0;
        token1 = _token1;

        address _pool = IUniswapV3Factory(_factory).getPool(
            _token0,
            _token1,
            _fee
        );
        require(_pool != address(0), "pool doesn't exist");

        pool = _pool;
    }

    function estimateAmountOut(
        address tokenIn,
        uint128 amountIn,
        uint32 secondsAgo
    ) external view returns (uint amountOut) {
        require(tokenIn == token0 || tokenIn == token1, "invalid token");

        address tokenOut = tokenIn == token0 ? token1 : token0;

        // Method 1: easy method with OracleLibrary.consult
        // This is a function to weigh the Time Weighted Average Tick (TWAT)
        // (int24 tick, ) = OracleLibrary.consult(pool, secondsAgo);

        // Method 2: more gas efficient method by using code from consult function
        // Code copied from OracleLibrary.sol, consult()
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = secondsAgo;
        secondsAgos[1] = 0;

        // int56 since tick * time = int24 * uint32
        // 56 = 24 + 32
        (int56[] memory tickCumulatives, ) = IUniswapV3Pool(pool).observe(
            secondsAgos
        );

        int56 tickCumulativesDelta = tickCumulatives[1] - tickCumulatives[0];

        // int56 / uint32 = int24
        int24 tick = int24(tickCumulativesDelta / secondsAgo);
        // Always round to negative infinity
        /*
        int doesn't round down when it is negative

        int56 a = -3
        -3 / 10 = -3.3333... so round down to -4
        but we get
        a / 10 = -3

        so if tickCumulativeDelta < 0 and division has remainder, then round
        down
        */
        if (
            tickCumulativesDelta < 0 && (tickCumulativesDelta % secondsAgo != 0)
        ) {
            tick--;
        }

        amountOut = OracleLibrary.getQuoteAtTick(
            tick,
            amountIn,
            tokenIn,
            tokenOut
        );
    }
}