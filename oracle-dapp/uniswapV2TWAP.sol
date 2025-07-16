

//SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
// NOTE: using solidity 0.6.6 to match imports

// Uniswap documentation:
// https://github.com/Uniswap/v2-periphery/blob/master/contracts/examples/ExampleOracleSimple.sol

// Fixed-Point Arithmetic: The contract uses Chainlink's FixedPoint library to perform arithmetic with high precision. 
// The uq112x112 format is used for storing prices, and the multiplication and division are done using fixed-point arithmetic 
// to avoid precision errors.

// Cumulative Price Calculations: The price0Cumulative and price1Cumulative are cumulative values that increase with each new block. 
// The TWAP is calculated by subtracting the last cumulative price from the current one and dividing by the time elapsed between the two updates.

// Overflow Handling: The contract's design expects overflow in the cumulative price calculations (since they are using large numbers), 
// which is normal for these types of cumulative metrics. The price differences are divided by the time elapsed to get the average price.

// IUniswapV2Pair: Interface to interact with the pair contract (liquidity pool).
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
// FixedPoint: A library for handling fixed-point arithmetic with high precision.
import "@uniswap/lib/contracts/libraries/FixedPoint.sol";
// UniswapV2OracleLibrary: A library that provides functions for getting cumulative prices and reserves from Uniswap.
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2OracleLibrary.sol";
// UniswapV2Library: Used for various utility functions like getting pair addresses.
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

// UniswapV2Factory: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f 
// Check pools Sepolia at: https://www.geckoterminal.com/sepolia-testnet/pools/0x92b8274aba7ab667bee7eb776ec1de32438d90bf
// Pair address: 0x92b8274aba7ab667bee7eb776ec1de32438d90bf
// USDC: 0xbe72e441bf55620febc26715db68d3494213d8cb
// WETH: 0xfff9976782d46cc05630d1f6ebab18b2324d6b14

// Additional info: https://www.rareskills.io/post/twap-uniswap-v2

contract UniswapV2Twap {
    using FixedPoint for *;

    uint public constant PERIOD = 10;

    IUniswapV2Pair public immutable pair;
    address public immutable token0;
    address public immutable token1;

    uint public price0CumulativeLast;
    uint public price1CumulativeLast;
    uint32 public blockTimestampLast;

    // NOTE: binary fixed point numbers
    // range: [0, 2**112 - 1]
    // resolution: 1 / 2**112
    FixedPoint.uq112x112 public price0Average;
    FixedPoint.uq112x112 public price1Average;

    // NOTE: public visibility
    // NOTE: IUniswapV2Pair
    constructor(IUniswapV2Pair _pair) public {
        pair = _pair;
        token0 = _pair.token0();
        token1 = _pair.token1();
        // price0CumulativeLast and price1CumulativeLast: The cumulative price of token0 and token1 at the last update.
        price0CumulativeLast = _pair.price0CumulativeLast();
        price1CumulativeLast = _pair.price1CumulativeLast();
        (, , blockTimestampLast) = _pair.getReserves();
    }

    // price0Average and price1Average: The average prices of token0 and token1 over the PERIOD, stored as uq112x112 (fixed-point format).
    // The update function updates the TWAP prices by calculating the average price of the tokens over the last PERIOD seconds.
    function update() external {
        (
            uint price0Cumulative,
            uint price1Cumulative,
            uint32 blockTimestamp
        ) = UniswapV2OracleLibrary.currentCumulativePrices(address(pair));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;

        require(timeElapsed >= PERIOD, "time elapsed < min period");

        // NOTE: overflow is desired
        /*
        |----b-------------------------a---------|
        0                                     2**256 - 1

        b - a is preserved even if b overflows
        */
        // NOTE: uint -> uint224 cuts off the bits above uint224
        // max uint
        // 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
        // max uint244
        // 0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff
        price0Average = FixedPoint.uq112x112(
            uint224((price0Cumulative - price0CumulativeLast) / timeElapsed)
        );
        price1Average = FixedPoint.uq112x112(
            uint224((price1Cumulative - price1CumulativeLast) / timeElapsed)
        );

        price0CumulativeLast = price0Cumulative;
        price1CumulativeLast = price1Cumulative;
        blockTimestampLast = blockTimestamp;
    }

    // The consult function allows users to get the current average price for a given token.
    function consult(address token, uint amountIn)
        external
        view
        returns (uint amountOut)
    {
        require(token == token0 || token == token1, "invalid token");

        if (token == token0) {
            // NOTE: using FixedPoint for *
            // NOTE: mul returns uq144x112
            // NOTE: decode144 decodes uq144x112 to uint144
            amountOut = price0Average.mul(amountIn).decode144();
        } else {
            amountOut = price1Average.mul(amountIn).decode144();
        }
    }
}