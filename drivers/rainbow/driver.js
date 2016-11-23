const Driver = require('../driver');
const driver = new Driver({
	SERIAL_NR: 'BTL200',
	SERVICE_CONTROL: 'ff01',
});
module.exports = Object.assign(
	{},
	driver.getExports(),
	{ init: (devices, callback) => driver.init(module.exports, devices, callback) }
);
