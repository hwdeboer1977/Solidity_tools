# Assignment module 14

## Assignment (part1): employ any smart contract automation tool that you have studied so far in this week.

### I used the following oracles:

##### OpenZeppelin Defender Relayer & Monitor:

- I use NodeJS server which can be found here: ".....\blockchain-frontend\src\server.js"
- More detailed information can be found in this JS file.

##### ChainLink Automation:

- Chainlink time-based keeper: ".\TimeBased_Counter.sol"
- Chainlink custom logic keeper: ".\CustomLogic_Mint.sol"
- Chainlink log trigger keeper: ".\CountEmitLog.sol" & "CountWithLog.sol".
- These Solidity files contain more detailed information in the comments.

##### The Graph Protocol

- Created a subgraph to query the first mints of the CryptoPunks NFTs.

## Assignment (part2): Create a minimalistic frontend

- The minimalistic frontend is created in React.
- Users can use the frontend buttons to call the Solidity functions above.
- The frontend can be found here: "...\blockchain-frontend\".
- Use npm start
