App = {
	web3Provider: null,
	constracts: {},
	account:'0x0',
	loading: false,
	tokenPrice: 1000000000000000,
	tokensSold: 0,
	tokensAvailable: 750000,

	init: function() {
		//console.log("App initialized...")
		return App.initWeb3();
	},

	initWeb3: function() {
	    if (typeof web3 !== 'undefined') {
	      // If a web3 instance is already provided by Meta Mask.
	      App.web3Provider = web3.currentProvider;
	      web3 = new Web3(web3.currentProvider);
	    } else {
	      // Specify default instance if no web3 instance provided
	      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
	      web3 = new Web3(App.web3Provider);
	    }

	    
	    return App.initContracts();
	},

	initContracts: function() {
		$.getJSON("KhmerTokenSale.json", function(khmerTokenSale) {
			App.constracts.KhmerTokenSale = TruffleContract(khmerTokenSale);
			App.constracts.KhmerTokenSale.setProvider(App.web3Provider);
			App.constracts.KhmerTokenSale.deployed().then(function(khmerTokenSale) {
				//console.log("Khmer Token Sale Address:", khmerTokenSale.address);
			});
		}).done(function() {
			$.getJSON("KhmerToken.json", function(khmerToken) {
				App.constracts.KhmerToken = TruffleContract(khmerToken);
				App.constracts.KhmerToken.setProvider(App.web3Provider);
				App.constracts.KhmerToken.deployed().then(function(khmerToken) {
					//console.log("Khmer Token Address:", khmerToken.address);
				});
				App.listenForEvents();
				return App.render();	
			});
		})
	},

	// Listen for events emitted from the contract
	listenForEvents: function() {
		App.constracts.KhmerTokenSale.deployed().then(function(instance) {
			instance.Sell({}, {
				fromBlock: 0,
				toBlock: 'latest',
			}).watch(function(err, event) {
				//console.log("event triggered", event);
				App.render();
			})
		})
	},
	render: function() {
		if (App.loading) {
			return;
		}
		App.loading = true;

		var loader = $('#loader');
		var content = $('#content');
 		
 		loader.show();
 		content.hide();

		//load account data
		web3.eth.getCoinbase(function(err, account) {
			if(err === null) { 
				App.account = account;
				$('#accountAddress').html("Your Account: " + account);
			}
		})

		// load token sale contract
		App.constracts.KhmerTokenSale.deployed().then(function(instance) {
			khmerTokenSaleInstance = instance;
			return khmerTokenSaleInstance.tokenPrice();
		}).then(function(tokenPrice) {
			App.tokenPrice = tokenPrice;
			$('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
			return khmerTokenSaleInstance.tokensSold();
		}).then(function(tokensSold) {
			App.tokensSold = tokensSold.toNumber();
			$('.tokens-sold').html(App.tokensSold);
			$('.tokens-available').html(App.tokensAvailable);

			var progressPercent = (App.tokensSold/App.tokensAvailable) * 100;
			$('#progress').css('width', progressPercent + '%');

			// load token contract
			App.constracts.KhmerToken.deployed().then(function(instance) {
				khmerTokenInstance = instance;
				return khmerTokenInstance.balanceOf(App.account);
			}).then(function(balance) {
				$('.kht-balance').html(balance.toNumber());

				App.loading = false;
				loader.hide();
				content.show();
			})
		});		
	},

	buyTokens: function() {
		$('#content').hide();
		$('#loader').show();
		var numberOfTokens = $('#numberOfTokens').val();
		App.constracts.KhmerTokenSale.deployed().then(function(instance) {
			return instance.buyTokens(numberOfTokens, {
				from: App.account,
				value: numberOfTokens * App.tokenPrice,
				gas: 500000
			});
		}).then(function(result) {
			//console.log("Tokens bought...")
			$('form').trigger('reset') // reset number of tokens in form
			// wait for sell event
		});
	}
}

$(function() {
	$(window).load(function() {
		App.init();
	})
});