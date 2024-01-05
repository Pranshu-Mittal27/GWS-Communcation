const logger = (req, res, next) => {
	res.on("finish", function () {
		console.log(`[log]: ${req.method} --- ${decodeURI(req.url)} --- ${res.statusCode} ${res.statusMessage}`);
	});
	next();
};

module.exports = { logger };
