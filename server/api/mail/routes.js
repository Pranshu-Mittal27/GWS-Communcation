const express = require("express");
const router = express.Router();
const { retractMailForAllUsers, getMailsAndMessageDetails, getMailsAndMessageDetailsWithPage } = require("../../util");

/*
router.get("/sentMails/1/:senderEmail", async (req, res, next) => {
	try {
		const response = await getMails(req.params.senderEmail, "is:sent");
		res.status(200).send(response);
	} catch (err) {
		next(err);
	}
});

// Example messageIdHeader = 200503292@example.com
router.get("/sentMails/2/:senderEmail/:messageIdHeader", async (req, res, next) => {
	try {
		const response = await getMails(req.params.senderEmail, `Rfc822msgid:<${req.params.messageIdHeader}>`);
		// const response = await retractMailForAllUsers(req.params.mainID);
		res.status(200).send(response);
	} catch (err) {
		next(err);
	}
});

router.get("/sentMails/3/:senderEmail/:recieverEmail", async (req, res, next) => {
	try {
		const response = await getMails(req.params.senderEmail, `from:${req.params.senderEmail} to:${req.params.recieverEmail}`);
		// const response = await retractMailForAllUsers(req.params.mainID);
		res.status(200).send(response);
	} catch (err) {
		next(err);
	}
});

// Example messageId = 18558b97216e6dc2
router.get("/messageDetails/:senderEmail/:messageId", async (req, res, next) => {
	try {
		const response = await getMessageDetails(req.params.senderEmail, req.params.messageId);
		res.status(200).send(response);
	} catch (err) {
		next(err);
	}
});

router.get("/getMailsTrial/:senderEmail", async (req, res, next) => {
	try {
		const response = await getMailsTrial(req.params.senderEmail, "is:sent");
		res.status(200).send(response);
	} catch (err) {
		next(err);
	}
});

router.get("/getMailsTrialWithPage/:senderEmail/:pageToken", async (req, res, next) => {
	try {
		const response = await getMailsTrialWithPage(req.params.senderEmail, "is:sent", req.params.pageToken);
		res.status(200).send(response);
	} catch (err) {
		next(err);
	}
});

router.get("/getMailsAndMessageDetails/:senderEmail/:query", async (req, res, next) => {
	try {
		const { senderEmail, query } = req.params;
		console.log("para", req.params);
		const response = await getMailsAndMessageDetails(senderEmail, query);
		res.status(200).send(response);
	} catch (err) {
		next(err);
	}
});

router.get("/getMailsAndMessageDetails/:senderEmail/:query/:pageToken", async (req, res, next) => {
	try {
		const { senderEmail, query, pageToken } = req.params;
		const response = await getMailsAndMessageDetailsWithPage(senderEmail, query, pageToken);
		res.status(200).send(response);
	} catch (err) {
		next(err);
	}
});
*/

router.delete("/retractMail", async (req, res, next) => {
	try {
		const { senderMail, messageId } = req.body;
		console.log("senderMail", senderMail);
		const response = await retractMailForAllUsers(senderMail, messageId);
		res.status(200).send(response);
	} catch (err) {
		next(err);
	}
});

router.post("/getMails", async (req, res, next) => {
	try {
		console.log("body", req.body);
		const filters = req.body.filters;
		const email = req.body.email;
		const nextPageToken = req.body?.nextPageToken;
		let query = "in:sent ";
		for (const filter in filters) {
			if (filters[filter] === "") continue;
			if (["to", "from", "subject"].includes(filter)) {
				query += filter + ":(" + filters[filter] + ") ";
			} else if (["before", "after"].includes(filter)) {
				query += filter + ":" + filters[filter] + " ";
			} else if (filter === "omitWords") {
				query += "-{" + filters[filter] + "} ";
			} else if (filter === "attachment" && filters[filter] === true) {
				query += "has:attachment ";
			} else if (filter === "hasWords") {
				// words to be searched for
				query += filters[filter] + " ";
			}
		}
		const response = nextPageToken
			? await getMailsAndMessageDetailsWithPage(email, query, nextPageToken)
			: await getMailsAndMessageDetails(email, query);
		res.send(response);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
