/* eslint-disable no-tabs */
const express = require("express");
const { z } = require("zod");

const router = express.Router();
const {
	addDomain,
	searchDomains,
	getAllDomains,
	getDomainSyncStatus,
	updateDomainSyncStatus,
	addDomainSync,
	// getDomainFromEmail,
	getAllDomainsData,
	setLock,
	insertACLRulesForAllUsers,
	// eslint-disable-next-line no-unused-vars
	insertACLRulesForAllResources,
	insertContactsForAllUsers,
	changeAutoSyncStatus,
	reSyncDomain,
	reSyncAllDomains,
	deleteDomainSyncStatus,
	// getUserCount,
	getUserCountFromDatabase,
	getDomainUpdationArrayOfWorkspace,
	getParentDomainList,
	getResourcesDatabseUpdationArray,
	getUniqueResources
	// getNewSuspendedUsers
} = require("../../util");

router.post("/addDomain/:domainName/:emailId/:creator", async (req, res, next) => {
	const { domainName, emailId, creator } = req.params;

	const emailSchema = z.string().email();

	if (!emailSchema.safeParse(emailId).success) {
		res.status(400).status({
			message: "Bad Request, valid emailId required"
		});
		return;
	}

	if (!emailSchema.safeParse(creator).success) {
		res.status(400).status({
			message: "Bad Request, valid creator required"
		});
		return;
	}

	try {
		// const domainName = getDomainFromEmail(emailId);
		const domainArr = await getAllDomains();
		const result = domainArr.find(({ domain }) => domain === domainName);
		if (result !== undefined) {
			res.status(406).send({
				message: "Domain Already Exists!!!"
			});
		} else {
			// add domain and domainSyncRow
			await addDomain(domainName.toLowerCase(), emailId, creator);
			// eslint-disable-next-line no-unused-vars
			const response = await addDomainSync(domainName.toLowerCase());

			res.send("Done");
		}
	} catch (err) {
		next(err);
	}
});

router.get("/searchDomains/:query", async (req, res, next) => {
	const { query } = req.params;

	const querySchema = z.string();

	if (!querySchema.safeParse(query).success) {
		res.status(400).status({
			message: "Bad Request, valid query required"
		});
		return;
	}

	try {
		const domains = await searchDomains(query);
		// console.log("domains: ", domains);
		res.send(domains);
	} catch (err) {
		next(err);
	}
});

router.get("/getDomainSyncStatus/:domain", async (req, res, next) => {
	const { domain: domainName } = req.params;

	const domainSchema = z.string();

	if (!domainSchema.safeParse(domainName).success) {
		res.status(400).status({
			message: "Bad Request, valid domain required"
		});
		return;
	}

	try {
		const [domainSyncStatus, domainList] = await Promise.all([getDomainSyncStatus(domainName), getAllDomains()]);
		const parentDomain = domainList.filter((userObj) => domainName === userObj.domain);
		// console.log("parentDomain", parentDomain);
		let response = domainList
			.filter((userObj) => domainName !== userObj.domain && parentDomain[0].parentDomain !== userObj.parentDomain)
			.map((userObj) => {
				const domain = userObj.domain;
				// get the status of both the calendar and contact
				const syncStatus = domainSyncStatus?.syncStatus?.find(item => item.domainName === domain);
				return {
					calendarStatus: syncStatus?.calendar ? syncStatus.calendar[0] === "+" : false,
					contactStatus: syncStatus?.contact ? syncStatus.contact[0] === "+" : false,
					resourceStatus: syncStatus?.resource ? syncStatus.resource[0] === "+" : false,
					name: domain,
					description: userObj.email
				};
			});

		let isParent = false ;
		if(parentDomain[0].parentDomain === domainName)
		isParent = true	

		response = {
			// isParent : isParent,
			autoSync: domainSyncStatus?.autoSync || false,
			driveAutoMove: domainSyncStatus.driveAutoMove.value,
			response
		};
		res.status(200).send(response);
	} catch (err) {
		next(err);
	}
});

router.post("/syncDomainWithDomains", async (req, res, next) => {
	// console.log("req body: ", req.body);
	const { userEmail: email, contactList, calendarList, resourceList, insert: flag, domain, isAllSubDomainsOn } = req.body;

	const paramsSchema = {
		userEmail: z.string().email()
	};

	if (!paramsSchema.userEmail.safeParse(email).success) {
		res.status(400).send({
			message: "Bad Request, valid userEmail missing"
		});
		return;
	}

	try {
		const domainToBeSynced = domain;
		const date = new Date().toISOString();
		const domains = await getAllDomains();
		const prefix = flag ? "+" : "-";
		const adminAcc = domains.filter(value => value.domain === domainToBeSynced)[0].email;

		const arr1 = calendarList.map((val) => {
			return {
				domainName: val,
				calendar: "processing"
			};
		});
		const arr2 = contactList.map((val) => {
			return {
				domainName: val,
				contact: "processing"
			};
		});
		const arr4 = resourceList.map((val) => {
			return {
				domainName: val,
				resource: "processing"
			};
		});
		const map = new Map();
		arr1.forEach(item => map.set(item.domainName, item));
		arr2.forEach(item => map.set(item.domainName, { ...map.get(item.domainName), ...item }));
		arr4.forEach(item => map.set(item.domainName, { ...map.get(item.domainName), ...item }));
		let arr3 = Array.from(map.values());
		console.log("arr3 : ", arr3)

		// Set lock
		const setLockResponse = await setLock(domainToBeSynced, arr3);
		console.log("setLockResponse", setLockResponse);
		if (setLockResponse === "-1") {
			res.send({
				message: "Already Process Running"
			});
			return;
		} else if (setLockResponse === "1") {
			res.send({
				message: "all entries already processing"
			});
			return;
		}

		// update contact and calendar list with the response from setLock
		calendarList.length = 0;
		contactList.length = 0;
		resourceList.length = 0;
		setLockResponse.map((val) => {
			if (val.calendar) calendarList.push(val.domainName);
			if (val.contact) contactList.push(val.domainName);
			if (val.resource) resourceList.push(val.domainName)
			return val;
		});
		
		const parentCalendarList = await getParentDomainList(calendarList, domains);
		const parentResourceList = await getParentDomainList(resourceList, domains);
		const parentContactList = await getParentDomainList(contactList, domains);

		// // TODO we are not waiting for this processes to finish before proceeding
		// if (parentCalendarList && parentCalendarList.length > 0) {
		// 	// call the processes, and check if a entry exists in the table to avoid any clash
		// 	const domainArr = domains.filter((value) => parentCalendarList.indexOf(value.domain) >= 0);
		// 	insertACLRulesForAllUsers(adminAcc, domainToBeSynced, domainArr, flag);
		// }
		// if (parentContactList && parentContactList.length > 0) {
		// 	const domainArr = domains.filter((value) => parentContactList.indexOf(value.domain) >= 0);
		// 	insertContactsForAllUsers(adminAcc, domainToBeSynced, domainArr, flag);
		// }
		// if(parentResourceList && parentResourceList.length >0) {
		// 	const domainArr = domains.filter((value) => parentResourceList.indexOf(value.domain) >= 0);
		// 	insertACLRulesForAllResources(adminAcc, domainToBeSynced, domainArr, flag);
		// }

		// Get the domains of the same workspace
		let updatedArray3 = [];
		const contactUpdationArray = await getDomainUpdationArrayOfWorkspace(parentContactList, true, false, domains, prefix, date);
		const calendatUpdationArray = await getDomainUpdationArrayOfWorkspace(parentCalendarList, false, false, domains, prefix, date);
		const resourceUpdationArray = await getDomainUpdationArrayOfWorkspace(parentResourceList, false, true, domains, prefix, date);

		const map1 = new Map();

		contactUpdationArray.forEach(item => map1.set(item.domainName, item));
		calendatUpdationArray.forEach(item => map1.set(item.domainName, { ...map1.get(item.domainName), ...item }));
		resourceUpdationArray.forEach(item => map1.set(item.domainName, { ...map1.get(item.domainName), ...item }));
		// Update database
		// update the processing status with the current timestamp

		arr3 = setLockResponse.map((val) => {
			const obj = {
				domainName: val.domainName
			};
			if (val.calendar) obj.calendar = prefix + date;
			if (val.contact) obj.contact = prefix + date;
			if (val.resource) obj.resource = prefix + date;

			if(parentResourceList.indexOf(val.domainName) >=0 || parentCalendarList.indexOf(val.domainName) >=0 || parentContactList.indexOf(val.domainName)  >= 0)
			obj.isPrimary = true
			return obj;
		});
		arr3.forEach(item => map1.set(item.domainName, item));
		updatedArray3 = Array.from(map1.values());
		console.log("updated array3 : ", updatedArray3)

		if(parentResourceList.length > 0) {
			const resourcesDatabseUpdationArray = await getResourcesDatabseUpdationArray(domainToBeSynced, domains)
			console.log(resourcesDatabseUpdationArray)
			for(let i=0; i<resourcesDatabseUpdationArray.length; i++){
				await updateDomainSyncStatus(resourcesDatabseUpdationArray[i], updatedArray3);
			}
		}
		else {
			await updateDomainSyncStatus(domainToBeSynced, updatedArray3);
		}

		res.send(arr3);
	} catch (err) {
		next(err);
	}
});

router.put("/changeAutoSyncStatus/:domain", async (req, res, next) => {
	const { domain: domainName } = req.params;
	const { autoSync, driveAutoMove } = req.body;

	const domainSchema = z.string();

	if (!domainSchema.safeParse(domainName).success) {
		res.status(400).status({
			message: "Bad Request, valid domain required"
		});
		return;
	}

	try {
		await changeAutoSyncStatus(domainName, autoSync, driveAutoMove);
		res.status(200).send("response");
	} catch (err) {
		next(err);
	}
});

// Returns a list of admin emails
router.get("/domains", async (req, res, next) => {
	try {
		const domains = await getAllDomainsData();
		res.send(domains);
	} catch (err) {
		next(err);
	}
});

// Resync all domains (where autoSync is on): To be called by the scheduler
router.post("/reSyncAllDomains", async (req, res, next) => {
	try {
		await reSyncAllDomains(new Date());
		res.send("Syncing");
	} catch (err) {
		next(err);
	}
});

router.post("/reSyncDomain/:domain", async (req, res, next) => {
	try {
		const currDomain = req.params.domain;
		const domains = await getAllDomains();
		const domainData = await getDomainSyncStatus(currDomain);
		await reSyncDomain(domains, domainData, new Date());
		res.send("Done");
	} catch (err) {
		next(err);
	}
});

router.post("/deleteDomainSync", async (req, res, next) => {
	try {
		const domainList = req.body.domain;
		domainList.forEach(async (domain) => {
			deleteDomainSyncStatus(domain);
		});

		res.send("Done");
	} catch (err) {
		next(err);
	}
});

// router.get("/getUserCountForAllDomains", async (req, res, next) => {
// 	try {
// 		const domains = await getAllDomains();
// 		const promises = domains.map((domain) => {
// 			return getUserCount(domain.domain, domain.email);
// 		});
// 		await Promise.all(promises);
// 		res.send("User Count Updated!!!");
// 	} catch (err) {
// 		next(err);
// 	}
// });

router.get("/getUserCountForAllDomainsFromDatabase", async (req, res, next) => {
	try {
		const output = await getUserCountFromDatabase();
		res.status(200).send(output);
	} catch (err) {
		next(err);
	}
});

// Get suspended users
const { getAuthToken } = require("../../config");
const { google } = require("googleapis");

router.get("/getSuspendedUsers/:query", async (req, res, next) => {
	try {
		const { query } = req.params;

		const querySchema = z.string();

		if (!querySchema.safeParse(query).success) {
			res.status(400).status({
				message: "Bad Request, valid query required"
			});
			return;
		}
		const domains = await getAllDomains();

		const suspendedUsers = [];
		let count = 0;
		for (const index in domains) {
			const auth = getAuthToken(
				process.env.GOOGLE_EMAIL,
				process.env.GOOGLE_PRIVATE_KEY,
				[
					"https://www.googleapis.com/auth/admin.directory.user.readonly",
					"https://www.googleapis.com/auth/admin.directory.group.readonly"
				],
				domains[index].email
			);

			const service = google.admin({ version: "directory_v1", auth });
			let nextPageToken = "";

			do {
				const usersRes = await service.users.list({
					// maxResults: 500,
					orderBy: "email",
					domain: domains[index].domain,
					showDeleted: false,
					pageToken: nextPageToken,
					query: `email:{${query}}*`
				});

				if (usersRes?.data?.users !== undefined) {
					suspendedUsers.push(...usersRes?.data?.users);
					count += usersRes.data.users.length;
				}
				nextPageToken = usersRes?.data?.nextPageToken;
			} while (nextPageToken !== undefined);

			do {
				const groupsRes = await service.groups.list({
					// maxResults: 500,
					orderBy: "email",
					domain: domains[index].domain,
					showDeleted: false,
					pageToken: nextPageToken,
					query: `email:{${query}}*`
				});

				if (groupsRes?.data?.groups !== undefined) {
					suspendedUsers.push(...groupsRes?.data?.groups);
					count += groupsRes.data.groups.length;
				}
				nextPageToken = groupsRes?.data?.nextPageToken;
			} while (nextPageToken !== undefined);
		}

		console.log("Suspended user count: ", count);

		res.send(suspendedUsers);
	} catch (error) {
		next(error);
	}

	// const startTime = "2023-03-01T00:00:00.000Z";
	// const endTime = "2023-04-01T00:00:00.000Z";
	// const auth = getAuthToken(
	// process.env.GOOGLE_EMAIL,
	// process.env.GOOGLE_PRIVATE_KEY,
	// [
	// "https://www.googleapis.com/auth/admin.reports.audit.readonly",
	// "https://www.googleapis.com/auth/admin.directory.user.readonly"
	// ],
	// // Admin Acc
	// // "ojas@dev.searce.me"
	// adminAcc
	// );

	// const service = google.admin({ version: "reports_v1", auth });
	// const response = await service.activities.list({
	// userKey: "all",
	// applicationName: "admin",
	// // CREATE_USER or DELETE_USER
	// // eventName: "CREATE_USER",
	// eventName: "SUSPEND_USER",
	// // Start time parameter
	// // startTime: "2023-01-01T00:00:00.000Z",
	// startTime,
	// // End time = start time + sync duration(param)
	// // endTime: "2023-02-16T23:59:59.000Z"
	// endTime
	// });

	// const serviceAdmin = google.admin({ version: "directory_v1", auth });

	// const suspendedUsers = response?.data?.items?.map((item) => {
	// const userEmail = item?.events[0]?.parameters[0]?.value;
	// console.log("userEmail: ", userEmail);
	// const userRes = serviceAdmin.users.get({
	// userKey: userEmail
	// });
	// console.log("userRes :", userRes.data.suspended);
	// if (userRes.data.suspended) {
	// console.log("userRes.data.primaryEmail: ", userRes.data.primaryEmail);
	// return userRes.data.primaryEmail;
	// }
	// return null;
	// });

	// res.send("ok");
});

module.exports = router;
