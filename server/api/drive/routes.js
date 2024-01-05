const express = require("express");
const router = express.Router();
const { moveFilesForUser, moveFilesForAllUsers, getAllDomains } = require("../../util");

router.post("/moveAllFilesToSharedDrive/:email", async (req, res, next) => {
	try {
		const response = await moveFilesForUser(req.params.email);
		res.send(response);
	} catch (err) {
		next(err);
	}
});

router.post("/moveFilesForAllUsers/:domain", async (req, res, next) => {
	try {
		const domainArr = await getAllDomains();
		const adminAcc = domainArr.filter(val => val.domain === req.params.domain)[0].email;
		const response = await moveFilesForAllUsers(req.params.domain, adminAcc);
		res.send(response);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
