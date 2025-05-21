"use strict";
var idcore_busy = false;
var idcore_waiting_timer = 30;
var idcore_vars = {};
var idcore_pay_ok;
if (window.jQuery) {
	jQuery(document).ready(function(){
		if (typeof idcore_ajax_url != typeof undefined) {
			idcore_vars["mode"] = "local";
			idcore_vars["ajax-url"] = idcore_ajax_url;
			idcore_ready();
		} else {
			idcore_vars["mode"] = "remote";
			if (jQuery("#idcore-remote").length == 0 || !jQuery("#idcore-remote").attr("data-handler")) {
				alert('Make sure that you properly included idcore.js. Currently you did not.');
			}
			idcore_vars["ajax-url"] = jQuery("#idcore-remote").attr("data-handler");
			var script_url = jQuery("#idcore-remote").attr("src");

			var items = {};
			jQuery("div.idcore-button").each(function() {
				var file_id = jQuery(this).attr("data-id");
				if (file_id) {
					items["idcore-"+file_id] = {"download-key" : idcore_read_cookie("idcore-file-"+file_id), "label" : jQuery(this).attr("data-label"), "label-processing" : jQuery(this).attr("data-label-processing"), "label-download" : jQuery(this).attr("data-label-download")};
				}
			});
			
			jQuery('head').append("<style>#idcore-ready{display:none;width:0px;height:0px;}</style>");
			jQuery('body').append("<div id='idcore-ready'></div>");
			jQuery.ajax({
				url		: 	idcore_vars['ajax-url'],
				data	: 	{"action" : "idcore-remote-init", "buttons" : idcore_encode64(JSON.stringify(items)), "hostname" : window.location.hostname},
				method	:	(idcore_vars["mode"] == "remote" ? "get" : "post"),
				dataType:	(idcore_vars["mode"] == "remote" ? "jsonp" : "json"),
				async	:	true,
				success	: 	function(return_data) {
					try {
						var data;
						if (typeof return_data == 'object') data = return_data;
						else data = jQuery.parseJSON(return_data);
						if (data.status == "OK") {
							if (data.hasOwnProperty("css") && data["css"].length > 0) {
								for (var i=0; i<data["css"].length; i++) {
									jQuery('head').append("<link href='"+data["css"][i]+"' rel='stylesheet' type='text/css' media='all' />");
								}
							}
							if (data.hasOwnProperty("js") && data["js"].length > 0) {
								for (var i=0; i<data["js"].length; i++) {
									jQuery('body').append("<script src='"+data["js"][i]+"' type='text/javascript'></script>");
								}
							}
							jQuery('head').append(data.button_style);
							var buttons = data.buttons;
							jQuery("div.idcore-button").each(function() {
								var file_id = jQuery(this).attr("data-id");
								if (file_id) {
									if (buttons.hasOwnProperty("idcore-"+file_id)) {
										jQuery(this).html(buttons["idcore-"+file_id]);
									}
								}
							});
							var counter = 50;
							var ready = function() {
								counter--;
								if (counter == 0) {
									console.log("Can't load style.css.");
									return;
								}
								var width = jQuery("#idcore-ready").width();
								if (width == 1) {
									idcore_ready();
								} else {
									setTimeout(ready, 200);
								}
							}
							ready();
						}
					} catch(error) {
						console.log(error);
					}
				},
				error	: 	function(XMLHttpRequest, textStatus, errorThrown) {
					console.log(errorThrown);
				}
			});
		}
	});
} else {
	alert('idcore.js requires jQuery to be loaded. Please include jQuery library above idcore.js. Do not use "defer" or "async" option to load jQuery.');
}

function idcore_ready() {
	idcore_resize();
	jQuery(window).resize(function() {
		idcore_resize();
	});
	var processed_buttons = new Array();
	jQuery("a.idcore-button").each(function(){
		var id = jQuery(this).attr("data-id");
		if (processed_buttons.indexOf(id) < 0) processed_buttons.push(id);
	});
	jQuery("a").each(function() {
		var file_id = jQuery(this).attr("href");
		if (file_id) {
			var prefix = "#idcorex-";
			var idx = file_id.indexOf(prefix);
			if (idx >= 0) {
				file_id = file_id.substr(idx+prefix.length);
				if (processed_buttons.indexOf(file_id) < 0) processed_buttons.push(file_id);
				jQuery(this).addClass("idcore-link-"+file_id);
				jQuery(this).on("click", function(e) {
					var file_id = jQuery(this).attr("href");
					var prefix = "#idcorex-";
					var idx = file_id.indexOf(prefix);
					if (idx >= 0) {
						e.preventDefault();
						file_id = file_id.substr(idx+prefix.length);
						idcore_link_handler(this, file_id);
					}
				});
			}
		}
	});
	if (processed_buttons.length > 0) {
		jQuery.ajax({
			url		: 	idcore_vars['ajax-url'],
			data	: 	{"action" : "idcore-front-add-impression", "file-ids" : processed_buttons.join(","), "hostname" : window.location.hostname},
			method	:	(idcore_vars["mode"] == "remote" ? "get" : "post"),
			dataType:	(idcore_vars["mode"] == "remote" ? "jsonp" : "json"),
			async	:	true,
			success	: function(return_data) {
				try {
					var data;
					if (typeof return_data == 'object') data = return_data;
					else data = jQuery.parseJSON(return_data);
					if (data.status == "OK") {
					}
				} catch(error) {
					console.log(error);
				}
			},
			error	: 	function(XMLHttpRequest, textStatus, errorThrown) {
				console.log(errorThrown);
			}
		});
	}
	var file_id = window.location.hash;
	var handled = false;
	var prefix = "#idcorex-";
	var idx = file_id.indexOf(prefix);
	if (idx >= 0) {
		file_id = file_id.substr(idx+prefix.length);
		if (file_id.length > 0) {
			idcore_link_handler(null, file_id);
			handled = true;
		}
	}
	if (!handled) {
    var url_params = {};
		window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
			url_params[key] = value;
		});
		var download_key = "";
		if (url_params.hasOwnProperty("idcore-download")) download_key = url_params["idcore-download"];
		if (download_key != "") idcore_wait_confirmation(download_key);
	}
	
	console.log("Green Downloads is ready to go!");
}

function idcore_resize() {
	jQuery("a.idcore-button").each(function(){
		var collapse_width = parseInt(jQuery(this).attr("data-collapse"), 10);
		var container_width = jQuery(this).parent().width();
		if (container_width <= collapse_width) jQuery(this).addClass("idcore-collapsed");
		else jQuery(this).removeClass("idcore-collapsed");
	});
}

function idcore_link_handler(_link, _file_id) {
	if (idcore_busy) return false;
	var paid = jQuery(_link).attr("data-paid");
	if (paid == "yes") return true;
	var disabled = jQuery(_link).attr("data-disabled");
	if (disabled == "yes") return false;
	idcore_busy = true;
	var cookie_value = idcore_read_cookie("idcore-file-"+_file_id);
	if (!cookie_value) cookie_value = "";
	var original_label = jQuery(_link).html();
	var link_width = Math.max(jQuery(_link).width(), 60);
	var link_height = Math.max(jQuery(_link).height(), 16);
	jQuery(_link).html("<span class='idcore-link-loader' style='width:"+link_width+"px;height:"+link_height+"px;line-height:"+link_height+"px;'><span><span>•</span><span>•</span><span>•</span><span>•</span></span></span>");
	var post_data = {
		"id":			idcore_encode64(_file_id),
		"cookie-value":	idcore_encode64(cookie_value),
		"action":		"idcore-pay",
		"hostname": 	window.location.hostname
	};
	jQuery.ajax({
		url		:	idcore_vars["ajax-url"], 
		data	:	post_data,
		method	:	(idcore_vars["mode"] == "remote" ? "get" : "post"),
		dataType:	(idcore_vars["mode"] == "remote" ? "jsonp" : "json"),
		async	:	true,
		success	:	function(data) {
			if (data.status == "OK") {
				try {
					var error = false;
					if (data.hasOwnProperty("action")) {
						if (data["action"] == "function") {
							if (data.hasOwnProperty("provider")) {
								var params = {};
								if (data.hasOwnProperty("params")) params = data["params"];
								if (typeof idcore_pay_ok == 'function') { 
									idcore_pay_ok(data["provider"], params);
								} else error = true;
							} else error = true;
						} else if (data["action"] == "form") {
							if (data.hasOwnProperty("params") && (data["params"]).hasOwnProperty("form")) {
								jQuery("body").append(data["params"]["form"]);
								jQuery(".idcore-form-pay").click();
							}
						} else if (data["action"] == "redirect") {
							if (data.hasOwnProperty("params") && (data["params"]).hasOwnProperty("url")) {
								location.href = data["params"]["url"];
							}
						} else error = true;
					} else error = true;
					if (error) {
						jQuery(_link).html(original_label);
						console.log(data);
					}
				} catch(error) {
					jQuery(_link).html(original_label);
					console.log(error);
				}
			} else if (data.status == "PAID") {
				jQuery(_link).html(original_label);
				jQuery(_link).attr("data-paid", "yes");
				jQuery(_link).attr("href", data.url);
				window.location.href = data.url;
			} else if (data.status == "ERROR") {
				jQuery(_link).html(data.short);
			} else {
				jQuery(_link).html("Transaction Error");
			}
			idcore_busy = false;
		},
		error	:	function(XMLHttpRequest, textStatus, errorThrown) {
			jQuery(_link).html("Transaction Error");
			idcore_busy = false;
		}
	});
	return false;
}

function idcore_pay(_button) {
	if (idcore_busy) return false;
	var disabled = jQuery(_button).attr("data-disabled");
	var file_id = jQuery(_button).attr("data-id");
	var paid = jQuery(_button).attr("data-paid");
	var label = jQuery(_button).html();
	if (paid == "yes") return true;
	else if (disabled != "yes") {
		idcore_busy = true;
		var cookie_value = idcore_read_cookie("idcore-file-"+file_id);
		if (!cookie_value) cookie_value = "";
		jQuery(".idcore-file-"+file_id).removeClass("hint--bottom hint--always");
		jQuery(".idcore-file-"+file_id).removeAttr("data-hint");
		jQuery(".idcore-file-"+file_id).attr("data-disabled", "yes");
		jQuery(".idcore-file-"+file_id).addClass("idcore-button-animate");
		jQuery(".idcore-file-"+file_id).html(jQuery(_button).attr("data-label-processing"));
		var post_data = {
			"id":			idcore_encode64(file_id),
			"cookie-value":	idcore_encode64(cookie_value),
			"action":		"idcore-pay",
			"hostname": 	window.location.hostname
		};
		jQuery.ajax({
			url		:	idcore_vars["ajax-url"], 
			data	:	post_data,
			method	:	(idcore_vars["mode"] == "remote" ? "get" : "post"),
			dataType:	(idcore_vars["mode"] == "remote" ? "jsonp" : "json"),
			async	:	true,
			success	:	function(data) {
				if (data.status == "OK") {
					try {
						var error = false;
						if (data.hasOwnProperty("action")) {
							if (data["action"] == "function") {
								if (data.hasOwnProperty("provider")) {
									var params = {};
									if (data.hasOwnProperty("params")) params = data["params"];
									if (typeof idcore_pay_ok == 'function') { 
										idcore_pay_ok(data["provider"], params);
									} else error = true;
								} else error = true;
							} else if (data["action"] == "form") {
								if (data.hasOwnProperty("params") && (data["params"]).hasOwnProperty("form")) {
									jQuery("body").append(data["params"]["form"]);
									jQuery(".idcore-form-pay").click();
								}
							} else if (data["action"] == "redirect") {
								if (data.hasOwnProperty("params") && (data["params"]).hasOwnProperty("url")) {
									location.href = data["params"]["url"];
								}
							} else error = true;
						} else error = true;
						if (error) {
							console.log(data);
						}
					} catch(error) {
						console.log(error);
					}
				} else if (data.status == "PAID") {
					jQuery(".idcore-file-"+file_id).removeClass("idcore-button-animate");
					jQuery(".idcore-file-"+file_id).removeAttr("data-disabled");
					jQuery(".idcore-file-"+file_id).html(jQuery(_button).attr("data-label-download"));
					jQuery(".idcore-file-"+file_id).attr("data-paid", "yes");
					jQuery(".idcore-file-"+file_id).attr("href", data.url);
					window.location.href = data.url;
				} else if (data.status == "ERROR") {
					jQuery(".idcore-file-"+file_id).removeClass("idcore-button-animate");
					jQuery(".idcore-file-"+file_id).removeAttr("data-disabled");
					jQuery(".idcore-file-"+file_id).html(data.short);
					jQuery(".idcore-file-"+file_id).attr("title", data.long);
					jQuery(".idcore-file-"+file_id).attr("data-hint", data.long);
					jQuery(".idcore-file-"+file_id).addClass("hint--bottom hint--always");
				} else {
					jQuery(".idcore-file-"+file_id).removeClass("idcore-button-animate");
					jQuery(".idcore-file-"+file_id).removeAttr("data-disabled");
					jQuery(".idcore-file-"+file_id).html("Transaction Error");
					jQuery(".idcore-file-"+file_id).attr("title", "Transaction Error");
					jQuery(".idcore-file-"+file_id).attr("data-hint", data.long);
					jQuery(".idcore-file-"+file_id).addClass("hint--bottom hint--always");
				}
				idcore_busy = false;
			},
			error	:	function(XMLHttpRequest, textStatus, errorThrown) {
				jQuery(".idcore-file-"+file_id).removeClass("idcore-button-animate");
				jQuery(".idcore-file-"+file_id).removeAttr("data-disabled");
				jQuery(".idcore-file-"+file_id).html(jQuery(_button).attr("data-label"));
				jQuery(".idcore-file-"+file_id).attr("title", "Transaction Error");
				idcore_busy = false;
			}
		});
	}
	return false;
}
function idcore_wait_confirmation(_download_key) {
	if (_download_key == "") return;
	var post_data = {
		"download-key":	idcore_encode64(_download_key),
		"action":		"idcore-wait-confirmation"
	};
	if (!idcore_vars.hasOwnProperty("ajax-url") && typeof idcore_ajax_url != typeof undefined) {
		idcore_vars["mode"] = "local";
		idcore_vars["ajax-url"] = idcore_ajax_url;
	}
	jQuery.ajax({
		url		:	idcore_vars["ajax-url"], 
		data	:	post_data,
		method	:	(idcore_vars["mode"] == "remote" ? "get" : "post"),
		dataType:	(idcore_vars["mode"] == "remote" ? "jsonp" : "json"),
		async	:	true,
		success	:	function(data) {
			if (data.status == "PAID") {
				jQuery(".idcore-file-"+data.file_id).each(function(){
					jQuery(this).removeClass("idcore-button-animate");
					jQuery(this).removeAttr("data-disabled");
					jQuery(this).attr("data-paid", "yes");
					jQuery(this).html(jQuery(this).attr("data-label-download"));
					jQuery(this).attr("href", data.url);
				});
				jQuery(".idcore-link-"+data.file_id).each(function(){
					jQuery(this).removeAttr("data-disabled");
					jQuery(this).attr("data-paid", "yes");
					jQuery(this).attr("href", data.url);
				});
				idcore_write_cookie("idcore-file-"+data.file_id, data.cookie_value, 90);
				window.location.href = data.url;
			} else if (data.status == "WAIT") {
				jQuery(".idcore-file-"+data.file_id).each(function(){
					jQuery(this).attr("data-disabled", "yes");
					jQuery(this).addClass("idcore-button-animate");
					jQuery(this).html(jQuery(this).attr("data-label-processing"));
				});
				jQuery(".idcore-link-"+data.file_id).each(function(){
					jQuery(this).attr("data-disabled", "yes");
				});
				idcore_waiting_timer--;
				if (idcore_waiting_timer > 0) {
					setTimeout(function(){
						idcore_wait_confirmation(_download_key);
					}, 1000);
				} else {
					jQuery(".idcore-file-"+data.file_id).each(function(){
						jQuery(this).removeAttr("data-disabled");
						jQuery(this).removeClass("idcore-button-animate");
						jQuery(this).html(jQuery(this).attr("data-label"));
					});
					jQuery(".idcore-link-"+data.file_id).each(function(){
						jQuery(this).removeAttr("data-disabled");
					});
					alert("Can not get confirmation from Payment Provider.");
				}
			} else {
				console.log(data);
			}
		},
		error	:	function(XMLHttpRequest, textStatus, errorThrown) {
			console.log(XMLHttpRequest);
		}
	});
}
function idcore_update(_button_id) {
	var file_id = jQuery(".idcore-button-"+_button_id).attr("data-id").toString();
	var cookie_value = idcore_read_cookie("idcore-file-"+file_id);
	if (!cookie_value) cookie_value = "";
	var post_data = {
		"id":			idcore_encode64(file_id),
		"cookie-value":	idcore_encode64(cookie_value),
		"action":		"idcore-update"
	};
	if (!idcore_vars.hasOwnProperty("ajax-url") && typeof idcore_ajax_url != typeof undefined) {
		idcore_vars["mode"] = "local";
		idcore_vars["ajax-url"] = idcore_ajax_url;
	}
	jQuery.ajax({
		url		:	idcore_vars["ajax-url"], 
		data	:	post_data,
		method	:	(idcore_vars["mode"] == "remote" ? "get" : "post"),
		dataType:	(idcore_vars["mode"] == "remote" ? "jsonp" : "json"),
		async	:	true,
		success	:	function(data) {
			if (data.status == "PAID") {
				jQuery(".idcore-button-"+_button_id).removeClass("idcore-button-animate");
				jQuery(".idcore-button-"+_button_id).html(jQuery(".idcore-button-"+_button_id).attr("data-label-download"));
				jQuery(".idcore-button-"+_button_id).attr("href", data.url);
				jQuery(".idcore-button-"+_button_id).attr("data-paid", "yes");
				jQuery(".idcore-button-"+_button_id).removeAttr("data-disabled");
			}
		},
		error	:	function(XMLHttpRequest, textStatus, errorThrown) {
			console.log(XMLHttpRequest);
		}
	});
}

function idcore_read_cookie(key) {
	var pairs = document.cookie.split("; ");
	for (var i = 0, pair; pair = pairs[i] && pairs[i].split("="); i++) {
		if (pair[0] === key) return pair[1] || "";
	}
	return null;
}
function idcore_write_cookie(key, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	} else var expires = "";
	document.cookie = key+"="+value+expires+"; path=/";
}
function idcore_utf8encode(string) {
	string = string.replace(/\x0d\x0a/g, "\x0a");
	var output = "";
	for (var n = 0; n < string.length; n++) {
		var c = string.charCodeAt(n);
		if (c < 128) {
			output += String.fromCharCode(c);
		} else if ((c > 127) && (c < 2048)) {
			output += String.fromCharCode((c >> 6) | 192);
			output += String.fromCharCode((c & 63) | 128);
		} else {
			output += String.fromCharCode((c >> 12) | 224);
			output += String.fromCharCode(((c >> 6) & 63) | 128);
			output += String.fromCharCode((c & 63) | 128);
		}
	}
	return output;
}
function idcore_encode64(input) {
	var keyString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;
	input = idcore_utf8encode(input);
	while (i < input.length) {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}
		output = output + keyString.charAt(enc1) + keyString.charAt(enc2) + keyString.charAt(enc3) + keyString.charAt(enc4);
	}
	return output;
}
function idcore_utf8decode(input) {
	var string = "";
	var i = 0;
	var c = c1 = c2 = 0;
	while ( i < input.length ) {
		c = input.charCodeAt(i);
		if (c < 128) {
			string += String.fromCharCode(c);
			i++;
		} else if ((c > 191) && (c < 224)) {
			c2 = input.charCodeAt(i+1);
			string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
			i += 2;
		} else {
			c2 = input.charCodeAt(i+1);
			c3 = input.charCodeAt(i+2);
			string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
			i += 3;
		}
	}
	return string;
}
function idcore_decode64(input) {
	var keyString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
	while (i < input.length) {
		enc1 = keyString.indexOf(input.charAt(i++));
		enc2 = keyString.indexOf(input.charAt(i++));
		enc3 = keyString.indexOf(input.charAt(i++));
		enc4 = keyString.indexOf(input.charAt(i++));
		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;
		output = output + String.fromCharCode(chr1);
		if (enc3 != 64) {
			output = output + String.fromCharCode(chr2);
		}
		if (enc4 != 64) {
			output = output + String.fromCharCode(chr3);
		}
	}
	output = idcore_utf8decode(output);
	return output;
}