const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying KeyLedger contract...");

  const KeyLedger = await hre.ethers.getContractFactory("KeyLedger");
  const keyLedger = await KeyLedger.deploy();
  await keyLedger.waitForDeployment();

  const contractAddress = await keyLedger.getAddress();
  console.log(`✓ KeyLedger deployed successfully to: ${contractAddress}`);

  // Fetch contract artifact for ABI
  const artifact = await hre.artifacts.readArtifact("KeyLedger");

  // Output deployment config to backend
  const backendConfigDir = path.join(__dirname, "../backend");
  const configPath = path.join(backendConfigDir, "contractAddress.json");

  const deploymentData = {
    address: contractAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  fs.writeFileSync(configPath, JSON.stringify(deploymentData, null, 2));
  console.log(`✓ Contract deployment info and ABI written to: ${configPath}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
