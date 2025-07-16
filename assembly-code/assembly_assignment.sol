// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract BitWise {
    // count the number of bit set in data.  i.e. data = 7, result = 3
    // Uint8 so 8 bits: 
    // 0 => 2^0 => 1
    // 1 => 2^1 => 2
    // 2 => 2^2 => 4
    // 3 => 2^3 => 8
    // 4 => 2^4 => 16
    // 5 => 2^5 => 32
    // 6 => 2^6 => 64
    // 7 => 2^7 => 128
    // So 0001 = 1, 0110 = 6, 1010 = 10 etc

    // LSB = Least Significant Bit = rightmost bit, position 0, 2^0
    // MSB = Most Significant Bit = leftmost bit, position 7, 2^7

    // Bitwise AND operation: Result is 1 if both corresponding bits are 1.
    // Result is 0 if either or both corresponding bits are 0.


    // So let's say: uint8 data = 7 == 00000111
    // Logic function:
    // The function iterates 8 times (once for each bit in uint8).
    // In each iteration:
    // Right Shift (>>): The data value is shifted i bits to the right.
    // Bitwise AND (&): The least significant bit (LSB) of the shifted value is extracted by performing & 1.
    // If the extracted bit is 1, the counter (result) is incremented.

    // Case 1: i = 0 ==> 7>>0 (rightshift) = 00000111 ==> Bitwise AND 00000111&00000001=00000001
    // Case 2: i = 1 ==> 7>>1 (rightshift) = 00000011 ==> Bitwise AND 00000011&00000001=00000001
    // Case 3: i = 2 ==> 7>>2 (rightshift) = 00000001 ==> Bitwise AND 00000001&00000001=00000001
    // Case 4: i = 3 ==> 7>>3 (rightshift) = 00000000 ==> Bitwise AND 00000000&00000001=00000000
    // Answer: 3

    function countBitSet(uint8 data) public pure returns (uint8 result) {
        for( uint i = 0; i < 8; i += 1) {
            if( ((data >> i) & 1) == 1) {
                result += 1;
            }
        }
    }

    function countBitSetAsm(uint8 data ) public pure returns (uint8 result) {
        // replace following line with inline assembly code
        // result = countBitSet(data);

        assembly {
            let counter := 0 // Initialize count
            for { let i := 0 } lt(i, 8) { i := add(i, 1) } {
                // Shift `data` right by `i` and Bitwise AND with 1
                // First: take shiftright ==> SR = shr(i, data)
                // Second: take Bitwise AND of SR and 1 ==>  and(shr(i, data), 1)
                // Finally: if equal to 1 then add 1 to counter and continue loop
                if eq(and(shr(i, data), 1), 1) {
                    counter := add(counter, 1)
                }
            }
            result := counter
        }
    }
}

// Add following test cases for String contract: 
// charAt("abcdef", 2) should return 0x6300
// charAt("", 0) should return 0x0000
// charAt("george", 10) should return 0x0000

// So the function should return the ASCII hexadecimal of index i of the string
// Special cases: if string = empty then return 0; if index too high (out of range) also return 0

// 2 inputs: (1) string and (2) index
// (1) String is stored as 32-byte word containing the string length.
// (2) Index: specifies the position of the character in the string, starting from 0

// Returns a bytes2

// charAt("abcdef", 2): 
    // input = "abcdef", index = 2.
    // Binary of "abcdef": [0x61, 0x62, 0x63, 0x64, 0x65, 0x66].
    // Character at index 2: 0x63
    // Return: 0x6300

// ASCII (Hexadecimal): [a, b, c, d, e, f] = [0x61, 0x62, 0x63, 0x64, 0x65, 0x66]     

contract String {
   
   // ATTEMPT 1: ALL CALCULATIONS IN 1 FUNCTION ==> NOT WORKING
   function charAt(string memory input, uint index) public pure returns(bytes1) {
        assembly{
            
            // input = "abcdef" 
            // equals 0x6162636465660000000000000000000000000000000000000000000000000000
            
            // Step 1: Load the length of the string (mload = memory load)
            // Reads the first 32 bytes at the memory address input, which contains the string length.
            // For "abcdef", length = 6 (in decimal) or 0x0000000000000006 (in hex).
            let length := mload(input)

            // Check if an index is out of bounds, so if index >= length, return 0x0000
            // lt(index, length): Compares index and length. Returns 1 if index < length, otherwise 0
            // So if index is too long, it equals 0 and code is executed
            if iszero(lt(index, length)) {
                // mstore(destination, value)
                mstore(0x0, 0x0000) // Stores 0x0000 at memory address 0x0
                // So 0x0000 (a 2-byte bytes2 representation) is padded with zeros to fit 32 bytes (because Solidity memory works with 32-byte words)
                // destination: 0x0
                // value: 0x0000000000000000000000000000000000000000000000000000000000000000
                
                // return(pointer, size)
                // pointer (0x0): Indicates the memory address to start reading from
                // size (0x20): Specifies the number of bytes to return which is 32 (or 0x20)
                return(0x0, 0x20)
            }

            // Calculate the position of the desired character

            // add(input, 0x20):
            // In Solidity, a string is stored in memory as
            // The first 32 bytes (at address input) hold the length of the string.
            // The actual string data starts immediately after, at input + 0x20.
            // So add 0x20 (32 bytes)

            // Step 2: Calculate the Character Position
            
            // add(input, 0x20):
            // Adds 0x20 (32 bytes) to input to skip the length field and point to the start of the string data.
            // Assume input = 0x80 (example memory address).
            // add(0x80, 0x20) = 0xA0.

            // add(0xA0, index):
            // Adds the index (2) to calculate the position of the desired character.
            // add(0xA0, 2) = 0xA2.

            // charPos = 0xA2: This is the memory address of the character at index 2.
            let charPos := add(add(input, 0x20), index)
            

            // Step 3: Load raw data
            // Loads the 32 bytes starting at charPos (0xA2).
            // Memory at 0xA0 (where string data starts):                   0x6162636465660000000000000000000000000000000000000000000000000000
            // Since charPos = 0xA2, the 32-byte word starting at 0xA2 is:  0x6263646566000000000000000000000000000000000000000000000000000000

            let rawData := mload(charPos)

            let customSlot := 0x40
            mstore(customSlot, rawData)
            return(0x40, 0x20)


        }
   }

   
   // Helper functions for debugging
   function debugLength(string memory input) public pure returns (uint) {
        assembly {
            // Load the length of the string from its memory pointer
            let length := mload(input)

            // Return the length
            mstore(0x0, length)
            return(0x0, 0x20)
        }
   }

    function debugCharPos(string memory input, uint index) public pure returns (uint) {
        assembly {
            // Load the offset of the string data
            let dataOffset := add(input, 0x20)

            // Calculate the memory position of the character at the given index
            let charPos := add(dataOffset, index)

            // Return the calculated memory position
            mstore(0x0, charPos)
            return(0x0, 0x20)
        }
    }


    function debugChar(string memory input, uint index) public pure returns (bytes1) {
        assembly {
            // Load the offset of the string data
            //         let dataOffset := add(input, 0x20)

            //         // Calculate the memory position of the character at the given index
            //         let charPos := add(dataOffset, index)

            // //let char := byte(0, mload(charPos))
            // let char := and(mload(charPos), 0xFF)
            // return(char, 0x20)


            // CHECK: debugCharPos("abcdef", 2) ==> debugCharPos = 162
            // Address (Decimal)
            // 

            let charPos := add(add(input, 0x20), index)
            let rawData := mload(charPos)
            mstore(0x0, rawData)
            return(0x0, 0x20)
        }
    }
}
    