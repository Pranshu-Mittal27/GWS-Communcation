const { google } = require("googleapis");

const getAuthToken = (email, privateKey, scopes, adminAcc) => {
	const authToken = new google.auth.JWT(
		email,
		null,
		"key",
		scopes,
		adminAcc
	);

	return authToken;
};

module.exports = {
	getAuthToken
};