import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "paris" // Required to observe physical bytecode removal resulting from SELFDESTRUCT (Parity #2)
    }
  },
  networks: {
    hardhat: {
      hardfork: "merge" // Pre-Cancun hardfork for SELFDESTRUCT behavior
    }
  }
};
