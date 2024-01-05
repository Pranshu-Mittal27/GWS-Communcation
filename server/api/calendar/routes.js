const express = require("express");
const { z } = require("zod");
const router = express.Router();
const {
	calendarInsertResourcesACL,
	calendarInsertUsersACL,
	insertACLRulesForUser,
	insertContactsForUser,
	getAllDomains,
	getDomainFromEmail,
	getParentDomainList
	// insertACLRulesResourcesForUser
} = require("../../util");
const { removeContact } = require("../../util/contact");

router.post("/insertACLForAll", async (req, res, next) => {
	try {
		const domains = await getAllDomains();
		//   res.send('Hello World!');
		// Fetch all users from domains and insert into other domains' calendar
		calendarInsertUsersACL(domains);
		// Fetch all resources from domains and insert into other domains' calendar
		calendarInsertResourcesACL(domains);
		res.send("Process sucessfully initiated.");
	} catch (err) {
		next(err);
	}
});

router.get("/removeACLRule/:domain/:userEmail", (req, res, next) => {
	const { domain, userEmail } = req.params;

	const paramsSchema = {
		domain: z.string(),
		userEmail: z.string().email()
	};

	if (!paramsSchema.domain.safeParse(domain).success) {
		res.status(400).status({
			message: "Bad Request, valid domain required"
		});
		return;
	}

	if (!paramsSchema.userEmail.safeParse(userEmail).success) {
		res.status(400).status({
			message: "Bad Request, valid userEmail required"
		});
		return;
	}

	try {
		removeContact({
			primaryEmail: userEmail
		}, domain);
		res.send("successful");
	} catch (error) {
		next(error);
	}
});

/*
Req body Structure:
{
	"userEmail": "example@email.com",
	"contactList": [
		"domain1"
	],
	"calendarList": [
		"domain1",
		"domain2"
	]
}
*/
router.post("/syncUserWithDomains", async (req, res, next) => {
	const { userEmail: email, contactList, calendarList, insert: flag } = req.body;
	const paramsSchema = {
		userEmail: z.string().email()
	};

	if (!paramsSchema.userEmail.safeParse(email).success) {
		res.status(400).status({
			message: "Bad Request, valid userEmail required"
		});
		return;
	}

	try {
		// Read all domains from database
		// TODO Database: Make a query to extract admin account of current domain
		const domains = await getAllDomains();
		const domainName = getDomainFromEmail(email);
		const adminAcc = domains.filter(value => value.domain === domainName)[0].email;

		const parentCalendarList = await getParentDomainList(calendarList, domains);
		if (parentCalendarList && parentCalendarList.length > 0) {
			insertACLRulesForUser(adminAcc, email, parentCalendarList, flag);
		}
		if (contactList && contactList.length > 0) {
			const domainArr = domains.filter((value) => contactList.indexOf(value.domain) >= 0);
			insertContactsForUser(adminAcc, email, domainArr, flag);
		}

		res.send("Process sucessfully initiated.");
	} catch (err) {
		next(err);
	}
});

module.exports = router;
