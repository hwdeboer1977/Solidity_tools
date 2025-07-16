// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;




// ERC1155 create multiple token types within the same contract. 
// Each token type is identified by a token ID, and you can mint multiple copies of the same token
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyERC1155NFT is ERC1155, Ownable(msg.sender) {

    // How to run this code
    /* Step 1: Deploy MyNFT1155.sol and save its CA */
    /* Step 2: Deploy Authority with CA from above as input */
    /* Step 3: In MyNFT1155: call setAuthorityCA to transfer authority */
    // Step 4: In Authority: mint NFTs
    // Step 5: In MyNFT1155: call function 'uri' to link to correct CIDs at Pinata */

    // You must have a total of 7 tokens within the collection id [0-6] 
    // Define 7 token types with unique IDs [0-6]
    uint256 public constant TOKEN_0 = 0; // Sword
    uint256 public constant TOKEN_1 = 1; // Shield
    uint256 public constant TOKEN_2 = 2; // Armor
    uint256 public constant TOKEN_3 = 3; // Health
    uint256 public constant TOKEN_4 = 4; // Currency
    uint256 public constant TOKEN_5 = 5; // Gold
    uint256 public constant TOKEN_6 = 6; // Mystery card

    // Declare list JSON files with CID from Pinata 
    string[] public cidJsonList = [
        "ipfs://QmUPcFfughQRTD3dx11Tn1RdMcGg3NEEnq3PyPyxS7mPB4",
        "ipfs://QmYTxxh1qjDd8ynzPcbxYVYFxYYPBP6SETVMziiErGCDyD",
        "ipfs://QmVeCwbxKNxVDUi1frMRUvVyuSwnqzmHWUE2amAHk89C9K",
        "ipfs://QmX1RRpTzicrCkHwRwS1dC6NoiRRxkrnfCPf3GrPdxJf4W",
        "ipfs://QmZViXDUqsfqNbN12Ds7EgdCHbRFJimPpZZHcuCUiHzg8r",
        "ipfs://QmTxQfTQ2PykFMQgXBz75mzDUjwXFQdTAAEpUUDXVVhZJD",
        "ipfs://QmXLgkamNN7HpjxeAqJkJSniEyzHffeCqaCyAqHv4xCWdd"
    ];

    // Mapping of the tokenURI for each tokenId
    mapping(uint256 => string) public _tokenURIs;

    uint256 public constant COOLDOWN_TIME = 60; // In seconds

    uint256 public constant PRICE_TOKEN = 1; // Assuming all burns are 1 on 1 ratio
    
    address public authorityCA; // Contract address of the authority who handles mint/burns
 
    


    // Use a mapping to track mint time of user
    mapping(address => uint256) public timeOfMints;

    // There is no supply limit for each token
    constructor() ERC1155("") {
        // Initial deployment with no minting
    }

    // Modifier to use in burn and mint functions below
    modifier onlyAuthority() {
        require(msg.sender == authorityCA, "Only the Authority contract can call this");
        _;
    }

 
    
    // Set the authority contract address
    function setAuthorityCA(address _authorityCA) external onlyOwner {
        authorityCA = _authorityCA;
    } 



    // For ERC721 we call the tokenURI function 
    // I tried to call the tokenURI function in ERC1155 but it does not exits; use URI function instead 
    
     // Override the `uri` function to return the correct token URI
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(tokenId >= 0 && tokenId < cidJsonList.length, "Invalid token ID");
        return cidJsonList[tokenId];
    }


     // We need a burn function
    function burn(
        address from,
        uint256 id,
        uint256 value
    ) public onlyAuthority {
        _burn(from, id, value) ;
    }

    // Function to mint any amount of tokens  (no supply limit) for all tokenIDs [0-6]
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data // "0x" for empty
    ) public onlyAuthority {
        require(id >= 0 && id <= 6, "Invalid token ID");

        require(block.timestamp > timeOfMints[to]  + COOLDOWN_TIME, "Only 1 mint per 60 seconds"); 

        if (id == 3) {
            require(balanceOf(to, TOKEN_0) > 0 && balanceOf(to, TOKEN_1) > 0, "You need to burn tokenId 0 and 1 to mint 1 NFT of type 3"); // First test holding condition
            burn(to, TOKEN_0, PRICE_TOKEN * amount); // Burn of 1 NFT so more NFTs means more burns!
            burn(to, TOKEN_1, PRICE_TOKEN * amount);
        }
        if (id == 4) {
            require(balanceOf(to, TOKEN_1) > 0 && balanceOf(to, TOKEN_2) > 0, "You need to burn tokenId 1 and 2 to mint 1 NFT of type 4"); // First test holding condition
            burn(to, TOKEN_1, PRICE_TOKEN * amount);
            burn(to, TOKEN_2, PRICE_TOKEN * amount);
        }       
        if (id == 5) {
            require(balanceOf(to, TOKEN_0) > 0 && balanceOf(to, TOKEN_2) > 0, "You need to burn tokenId 0 and 2 to mint 1 NFT of type 5"); // First test holding condition
            burn(to, TOKEN_0, PRICE_TOKEN * amount);
            burn(to, TOKEN_2, PRICE_TOKEN * amount);
        }  
         if (id == 6) {
            require(balanceOf(to, TOKEN_0) > 0 && balanceOf(to, TOKEN_1) > 0 && balanceOf(to, TOKEN_2) > 0, "You need to burn tokenId 0, 1 and 2 to mint 1 NFT of type 6"); // First test holding condition
            burn(to, TOKEN_0, PRICE_TOKEN * amount);
            burn(to, TOKEN_1, PRICE_TOKEN * amount);
            burn(to, TOKEN_2, PRICE_TOKEN * amount);
        }  
              
        _mint(to, id, amount, data);

    


        timeOfMints[to] = block.timestamp; 
    }

    
         

}
