// Import du smart contract "SimpleStorage"
const Voting = artifacts.require("Voting");
module.exports = (deployer) => {
 // Deployer le smart contract!
 deployer.deploy(Voting);
}