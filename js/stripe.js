"use strict";
var idcore_stripe_pay_ok;
if (typeof idcore_pay_ok == 'function') { 
	idcore_stripe_pay_ok = idcore_pay_ok;
}
idcore_pay_ok = function(_provider, _params) {
	if (typeof idcore_stripe_pay_ok == 'function') { 
		idcore_stripe_pay_ok(_provider, _params);
	}
	if (_provider == "stripe") {
		if (_params.hasOwnProperty("public_key") && _params.hasOwnProperty("session_id")) {
			try {
				var stripe = Stripe(_params.public_key);
				stripe.redirectToCheckout({sessionId: _params.session_id}).then(function (result) {});
			} catch(error) {
				console.log(error);
			}
		}
	}
}