/* eslint-disable no-tabs */
const dotenv = require("dotenv");
const { Datastore } = require("@google-cloud/datastore");
let xmlParser = require('xml2json');
dotenv.config();

const { google } = require("googleapis");
const { getAuthToken } = require("../../config");
const { InsertProgressesById, calculateProgress } = require("../progress");
const { insertContact, removeContact, replaceSpecialCharacter } = require("../contact")
const promiseRetry = require("promise-retry");
const config = require("../../config");

const throttledQueue = require("throttled-queue");
const throttle = throttledQueue(config.config.calendarThrottle, 1000, true);

const datastore = new Datastore({
	projectId: config.config.GCLOUD_PROJECT,
	keyFile: config.config.keyFile
});

const errorUsers = [];
let userCount = 0;
let rateLimit = 0;
let errorCount = 0;
let resourceCount = 0;

// First this function will trigger when try to sync Domain (Calendar)
function calendarInsertUsersACL (domainsData, flag) {
	domainsData.forEach((value, index, array) => {
		const newArray = array.filter((val) => {
			return val.domain !== value.domain;
		});
		insertACLRulesForAllUsers(value.email, value.domain, newArray, flag);
	});
}

// Function that call insert/remove ACL Rules for the list of domains
async function insertACLRulesForAllUsers (adminAcc, currDomain, domains, flag) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/calendar",
			"https://www.googleapis.com/auth/admin.directory.user.readonly",
			"https://www.googleapis.com/auth/admin.directory.resource.calendar"
		],
		adminAcc
	);

	// eslint-disable-next-line no-unused-vars
	const calendar = google.calendar({
		version: "v3",
		project: process.env.GOOGLE_PROJECT_NUMBER,
		auth
	});

	const service = google.admin({ version: "directory_v1", auth });
	let nextPageToken = "";
	const users = [];
	do {
		const usersRes = await service.users.list({
			// maxResults: 15,
			orderBy: "email",
			domain: currDomain,
			showDeleted: false,
			pageToken: nextPageToken
		});
		users.push(...usersRes?.data?.users);
		nextPageToken = usersRes.data?.nextPageToken;
	} while (nextPageToken !== undefined);

	const totalUsers = users.length;
	const syncType = flag ? "insert" : "remove";
	if (Array.isArray(users) && totalUsers > 0) {
		domains.forEach(domainItem => {
			InsertProgressesById("calendar", syncType, {
				from: currDomain,
				to: domainItem.domain,
				current: 0,
				totalCount: totalUsers
			});
		});
	}

	console.log("Total Users- ", currDomain, ": ", totalUsers);

	domains.forEach((domainItem) => {
		let currentCount = 0;
		users
			.forEach((user) => {
				if (flag) {
					throttle(() => {
						// if(user.primaryEmail === "karishma@dev.searce.me") {
							insertACLRulesUsers(calendar, user.primaryEmail, domainItem.domain)
							.then(() => {
								currentCount = currentCount + 1;
								calculateProgress(currentCount, totalUsers, currDomain, domainItem.domain, "insert", "calendar");
							});
						// }
						
					});
				} else {
					throttle(() => {
						removeACLRulesUsers(calendar, user.primaryEmail, domainItem.domain)
							.then(async () => {
								currentCount = currentCount + 1;
								calculateProgress(currentCount, totalUsers, currDomain, domainItem.domain, "remove", "calendar");
							});
					});
				}
			});
	});
}

// Insert ACL Rules for a single user: User to domains sync
function insertACLRulesForUser (adminAcc, userEmail, domainList, flag) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/calendar"
		],
		adminAcc
	);

	const calendar = google.calendar({
		version: "v3",
		project: process.env.GOOGLE_PROJECT_NUMBER,
		auth
	});

	domainList.forEach((domain) => {
		// const calendarId = userEmail;
		if (flag) {
			insertACLRulesUsers(calendar, userEmail, domain);
			// .then(() => {
			// 	console.log("Successfully Calendar added for a single user.");
			// });
		} else {
			removeACLRulesUsers(calendar, userEmail, domain);
			// .then(() => {
			// 	console.log("Successfully Calendar removed for a single user.");
			// });
		}
		// if currentCount of above function is true add length of domain to result otherwise not
	});
}

// End function that insert acl rules into calendar
async function insertACLRulesUsers (calendar, calendarId, domainName) {
	try {
		const res = await promiseRetry(async (retry) => {
			try {
				// console.log("calendarId: ", calendarId);
				// console.log("domainName: ", domainName);
				const auth = getAuthToken(
					process.env.GOOGLE_EMAIL,
					process.env.GOOGLE_PRIVATE_KEY,
					[
						"https://www.googleapis.com/auth/calendar"
					],
					calendarId
				);

				const calendar2 = google.calendar({
					version: "v3",
					project: process.env.GOOGLE_PROJECT_NUMBER,
					auth
				});
				// eslint-disable-next-line no-unused-vars
				const res3 = await calendar2.acl.insert({
					calendarId,
					sendNotifications: false,
					requestBody: {
						role: "freeBusyReader",
						scope: {
							type: "domain",
							value: domainName
						}
					}
				});
				userCount = userCount + 1;
				console.log(`UserCount:${userCount} - ${calendarId} added successfully in ${domainName} `);
				return true;
			} catch (e) {
				// TODO Sometimes e.errors does not exist - temporary workaround
				if (!e.errors) {
					return false;
				}
				// console.log("error here: ", e.errors[0].reason);
				if (e.errors[0].message === "Not Found" || e.errors[0].reason === "notACalendarUser") {
					errorUsers.push(calendarId);
					errorCount = errorCount + 1;
					// console.log(e.errors[0].message);
					console.log("errorCount", errorCount);
					console.log("Failed to add following Users: ", calendarId);
					console.log("Error: ", e.errors[0]);
					return false;
				// eslint-disable-next-line brace-style
				}
				// if (e.errors[0].message !== "Not Found") {
				// 	console.log(e.errors);
				// 	// console.log(e);
				// 	rateLimit = rateLimit + 1;
				// 	console.log("rateCount", rateLimit);
				// 	retry();
				// }
				else {
					console.log(e.errors);
					// console.log(e);
					rateLimit = rateLimit + 1;
					console.log("rateCount", rateLimit);
					retry();
				}
			}
		}, {
			minTimeout: 2000,
			retries: 6,
			factor: 4,
			randomize: true
		});
		return res;
	} catch (err) {
		// Fails after 6 retries
		errorUsers.push(calendarId);
		return false;
	}
}

// End function that remove acl rules into calendar
async function removeACLRulesUsers (calendar, calendarId, domainName) {
	try {
		const res = await promiseRetry(async (retry) => {
			try {
				const auth = getAuthToken(
					process.env.GOOGLE_EMAIL,
					process.env.GOOGLE_PRIVATE_KEY,
					[
						"https://www.googleapis.com/auth/calendar"
					],
					calendarId
				);

				const calendar2 = google.calendar({
					version: "v3",
					project: process.env.GOOGLE_PROJECT_NUMBER,
					auth
				});
				await calendar2.acl.delete({
					calendarId,
					ruleId: "domain:" + domainName
				});
				userCount = userCount + 1;
				console.log(`UserCount:${userCount} - ${calendarId} removed succeessfully in ${domainName} `);

				return true;
			} catch (e) {
				// TODO Sometimes e.errors does not exist - temporary workaround
				if (!e.errors) {
					return false;
				}
				if (e.errors[0].message === "Not Found" || e.errors[0].reason === "notACalendarUser") {
					errorUsers.push(calendarId);
					errorCount = errorCount + 1;
					// console.log(e.errors[0].message);
					console.log("errorCount", errorCount);
					console.log("Failed to remove following Users: ", calendarId);
					console.log("Error: ", e.errors[0]);
					return false;
				} else {
					console.log(e.errors);
					// console.log(e);
					rateLimit = rateLimit + 1;
					console.log("rateCount", rateLimit);
					retry();
				}

				// if (e.errors[0].message !== "Not Found" || e.errors[0].message !== "The user must be signed up for Google Calendar.") {
				// 	console.log(e.errors[0].message);
				// 	// console.log(e);
				// 	rateLimit = rateLimit + 1;
				// 	console.log("rateCount", rateLimit);
				// 	retry();
				// } else {
				// 	errorUsers.push(calendarId);
				// 	console.log("errorCount", errorCount);
				// 	console.log("Failed to remove following Users: ", e.errors);
				// 	return false;
				// }
			}
		}, {
			minTimeout: 2000,
			retries: 6,
			factor: 4,
			randomize: true
		});
		return res;
	} catch (err) {
		// Fails after 6 retries
		errorUsers.push(calendarId);
		return false;
	}
}

// First this function will trigger when try to sync DomainWithDomain (Resource)
function calendarInsertResourcesACL (domainsData) {
	domainsData.forEach((value, index, array) => {
		const newArray = array.filter((val) => {
			return val.domain !== value.domain;
		});
		insertACLRulesForAllResources(value.email, value.domain, newArray);
	});
}

// It traverse the domainArray and call insert/remove acl rules from resource
async function insertACLRulesForAllResources (adminAcc, currDomain, domains, flag) {
	const auth =  getAuthToken(process.env.GOOGLE_EMAIL,process.env.GOOGLE_PRIVATE_KEY,[
		"https://www.googleapis.com/auth/calendar",
		"https://www.googleapis.com/auth/admin.directory.user.readonly",
		"https://www.googleapis.com/auth/admin.directory.resource.calendar",
	],adminAcc)
	const calendar = google.calendar({
		version: "v3",
		project: process.env.GOOGLE_PROJECT_NUMBER,
		auth
	});

	const service = google.admin({ version: "directory_v1", auth });
	let nextPageToken = "";
	const resources = [];
	do {
		const resourcesRes = await service.resources.calendars.list({
			customer: "my_customer",
			pageToken: nextPageToken
			// maxResults: 10,
		});
		// console.log("resources: ", resourcesRes.data.items);
		if (resourcesRes?.data?.items !== undefined) resources.push(...resourcesRes?.data?.items);
		nextPageToken = resourcesRes.data?.nextPageToken;
	} while (nextPageToken !== undefined);

	const totalResources = resources.length;
	const syncType = flag ? "insert" : "remove";
	if (Array.isArray(resources) && totalResources > 0) {
		domains.forEach(async domainItem => {
			const syncQuery = datastore.createQuery("ResourceSync").filter("from", "=", currDomain).filter("to", "=", domainItem.domain);
			const [syncExports] = await datastore.runQuery(syncQuery);
			console.log("syncExports Length : ", syncExports.length)

			InsertProgressesById("resource", syncType, {
				from: currDomain,
				to: domainItem.domain,
				current: 0,
				totalCount: syncType ? totalResources : syncExports.length
			});
		});
	}
	console.log("Total Resources- ", currDomain, ": ", totalResources);

	if (resources === undefined  && flag) return;

	domains.forEach(async(value) => {
		const auth2 = getAuthToken(process.env.GOOGLE_EMAIL,process.env.GOOGLE_PRIVATE_KEY,["https://www.google.com/m8/feeds"],value.email)

		// let allSharedContacts = []
		// if(!flag){
		// 	allSharedContacts = await getAllContacts(value.domain,auth2)
		// 	console.log("allSharedContacts Length : ", allSharedContacts.length)
		// }

		let currentCount = 0;

		if (flag) {
			resources.forEach((user, index, array) => {
				// if(user.resourceEmail === "c_1883onb2gh76qj78hnm5pmc771pcq@resource.calendar.google.com")
				throttle(() => {
					insertACLRulesResources(calendar, user.resourceEmail, value.domain, user.resourceName, auth2, currDomain)
						.then(async () => {
							currentCount = currentCount + 1;
							calculateProgress(currentCount, totalResources, currDomain, value.domain, "insert", "resource");
						});
				});
			})
		}
		else {
			const syncQuery = datastore.createQuery("ResourceSync").filter("from", "=", currDomain).filter("to", "=", value.domain);
			const [syncExports] = await datastore.runQuery(syncQuery);
			console.log("syncExports Length : ", syncExports.length)

			syncExports.forEach((user, index, array) => {
				throttle(() => {
					removeACLRulesResources(calendar, user.calendarId, value.domain, value.email, user.UIDUrl, user[datastore.KEY].id, false)
						.then(async () => {
							currentCount = currentCount + 1;
							calculateProgress(currentCount, totalResources, currDomain, value.domain, "remove", "resource");
						});
				});
			})
		}
		
		// resources.forEach((user, index, array) => {
		// 	// if(user.resourceEmail === "c_1880ej5dmb7c2jgdndhousq9je24o@resource.calendar.google.com" || user.resourceEmail === "dev.searce.me_3131333636373130343439@resource.calendar.google.com" || user.resourceEmail === "c_188au7492jpm8gj0mp405028nmmf4@resource.calendar.google.com")
		// 	if (flag) {
		// 		throttle(() => {
		// 			insertACLRulesResources(calendar, user.resourceEmail, value.domain, user.resourceName, auth2, currDomain)
		// 				.then(async () => {
		// 					currentCount = currentCount + 1;
		// 					calculateProgress(currentCount, totalResources, currDomain, value.domain, "insert", "resource");
		// 				});
		// 		});
		// 	} else {
		// 		throttle(() => {
		// 			removeACLRulesResources(calendar, user.resourceEmail, value.domain, value.email, auth2, allSharedContacts)
		// 				.then(async () => {
		// 					currentCount = currentCount + 1;
		// 					calculateProgress(currentCount, totalResources, currDomain, value.domain, "remove", "resource");
		// 				});
		// 		});
		// 	}
		// });
	});
}

// Insert ACL Rules Resources for a single user: User to domains sync
// function insertACLRulesResourcesForUser(adminAcc, userEmail, domainList, flag) {
// const auth = getAuthToken(
// process.env.GOOGLE_EMAIL,
// process.env.GOOGLE_PRIVATE_KEY,
// [
// "https://www.googleapis.com/auth/calendar"
// ],
// adminAcc
// );

// const calendar = google.calendar({
// version: "v3",
// project: process.env.GOOGLE_PROJECT_NUMBER,
// auth
// });

// domainList.forEach((domain) => {
// // const calendarId = userEmail;
// if (flag) {
// insertACLRulesUsers(calendar, userEmail, domain).then(() => {
// console.log("Successfully Calendar added for a single user.");
// })

// } else {
// removeACLRulesUsers(calendar, userEmail, domain).then(() => {
// console.log("Successfully Calendar removed for a single user.");
// });

// }
// // if currentCount of above function is true add length of domain to result otherwise not
// });
// }

// End function that insert acl rules for resources into calendar
async function insertACLRulesResources (calendar, calendarId, domainName, calendarName, auth2, currDomain) {
	try {
		await promiseRetry(async (retry, number) => {
			try {
				// eslint-disable-next-line no-unused-vars
				const res3 = await calendar.acl.insert({
					calendarId,
					sendNotifications: false,
					requestBody: {
						role: "freeBusyReader",
						scope: {
							type: "domain",
							value: domainName
						}
					}
				});
				resourceCount = resourceCount + 1;
				console.log(`ResourceCount:${resourceCount} - ${calendarId} added succeessfully in ${domainName} `);

				const body = {
					primaryEmail: replaceSpecialCharacter(calendarId),
					givenName: "",
					familyName: "",
					fullName: replaceSpecialCharacter(calendarName),
					emails: [],
					relations: [],
					addresses: [],
					organizations: [],
					phones: [],
					locations: [],
					languages: [],
					orgUnitPath: "",
					thumbnailPhotoUrl: "",
					thumbnailPhotoEtag: ""
				};

				let url = ""
				const output = await insertContact(auth2,body,domainName)
				if(output.data) {
					const outputData = JSON.parse(xmlParser.toJson(output.data))
					url = outputData.entry.link.filter(val => val.rel === "edit")?.[0]?.href;
					console.log("uidurl is : " , url)
				}

				const key = datastore.key("ResourceSync");
				await datastore.insert({
					key,
					data: {
						UIDUrl: url,
						calendarId: calendarId,
						from: currDomain,
						to: domainName,
						name: calendarName
					}
				});

			} catch (e) {
				console.log(e)
				if (e.errors[0].message !== "Not Found") {
					retry();
				} else {
					errorUsers.push(calendarId);
					// console.log("Failed to add following Users: ", errorUsers);
				}
				console.log(calendarId, domainName, "error", e.errors);
			}
		}, {
			minTimeout: 2000,
			retries: 6,
			factor: 4,
			randomize: true
		});
	} catch (err) {
		// Failed after all retries
		console.log(calendarId, domainName, "error", " Failed after all retries");
	}
}

// End function that remove acl rules for resources into calendar
async function removeACLRulesResources (calendar, calendarId, domainName, adminAcc, UIDUrl, databaseId, isAuto) {
	try {
		await promiseRetry(async (retry, number) => {
			try {
				if(!isAuto) {
					await calendar.acl.delete({
						calendarId,
						ruleId: "domain:" + domainName
					});
					resourceCount = resourceCount + 1;
					console.log(`ResourceCount:${resourceCount} - ${calendarId} removed succeessfully in ${domainName} `);
				}
				
				if(UIDUrl != "")
				await removeContact(calendarId, adminAcc, UIDUrl, domainName)

				const syncKey = datastore.key(["ResourceSync", Number(databaseId)]);
				await datastore.delete(syncKey);

			} catch (e) {
				if (e.errors[0].message !== "Not Found") {
					retry();
				} else {
					errorUsers.push(calendarId);
					// console.log("Failed to add following Users: ", errorUsers);
				}
				console.log(calendarId, domainName, "error", e.errors);
			}
		}, {
			minTimeout: 2000,
			retries: 6,
			factor: 4,
			randomize: true
		});
	} catch (err) {
		// Failed after all retries
		console.log(calendarId, domainName, "error", " Failed after all retries");
	}
}

module.exports = {
	calendarInsertUsersACL,
	calendarInsertResourcesACL,
	insertACLRulesForAllUsers,
	insertACLRulesForUser,
	insertACLRulesForAllResources,
	removeACLRulesUsers,
	insertACLRulesResources,
	removeACLRulesResources
	// insertACLRulesResourcesForUser
};
