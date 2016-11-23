const Driver = require('../driver');
const driver = new Driver({
	SERIAL_NR: 'MESH GARDEN',
	SERVICE_CONTROL: 'fe03',
});
module.exports = Object.assign(
	{},
	driver.getExports(),
	{ init: (devices, callback) => driver.init(module.exports, devices, callback) }
);
