const sse = (req, res, next) => {
	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		"X-Accel-Buffering": "no",
		Connection: "keep-alive",
		"Access-control-allow-origin": "*"
	});
	next();
};

module.exports = { sse };
