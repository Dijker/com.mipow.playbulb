"use strict";

const convert = require('color-convert');
const kelvinToRgb = require('kelvin-to-rgb');

const bleManager = Homey.wireless('ble');
const devices = new Map();
const states = new Map();

const DEVICE_MAP = {
	BTL201: {
		SERVICE_CONTROL: 'ff06',
	},
	BTL300: {
		SERVICE_CONTROL: 'ff02',
	},
};
const SERVICE_CONTROL_SET = new Set(Object.keys(DEVICE_MAP).map(type => DEVICE_MAP[type].SERVICE_CONTROL));


const SERVICE_MANUFACTURER = '180a';

const CHAR_SERIALNR = '2a25';
const CHAR_NAME = 'ffff';
const CHAR_COLOR = 'fffc';
const CHAR_EFFECT = 'fffb';

const effects = {
	'flash': 0x00,
	'pulse': 0x01,
	'rainbow': 0x02,
	'rainbow_fade': 0x03,
	'candle': 0x04,
};

const state2buffer = (state, effect) => {
	if (effect) {
		return new Buffer([
			0x00,
			parseInt(`0x${state.effectColor.slice(0, 2)}`),
			parseInt(`0x${state.effectColor.slice(2, 4)}`),
			parseInt(`0x${state.effectColor.slice(4, 6)}`),
			effects[state.effect],
			0x00,
			(1 - state.effectSpeed) * 0xFF,
			0x00,
		]);
	}
	if (!state.onoff) {
		return new Buffer([0x00, 0x00, 0x00, 0x00]);
	}
	const rgb = state.mode === 'color' ?
		convert.hsv.rgb(state.hue * 360, state.saturation * 50 + 50, state.dim * 100) :
		kelvinToRgb((1 - state.temperature) * 5000 + 1500).map(c => c * state.dim);

	console.log(state.temperature, state.temperature * 4000 + 1500, rgb);
	return new Buffer([0x00, 0xFF / 255 * rgb[0], 0xFF / 255 * rgb[1], 0xFF / 255 * rgb[2]]);
};

var self = module.exports = {
	init(devicesData, callback) {
		console.log('DRIVER LOADED!!', devicesData);
		devicesData.forEach(device => {
			devices.set(device.id, device);
			states.set(device.id, { onoff: 1, hue: 1, saturation: 1, dim: 1, temperature: 0.5, mode: 'color' });

			let running = true;
			let state = true;
			let i = 0;
			const timeouts = [100, 500, 1000, 2000, 6000, 10000];

			function setState() {
				if (running) {
					const date = Date.now();
					console.log('set state', !state, timeouts[i % timeouts.length]);
					return self.capabilities.onoff.set(device, state = !state, () => console.log('DURATION', Date.now() - date) & setTimeout(setState, timeouts[i++ % timeouts.length]));
				} else {
					bleManager.find(device.id, (err, advertisement) => {
						if (err) return console.log('no find', err);
						advertisement.connect((err, peripheral) => {
							if (err) return console.log('no connect', err);
							peripheral.write(DEVICE_MAP[device.deviceId].SERVICE_CONTROL, CHAR_COLOR, new Buffer([0x00, 0x00, 0x00, 0x22]), (err, result) => {
								if (err) return console.log('no write', err);
							});
							setTimeout(() => peripheral.disconnect(), 3000);
						});
					});
				}
			}


			setInterval(() => {
				running = false;
				setTimeout(() => {
					running = true;
					setState();
				}, 5 * 60 * 1000);
			}, 15 * 60 * 1000);
			setState();
		});

		Homey.manager('flow').on('action.flash', function (callback, args) {
			const state = states.get(args.device.id);
			state.effect = 'flash';
			state.effectColor = args.color.slice(1);
			state.effectSpeed = args.speed;
			self.setEffect(args.device, callback);
		});

		Homey.manager('flow').on('action.pulse', function (callback, args) {
			const state = states.get(args.device.id);
			state.effect = 'pulse';
			state.effectColor = args.color.slice(1);
			state.effectSpeed = args.speed;
			self.setEffect(args.device, callback);
		});

		Homey.manager('flow').on('action.candle', function (callback, args) {
			const state = states.get(args.device.id);
			state.effect = 'candle';
			state.effectColor = args.color.slice(1);
			state.effectSpeed = args.speed;
			self.setEffect(args.device, callback);
		});

		Homey.manager('flow').on('action.rainbow', function (callback, args) {
			const state = states.get(args.device.id);
			state.effect = 'rainbow';
			state.effectColor = '000000';
			state.effectSpeed = args.speed;
			self.setEffect(args.device, callback);
		});

		Homey.manager('flow').on('action.rainbow_fade', function (callback, args) {
			const state = states.get(args.device.id);
			state.effect = 'rainbow_fade';
			state.effectColor = '000000';
			state.effectSpeed = args.speed;
			self.setEffect(args.device, callback);
		});

		Homey.manager('flow').on('action.stop_effect', function (callback, args) {
			const state = states.get(args.device.id);
			delete state.effect;
			self.setColor(args.device, callback);
		});


		// bleManager.find('853ea8da881f47eaa61431d4649ba227', (err, advertisement) => {
		// 	advertisement.connect((err, peripheral) => {
		// 		peripheral.updateRssi((err, result) => console.log('RSSI', err, result));
		// 		// peripheral.getService('dcff0001b5743b39a8eae179e8642c4b', (err, service) => {
		// 		// 		service.getCharacteristic('dcff0002b5743b39a8eae179e8642c4b', (err, characteristic) => {
		// 		// 			setTimeout(() => characteristic.write(new Buffer([0xdc, 0xff, 0x00, 0x02, 0xb5, 0x74, 0x3b, 0x39, 0xa8, 0xea, 0xe1, 0x79, 0xe8, 0x64, 0x2c, 0x4b]), (err, response) => {
		// 		// 				console.log('WRITE RESPONSE', err, response);
		// 		// 			}), 1000)
		// 		// 		})
		// 		// });
		// 	});
		// });

		callback();
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

		// let i = 0;
		// const colorArray = [
		// 	new Buffer([0x00, 0x00, 0x00, 0x05]),
		// 	new Buffer([0x00, 0x05, 0x00, 0x00]),
		// 	new Buffer([0x00, 0x00, 0x05, 0x00]),
		// ];
		//
		// setInterval(() => {
		// 	bleManager.find('4371c199495d46f593f68b2b017f920d', 1000, (err, adv) => {
		// 		if (err) {
		// 			return console.log('find error', err);
		// 		}
		// 		adv.connect((err, playBulb) => {
		// 			if (err) {
		// 				return console.log('connect error', err);
		// 			}
		// 			playBulb.discoverServices((err, services) => {
		// 				if(err || !services){
		// 					console.log('could not get services', err, services);
		// 				}
		// 				const lightService = services.find(service => service.uuid === 'ff06');
		// 				if (lightService) {
		// 					console.log('Found service with uuid ff06');
		// 					lightService.discoverCharacteristics((err, characteristics) => {
		// 						if(err || !characteristics){
		// 							console.log('could not get characteristics', err, characteristics);
		// 						}
		// 						const lightChar = characteristics.find(char => char.uuid === 'fffc');
		// 						if (lightChar) {
		// 							console.log('Found characteristic with uuid fffc');
		// 							lightChar.write(colorArray[++i % colorArray.length], (err, result) => {
		// 								console.log('written', err, result);
		// 							});
		// 						}
		// 					})
		// 				}
		// 			});
		// 			// setTimeout(() => playBulb.read('ff06', 'fffc', (err, value) => console.log('READ', err, value)), 500);
		// 			// playBulb.write('ff06', 'fffc', colorArray[(++i % colorArray.length)], (err, result) => {
		// 			// 	if (err) {
		// 			// 		console.log('write error', err);
		// 			// 	}else{
		// 			// 		console.log('write success');
		// 			// 	}
		// 			setTimeout(() => console.log('disconnecting') & playBulb.disconnect(console.log.bind(console, 'disconnected')), 1000);
		// 			// });
		// 		});
		// 	});
		// }, 3000);

	},

	pair(socket)
	{
		socket.on('list_devices', function (data, callback) {
			console.log('LIST DEVICES');
			bleManager.discover([], 5000, (err, advertisements) => {
				console.log('DISCOVER', advertisements.length);

				advertisements = advertisements || [];
				advertisements.filter(advertisement => !devices.has(advertisement.uuid));
				if (advertisements.length === 0) {
					return callback(null, []);
				}
				let failedCount = 0;
				advertisements.forEach(advertisement => {
					console.log('checking advertisement', advertisement.uuid, advertisement.serviceUuids);
					if (advertisement.serviceUuids.some(uuid => SERVICE_CONTROL_SET.has(uuid))) {
						console.log('connecting to', advertisement);
						advertisement.connect((err, peripheral) => {
							if (err) {
								if (++failedCount === advertisements.length) {
									callback(null, []);
								}
								return;
							}
							peripheral.read(SERVICE_MANUFACTURER, CHAR_SERIALNR, (err, serialNumber) => {
								console.log('serialnr', serialNumber);
								const deviceId = Object.keys(DEVICE_MAP).find(id => (serialNumber || '').toString().indexOf(id) === 0);
								if (err || !deviceId) {
									peripheral.disconnect();
									if (++failedCount === advertisements.length) {
										callback(null, []);
									}
									return;
								}
								const deviceData = {
									data: {
										id: peripheral.uuid,
										deviceId,
									},
								};
								peripheral.read(DEVICE_MAP[deviceId].SERVICE_CONTROL, CHAR_NAME, (err, name) => {
									peripheral.disconnect();
									if (err) {
										if (++failedCount === advertisements.length) {
											callback(null, []);
										}
										return;
									}
									deviceData.name = name.toString();
									if (callback) {
										console.log('RETURN CLALBACK', [deviceData]);
										callback(null, [deviceData]);
										callback = null;
									} else {
										socket.emit('list_devices', [deviceData]);
									}
								});
							});
						});
					}
				});
			});
		});


		socket.on('add_device', (newDevice) => {
			devices.set(newDevice.data.id, newDevice.data);
			states.set(newDevice.data.id, { onoff: 1, hue: 1, saturation: 1, dim: 1, temperature: 0.5, mode: 'color' });
		});

		socket.on('disconnect', function () {
			console.log("User aborted pairing, or pairing is finished");
		})
	},

	delete(device)
	{
		devices.delete(device.id);
		states.delete(device.id);
	},

	setEffect(device, callback){
		console.log('start effect', device.id);
		let date = Date.now();
		bleManager.find(device.id, (err, advertisement) => {
			console.log('find', (date - (date = Date.now())) * -1);
			if (err) return callback(err);
			advertisement.connect((err, peripheral) => {
				console.log('connect', (date - (date = Date.now())) * -1);
				if (err) return callback(err);
				peripheral.write(DEVICE_MAP[device.deviceId].SERVICE_CONTROL, CHAR_EFFECT, state2buffer(states.get(device.id), true), (err, result) => {
					console.log('write', (date - (date = Date.now())) * -1);
					callback(err, result);
					setTimeout(() => peripheral.disconnect(), 3000);
				});
			})
		});
	},

	setColor(device, callback){
		console.log('start', device.id);
		let date = Date.now();
		bleManager.find(device.id, (err, advertisement) => {
			console.log('find', (date - (date = Date.now())) * -1);
			if (err) return callback(err);
			advertisement.connect((err, peripheral) => {
				console.log('connect', (date - (date = Date.now())) * -1);
				if (err) return callback(err);
				peripheral.write(DEVICE_MAP[device.deviceId].SERVICE_CONTROL, CHAR_COLOR, state2buffer(states.get(device.id)), (err, result) => {
					console.log('write', (date - (date = Date.now())) * -1);
					callback(err, result);
					setTimeout(() => peripheral.disconnect(), 3000);
				});
			})
		});
	},

	capabilities: {
		onoff: {
			get: (device, callback) => callback(null, Boolean(states.get(device.id).onoff)),
			set: (device, value, callback) => {
				console.log('onoff', value);
				const state = states.get(device.id);
				state.onoff = value;
				self.setColor(device, err => callback(err, value));
			}
		},
		dim: {
			get: (device, callback) => callback(null, states.get(device.id).dim),
			set: (device, value, callback) => {
				console.log('dim', value);
				const state = states.get(device.id);
				state.onoff = true;
				state.dim = value;
				self.setColor(device, err => callback(err, value));
			},
		},
		light_hue: {
			get: (device, callback) => callback(null, states.get(device.id).hue),
			set: (device, value, callback) => {
				console.log('hue', value);
				const state = states.get(device.id);
				state.onoff = true;
				state.hue = value;
				self.setColor(device, err => callback(err, value));
			},
		},
		light_saturation: {
			get: (device, callback) => callback(null, states.get(device.id).saturation),
			set: (device, value, callback) => {
				console.log('saturation', value);
				const state = states.get(device.id);
				state.onoff = true;
				state.saturation = value;
				self.setColor(device, err => callback(err, value));
			},
		},
		light_temperature: {
			get: (device, callback) => callback(null, states.get(device.id).temperature),
			set: (device, value, callback) => {
				console.log('temperature', value);
				const state = states.get(device.id);
				state.onoff = true;
				state.temperature = value;
				self.setColor(device, err => callback(err, value));
			},
		},
		light_mode: {
			get: (device, callback) => callback(null, states.get(device.id).mode),
			set: (device, value, callback) => {
				states.get(device.id).mode = value;
				self.setColor(device, err => callback(err, value));
			},
		},
	},
};