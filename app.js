"use strict";


var self = module.exports = {
	init() {

		console.log('LOADED!!');

		// bleManager.discover(['ffff'], 5000, (err, result) => {
		// 	console.log('DISCOVER RESULT', result.length);
		// 	const playBulb = result.find(peripheral => peripheral.id === '4371c199495d46f593f68b2b017f920d');
		// 	// console.log(result);
		// 	if (playBulb) {
		// 		console.log('PLAYBULB');
		// 		playBulb.connect((err) => {
		// 			console.log('CONNECT', err);
		// 			playBulb.discoverServices((err, services) => {
		// 				console.log('SERVICES', err);
		// 				services.find(service => service.uuid === 'ff06').discoverCharacteristics((err, characteristics) => {
		// 					console.log('CHARACTERISTICS', err);
		// 					characteristics.find(characteristic => characteristic.uuid === 'fffc').write(new Buffer([0x00, 0xFF, 0x33, 0xFF]), (err, result) => {
		// 						console.log('WRITE', err, result)
		// 						setTimeout(() => playBulb.disconnect((err, result) => {
		// 							console.log('DISCONNECT', err, result);
		// 						}), 1000);
		// 					})
		// 				});
		// 			});
		// 		});
		// 	} else {
		// 		console.log('Could not find playbulb');
		// 	}
		// });
		//
		// bleManager.find('4371c199495d46f593f68b2b017f920d', 5000, (err, playBulb) => {
		// 	if (err) {
		// 		return console.log('find error', err);
		// 	}
		// 	setTimeout(() => playBulb.read('ff06', 'fffc', (err, value) => console.log('READ', err, value)), 5000);
		// 	playBulb.write('ff06', 'fffc', new Buffer([0x00, 0x00, 0x00, 0xFF]), (err, result) => {
		// 		if (err) {
		// 			console.log('write error', err);
		// 		}
		// 		// setTimeout(() => playBulb.disconnect(), 500);
		// 	});
		// });
	},
};