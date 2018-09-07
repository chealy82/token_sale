var KhmerToken = artifacts.require("./KhmerToken.sol");
var KhmerTokenSale = artifacts.require("./KhmerTokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(KhmerToken, 1000000).then(function() {
    // Token price is 0.001 Ether
    var tokenPrice = 1000000000000000;
    return deployer.deploy(KhmerTokenSale, KhmerToken.address, tokenPrice);
  });
};
