const Driver = require('../driver');
const driver = new Driver({
	SERIAL_NR: 'BTL201',
	SERVICE_CONTROL: 'ff06',
});
module.exports = Object.assign(
	{},
	driver.getExports(),
	{ init: (devices, callback) => driver.init(module.exports, devices, callback) }
);
