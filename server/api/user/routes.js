/* eslint-disable no-unused-vars */
const express = require("express");
const { z } = require("zod");
const { config } = require("../../config");
const { Datastore } = require("@google-cloud/datastore");
const { google } = require("googleapis");

const datastore = new Datastore({
	projectId: config.GCLOUD_PROJECT,
	keyFilename: config.keyFile
});

const router = express.Router();
const {
	searchUsers,
	getUserData,
	getUserSyncStatus,
	getUserDriveAutoMoveStatus,
	getAllDomains,
	getDomainSyncStatus,
	createUserSync,
	getUserSyncData,
	updateUserSyncStatus,
	isDelegationEnabled,
	getAllUserTypeCount,
	getDomainFromEmail,
	getAllUserDisabled,
	createUser,
	isBucketPermissionAdded,
	getDomainUpdationArrayOfWorkspace
} = require("../../util");

router.get("/searchUsers/:email/:query", async (req, res, next) => {
	const { email, query } = req.params;

	const paramsSchema = {
		email: z.string().email(),
		query: z.string()
	};

	if (!paramsSchema.email.safeParse(email).success) {
		res.status(400).status({
			message: "Bad Request, valid email required"
		});
		return;
	}

	if (!paramsSchema.query.safeParse(query).success) {
		res.status(400).status({
			message: "Bad Request, valid query required"
		});
		return;
	}

	try {
		const domainArr = await getAllDomains();
		// const users = [];
		const users = await Promise.all(domainArr.map(val => {
			return searchUsers(val.email, req.params.query, val.domain);
		}));

		// const users = await searchUsers(req.params.email, req.params.query);
		res.send(users.flat());
	} catch (err) {
		next(err);
	}
});

router.get("/getUserSyncStatus/:email", async (req, res, next) => {
	const { email } = req.params;

	const emailSchema = z.string().email();

	if (!emailSchema.safeParse(email).success) {
		res.status(400).status({
			message: "Bad Request, valid email required"
		});
		return;
	}

	try {
		const domain = getDomainFromEmail(email);
		const [
			userDataTemp,
			domainSyncStatus,
			domainList,
			userSyncData
		] = await Promise.all([
			getUserData(email),
			getDomainSyncStatus(domain),
			getAllDomains(),
			getUserSyncData(email)
		]);
		let userData = userDataTemp;

		// If user does not exist in datastore, create it
		if (userDataTemp === undefined) {
			userData = await createUser(email);
		}
		// If userSync does not exist for user in datastore, create it
		if (userSyncData === undefined) {
			await createUserSync(email);
		}

		const parentDomain = domainList.filter((userObj) => domain === userObj.domain);
		// console.log("parentDomain", parentDomain);
		let output = domainList
			.filter((userObj) => {
				return (domain !== userObj.domain && parentDomain[0].parentDomain !== userObj.parentDomain);
			})
			.map((userObj) => {
				// get domain name from the email
				const domain = userObj.domain;
				// get the status of both the calendar and contact
				// const domainStatus = domainSyncStatus?.syncStatus?.find(item => item?.domainName === domain);
				// const syncStatus = userSyncStatus?.find(item => item?.domainName === domain);

				const domainStatus = domainSyncStatus?.syncStatus?.find(item => item?.domainName === domain);
				const syncStatus = userSyncData?.syncStatus?.find(item => item?.domainName === domain);

				const isCalendar =
					domainStatus?.calendar !== undefined
						? syncStatus?.calendar !== undefined
							? (
								domainStatus.calendar.substring(1) >= syncStatus.calendar.substring(1)
									? domainStatus.calendar[0] === "+"
									: syncStatus.calendar[0] === "+"
							)
							: (
								domainStatus.calendar.substring(1) >= userData.creationTime
									? domainStatus.calendar[0] === "+"
									: false
							)
						: syncStatus?.calendar !== undefined
							? syncStatus.calendar[0] === "+"
							: false;

				const isContact =
					domainStatus?.contact !== undefined
						? syncStatus?.contact !== undefined
							? (
								domainStatus.contact.substring(1) >= syncStatus.contact.substring(1)
									? domainStatus.contact[0] === "+"
									: syncStatus.contact[0] === "+"
							)
							: (
								domainStatus.contact.substring(1) >= userData.creationTime
									? domainStatus.contact[0] === "+"
									: false
							)
						: syncStatus?.contact !== undefined
							? syncStatus.contact[0] === "+"
							: false;

				return {
					calendarStatus: isCalendar,
					contactStatus: isContact,
					name: domain,
					description: userObj.email
				};
			});

		// get driveAutoMove status
		// console.log("domainSyncStatus", domainSyncStatus);
		let isDriveAutoMove;
		if (domainSyncStatus.driveAutoMove.value === false) { isDriveAutoMove = false; } else {
			if (userSyncData === undefined) { isDriveAutoMove = true; } else if (domainSyncStatus.driveAutoMove.timeStamp < userSyncData.driveAutoMove.timeStamp) { isDriveAutoMove = userSyncData.driveAutoMove.value; } else { isDriveAutoMove = true; }
		}

		output = {
			driveAutoMove: isDriveAutoMove,
			domainDriveAutoMove: domainSyncStatus.driveAutoMove.value,
			output
		};
		res.send(output);
	} catch (err) {
		next(err);
	}
});

router.put("/updateUserSyncStatus", async (req, res, next) => {
	const { email, prefix } = req.body;
	const emailSchema = z.string().email();

	if (!emailSchema.safeParse(email).success) {
		res.status(400).status({
			message: "Bad Request, valid email required"
		});
		return;
	}

	try {
		let newSyncStatus = [];
		if (req.body?.syncStatus !== undefined) {
			const object = req.body.syncStatus;
			const date = new Date().toISOString();
			const domains = await getAllDomains();
			const contactUpdationArray = await getDomainUpdationArrayOfWorkspace(object.contactList, true, domains, prefix, date);
			const calendarUpdationArray = await getDomainUpdationArrayOfWorkspace(object.calendarList, false, domains, prefix, date);

			const map = new Map();
			contactUpdationArray.forEach(item => map.set(item.domainName, item));
			calendarUpdationArray.forEach(item => map.set(item.domainName, { ...map.get(item.domainName), ...item }));

			newSyncStatus = Array.from(map.values());

			// console.log("newSyncStatus", newSyncStatus);
		}

		const userSyncData = await getUserSyncData(email);
		const syncStatus = req.body?.syncStatus === undefined ? userSyncData?.syncStatus : newSyncStatus;
		const driveAutoMove = req.body?.driveAutoMove === undefined ? userSyncData?.driveAutoMove : { value: req.body.driveAutoMove, timeStamp: new Date().toISOString() };

		if ((syncStatus === undefined || syncStatus === []) && (driveAutoMove === undefined)) {
			res.status(400).status({
				message: "syncStatus and driveAutoMove both cannot be empty"
			});
			return;
		}

		const result = await updateUserSyncStatus(email, syncStatus, driveAutoMove);
		res.status(200).send(result);
	} catch (err) {
		next(err);
	}
});

// ─── Verify User ────────────────────────────────────────────────────
router.post("/verifyUser/:emailId/:domainName", async (req, res, next) => {
	// console.log("Inside");
	const { emailId, domainName } = req.params;

	const emailSchema = z.string().email();

	if (!emailSchema.safeParse(emailId).success) {
		res.status(400).status({
			message: "Bad Request, valid email required"
		});
		return;
	}

	try {
		// Check if delegation is enabled
		const hasDelegation = await isDelegationEnabled(emailId, domainName);
		if (hasDelegation === true) {
			res.status(200).send("Verification Successful");
		} else {
			console.log(hasDelegation);
			next(hasDelegation);
		}
	} catch (err) {
		next(err);
	}
});

// Verify Bucket Confirmation
router.post("/verifyBucketPermission/:emailId/:domainName", async (req, res, next) => {
	const { emailId, domainName } = req.params;

	const emailSchema = z.string().email();

	if (!emailSchema.safeParse(emailId).success) {
		res.status(400).status({
			message: "Bad Request, valid email required"
		});
		return;
	}

	try {
		const hasBucketPermission = await isBucketPermissionAdded(emailId, domainName);

		if (hasBucketPermission === true) {
			console.log("Succes");
			res.status(200).send("Verification Successful");
		} else {
			console.log("err", hasBucketPermission);
			next(hasBucketPermission);
		}
	} catch (err) {
		next(err);
	}
});

router.get("/getAllUserTypeCount", async (req, res, next) => {
	try {
		const output = await getAllUserTypeCount();
		res.status(200).send(output);
	} catch (err) {
		next(err);
	}
});

router.get("/getAllUserDisabled", async (req, res, next) => {
	try {
		const output = await getAllUserDisabled();
		res.status(200).send(output);
	} catch (err) {
		next(err);
	}
});

// TODO replaces route in auth written by Ravi
router.get("/details/:email", async (req, res, next) => {
	const { email } = req.params;

	const emailSchema = z.string().email();

	if (!emailSchema.safeParse(email).success) {
		res.status(400).status({
			message: "Bad Request, valid email required"
		});
		return;
	}

	const key = datastore.key(["User", email]);
	const [user] = await datastore.get(key);
	if (!((user === undefined) || (user === null))) {
		res.status(200).send(user);
	} else {
		// Get user created time
		await createUser(email);
	}
});

module.exports = router;
