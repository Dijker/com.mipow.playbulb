const Driver = require('../driver');
const driver = new Driver({
	SERIAL_NR: 'BTL300',
	SERVICE_CONTROL: 'ff02',
});
module.exports = Object.assign(
	{},
	driver.getExports(),
	{ init: (devices, callback) => driver.init(module.exports, devices, callback) }
);
