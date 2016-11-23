const Driver = require('../driver');
const driver = new Driver({
	SERIAL_NR: 'BTL301W',
	SERVICE_CONTROL: 'ff08',
});
module.exports = Object.assign(
	{},
	driver.getExports(),
	{ init: (devices, callback) => driver.init(module.exports, devices, callback) }
);
