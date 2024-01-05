const express = require("express");
const router = express.Router();
const { calendarInsertContacts, getAllDomains } = require("../../util");

router.post("/insertContacts", async (req, res, next) => {
	try {
		const domains = await getAllDomains();
		calendarInsertContacts(domains);
		res.send("Process sucessfully initiated.");
	} catch (err) {
		next(err);
	}
});

module.exports = router;
