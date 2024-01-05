const { STATUS_CODES } = require("http");
const { config } = require("../../config");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
	// eslint-disable-next-line no-undef
	if (config.NODE_ENV !== "production") {
		// logic for your production
	}
	if (["ValidationError", "UserExistsError"].includes(err.name)) {
		// if a specific error
		return res.status(405).json(err);
	}

	// Error logger
	if (config.NODE_ENV === "development") {
		console.log("[error] API error", { error: err });
	}

	return res
		.status(err.status || 500)
		.send({
			message: err.message || STATUS_CODES[err.status]
		});
};

module.exports = { errorHandler };
