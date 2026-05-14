import hre from "hardhat";
import { parseEther } from "ethers";

async function testMitigation(contractName, deployer, victim, attacker) {
    console.log(`\n--- Testing ${contractName} ---`);
    const ContractFactory = await hre.ethers.getContractFactory(contractName);
    const dao = await ContractFactory.connect(deployer).deploy();
    await dao.waitForDeployment();
    const daoAddress = await dao.getAddress();

    await dao.connect(victim).deposit({ value: parseEther("10.0") });
    
    const DAOAttacker = await hre.ethers.getContractFactory("DAOAttacker");
    const attackerContract = await DAOAttacker.connect(attacker).deploy(daoAddress);
    await attackerContract.waitForDeployment();

    console.log("Attacker attempting to drain...");
    try {
        await attackerContract.connect(attacker).attack({ value: parseEther("1.0") });
        console.log(`FAILED: ${contractName} was drained! Vulnerability remains.`);
    } catch (error) {
        console.log(`SUCCESS: Attack reverted on ${contractName}.`);
        if (contractName === "SimpleDAO_PullPayment") {
            console.log("Testing normal withdrawal on PullPayment...");
            await dao.connect(victim).initiateWithdrawal(parseEther("10.0"));
            await dao.connect(victim).claimPayment();
            const daoBal = await hre.ethers.provider.getBalance(daoAddress);
            console.log(`Victim successfully withdrew funds via PullPayment. DAO balance: ${hre.ethers.formatEther(daoBal)} ETH`);
        }
    }
}

async function main() {
    console.log("=== DAO Mitigations Verification ===");
    const [deployer, victim, attacker] = await hre.ethers.getSigners();

    await testMitigation("SimpleDAO_CEI", deployer, victim, attacker);
    await testMitigation("SimpleDAO_Guard", deployer, victim, attacker);
    await testMitigation("SimpleDAO_PullPayment", deployer, victim, attacker);
}

main().catch(console.error);
