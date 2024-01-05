const { getAuth } = require("firebase-admin/auth");

const checkAuth = async (req, res, next) => {
	try {
		if (req.url === "/progress/getProgress" || req.url === "/autoSync") { return next(); }
		const idToken = req.get("Authorization") || "";
		const decodedToken = await getAuth().verifyIdToken(idToken);
		console.log("email", decodedToken.email);
		next();
	} catch (err) {
		console.log("error", err);
		res.status(401).send("Unauthorized");
	}
};

module.exports = { checkAuth };
