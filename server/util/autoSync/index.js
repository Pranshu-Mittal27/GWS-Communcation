/* eslint-disable no-unused-vars */
/* eslint-disable no-tabs */
const dotenv = require("dotenv");
dotenv.config();

const { google } = require("googleapis");
const { getAuthToken, config } = require("../../config");
const { insertACLRulesForUser, insertACLRulesResources, removeACLRulesResources} = require("../calendar");
const { insertContactsForUser } = require("../contact");
const { getAllDomainsSyncStatus, getAllDomains, updateDomainSyncStatus } = require("../domain");
const { Datastore } = require("@google-cloud/datastore");

const throttledQueue = require("throttled-queue");
const calendarThrottle = throttledQueue(config.calendarThrottle, 1000, true);
const contactThrottle = throttledQueue(config.contactThrottle, 1000, true);
const resourceThrottle = throttledQueue(config.resourceThrottle, 1000, true);
const contactUpdatedThrottle = throttledQueue(1, 3000, true);

const datastore = new Datastore({
	projectId: config.GCLOUD_PROJECT,
	keyFilename: config.keyFile
});

async function getNewUsers (adminAcc, eventName, startTime, endTime) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/admin.reports.audit.readonly"
		],
		// Admin Acc
		// "ojas@dev.searce.me"
		adminAcc
	);

	const service = google.admin({ version: "reports_v1", auth });
	const res = await service.activities.list({
		userKey: "all",
		applicationName: "admin",
		// CREATE_USER or DELETE_USER
		// eventName: "CREATE_USER",
		eventName,
		// Start time parameter
		// startTime: "2023-01-01T00:00:00.000Z",
		startTime,
		// End time = start time + sync duration(param)
		// endTime: "2023-02-16T23:59:59.000Z"
		endTime
	});

	const itemsData = res.data?.items?.map((item) => {
		const email = item?.events?.filter(val => { return val.name === eventName; })?.[0]
			?.parameters.filter(val => val.name === "USER_EMAIL")?.[0].value;
		return {
			time: item.id.time,
			email
		};
	});

	// let filteredData = res.data?.items?.map((item) => item?.events)?.flat();
	// console.log("Filtered data 1", filteredData);
	// filteredData = filteredData?.map((item) => item?.parameters)?.flat();
	// filteredData = filteredData?.map((item) => item?.value);
	// console.log(filteredData);
	return itemsData || [];
}

async function getUniqueResources (adminAcc,domain, destinationDomain) {
	const auth =  getAuthToken(process.env.GOOGLE_EMAIL,process.env.GOOGLE_PRIVATE_KEY,[
		"https://www.googleapis.com/auth/calendar",
		"https://www.googleapis.com/auth/admin.directory.user.readonly",
		"https://www.googleapis.com/auth/admin.directory.resource.calendar",
	],adminAcc)

	const service = google.admin({ version: "directory_v1", auth });
	let nextPageToken = "";
	const resourcesApi = [];
	do {
		const resourcesRes = await service.resources.calendars.list({
			customer: "my_customer",
			pageToken: nextPageToken
			// maxResults: 10,
		});
		// console.log("resources: ", resourcesRes.data.items);
		if (resourcesRes?.data?.items !== undefined) resourcesApi.push(...resourcesRes?.data?.items);
		nextPageToken = resourcesRes.data?.nextPageToken;
	} while (nextPageToken !== undefined);

	const totalResourcesApi = resourcesApi.length;
	console.log("totalResourcesApi : ", totalResourcesApi)

	const resourcesQuery = datastore.createQuery("ResourceSync").filter("from", "=", domain).filter("to", "=", destinationDomain);
	const [resourcesDB] = await datastore.runQuery(resourcesQuery);
	console.log("totalResourcesDB : ", resourcesDB.length)

	let createdResources = []
	let deletedResources = []

	for(let i=0; i<resourcesApi.length; i++) {
		const found = resourcesDB.some(el => el.calendarId === resourcesApi[i].resourceEmail);
  		if (!found) 
		createdResources.push(resourcesApi[i])
	}
	console.log("created : ", createdResources.length)

	for(let i=0; i<resourcesDB.length; i++) {
		const found = resourcesApi.some(el => el.resourceEmail === resourcesDB[i].calendarId);
  		if (!found) 
		deletedResources.push(resourcesDB[i])
	}
	console.log("deleted : ", deletedResources.length)

	return { resourceCreated: [...new Set(createdResources)], resourceDeleted: [...new Set(deletedResources)] };
}

async function getUniqueUsers (adminAcc, startTime, endTime, domain) {
	let userCreated = await getNewUsers(adminAcc, "CREATE_USER", startTime, endTime);
	let userDeleted = await getNewUsers(adminAcc, "DELETE_USER", startTime, endTime);

	const updationArray = ["CHANGE_FIRST_NAME", "CHANGE_LAST_NAME", "CHANGE_DISPLAY_NAME", "ADD_DISPLAY_NAME", "REMOVE_DISPLAY_NAME", "CHANGE_USER_ADDRESS", "CHANGE_USER_ORGANIZATION", "CHANGE_USER_PHONE_NUMBER", "DELETE_PROFILE_PHOTO", "UPDATE_PROFILE_PHOTO", "MOVE_USER_TO_ORG_UNIT"]
	let userupdated = []
	for(let i=0; i<updationArray.length; i++){
		const updatedArray = await getNewUsers(adminAcc, updationArray[i], startTime, endTime);
		userupdated.push(...updatedArray)
	}

	userDeleted?.filter((item) => {
		const indexToRemove = userCreated.findIndex((val) => val.email === item.email);
		if (indexToRemove > -1) {
			userCreated.splice(indexToRemove, 1);
			return true;
		}
		return false;
	});
	userCreated?.filter((item) => {
		const indexToRemove = userDeleted.findIndex((val) => val.email === item.email);
		if (indexToRemove > -1) {
			userDeleted.splice(indexToRemove, 1);
			return true;
		}
		return false;
	});
	userupdated?.filter((item) => {
		const indexToRemove = userupdated.findIndex((val) => val.email === item.email);
		if (indexToRemove > -1) {
			userupdated.splice(indexToRemove, 1);
			return true;
		}
		return false;
	});
	userCreated = userCreated.filter((val) => val.email.split("@")[1] === domain);
	userDeleted = userDeleted.filter((val) => val.email.split("@")[1] === domain);
	userupdated = userupdated.filter((val) => val.email.split("@")[1] === domain);
	return { userCreated: [...new Set(userCreated)], userDeleted: [...new Set(userDeleted)], userupdated: [...new Set(userupdated)]};
}

async function getUsersInfoByEventname (adminAcc, eventName, startTime, endTime) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/admin.reports.audit.readonly"
		],
		// Admin Acc
		// "ojas@dev.searce.me"
		adminAcc
	);

	const service = google.admin({ version: "reports_v1", auth });
	const res = await service.activities.list({
		userKey: "all",
		applicationName: "admin",
		// CREATE_USER or DELETE_USER
		// eventName: "CREATE_USER",
		eventName,
		// Start time parameter
		// startTime: "2023-01-01T00:00:00.000Z",
		startTime,
		// End time = start time + sync duration(param)
		// endTime: "2023-02-16T23:59:59.000Z"
		endTime
	});

	const itemsData = res.data?.items?.map((item) => {
		let eventInfo = "";

		const email = item?.events?.filter(val => { eventInfo = val; return val.name === eventName; })?.[0]
			?.parameters.filter(val => val.name === "USER_EMAIL")?.[0].value;
		return email;
	});

	// let filteredData = res.data?.items?.map((item) => item?.events)?.flat();
	// console.log("Filtered data 1", filteredData);
	// filteredData = filteredData?.map((item) => item?.parameters)?.flat();
	// filteredData = filteredData?.map((item) => item?.value);
	// console.log(filteredData);
	return itemsData || [];
}
async function getUpdatedUsersForContact (adminAcc, startTime, endTime, domain, eventArray) {
	let users = [];
	await Promise.all(eventArray.map(async (event) => {
		const userData = await getUsersInfoByEventname(adminAcc, event, startTime, endTime);
		// console.log("userData", userData);
		users.push(...userData);
	}));
	users = [...new Set(users)];
	users = users.filter((val) => val.split("@")[1] === domain);
	return users;
}

async function getNewSuspendedUsers (adminAcc, eventName, startTime, endTime, domain) {
	try {
		const auth = getAuthToken(
			process.env.GOOGLE_EMAIL,
			process.env.GOOGLE_PRIVATE_KEY,
			[
				"https://www.googleapis.com/auth/admin.reports.audit.readonly",
				"https://www.googleapis.com/auth/admin.directory.user.readonly"
			],
			// Admin Acc
			// "ojas@dev.searce.me"
			adminAcc
		);

		const service = google.admin({ version: "reports_v1", auth });
		const serviceAdmin = google.admin({ version: "directory_v1", auth });
		const res = await service.activities.list({
			userKey: "all",
			applicationName: "admin",
			// CREATE_USER or DELETE_USER
			// eventName: "CREATE_USER",
			eventName,
			// Start time parameter
			// startTime: "2023-01-01T00:00:00.000Z",
			startTime,
			// End time = start time + sync duration(param)
			// endTime: "2023-02-16T23:59:59.000Z"
			endTime
		});
		if (res.data?.items === undefined) return [];
		// console.log("itemsData: ", res.data);
		let itemsData = res.data?.items?.map((item) => {
			const email = item?.events?.filter(val => val.name === eventName)?.[0]?.parameters.filter(val => val.name === "USER_EMAIL")?.[0]?.value;
			return {
				time: item.id.time,
				email
			};
		});
		itemsData = itemsData.filter((val) => val.email.split("@")[1] === domain);
		itemsData = [...new Map(itemsData.map(item => [item.email, item])).values()];

		if (itemsData === undefined) return [];
		const promise = await Promise.all(
			itemsData?.map(async (item) => {
				try {
					const { data } = await serviceAdmin.users.get({
						userKey: item.email
					});
					if (data.suspended) {
						return item;
					}
				} catch (error) {
					console.log("error-", item.email, error.errors);
				}
			})
		);
		itemsData = promise.filter((obj) => obj);
		return itemsData || [];
	} catch (error) {
		console.log("err", error);
	}
}
// TODO update timestamp after resync in datastore
async function reSyncDomain (domains, domainData, endTime) {
	let lastSyncTime = new Date();
    const copyLastSyncTime = lastSyncTime;

	const domainCalendarList = domainData.syncStatus.filter((item) => item.calendar !== undefined && item?.calendar[0] === "+" && item?.isPrimary === true).map((item) => {
		// const calendarSyncDate = new Date(item.calendar.substring(1));
		// lastSyncTime = lastSyncTime < calendarSyncDate ? lastSyncTime : calendarSyncDate;
		return item.domainName;
	});
	console.log("domainCalendarList : ", domainCalendarList)

	let domainContactList = domainData.syncStatus.filter((item) => item.contact !== undefined && item?.contact[0] === "+" && item?.isPrimary === true).map((item) => {
		// const contactSyncDate = new Date(item.contact.substring(1));
		// lastSyncTime = lastSyncTime < contactSyncDate ? lastSyncTime : contactSyncDate;
		return item.domainName;
		// return item.contact[0] === "+" ? item.domainName : undefined;
	});
	console.log("domainContactList : ", domainContactList)

	const primaryDomainResourceList = domainData.syncStatus.filter((item) => item.resource !== undefined && item?.resource[0] === "+" && item?.isPrimary === true).map((item) => {
		// const resourceSyncDate = new Date(item.resource.substring(1));
		// lastSyncTime = lastSyncTime < resourceSyncDate ? lastSyncTime : resourceSyncDate;
		return item.domainName;
	});
	console.log("primaryDomainResourceList : ", primaryDomainResourceList)

	domainData.syncStatus.filter((item) => item.autoSync !== undefined).map((item) => {
        const autoSyncDate = new Date(item.autoSync);
        lastSyncTime = lastSyncTime < autoSyncDate ? lastSyncTime : autoSyncDate;
    });

    if (lastSyncTime === copyLastSyncTime) {
        domainData.syncStatus.filter((item) => item.calendar !== undefined && item?.calendar[0] === "+").map((item) => {
            const calendarSyncDate = new Date(item.calendar.substring(1));
            lastSyncTime = lastSyncTime < calendarSyncDate ? lastSyncTime : calendarSyncDate;
        });

        domainData.syncStatus.filter((item) => item.contact !== undefined && item?.contact[0] === "+").map((item) => {
            const contactSyncDate = new Date(item.contact.substring(1));
            lastSyncTime = lastSyncTime < contactSyncDate ? lastSyncTime : contactSyncDate;
        });
		domainData.syncStatus.filter((item) => item.resource !== undefined && item?.resource[0] === "+").map((item) => {
			const resourceSyncDate = new Date(item.resource.substring(1));
			lastSyncTime = lastSyncTime < resourceSyncDate ? lastSyncTime : resourceSyncDate;
		});
    }

	console.log("lastsynctime: ", lastSyncTime);

	domainContactList = domains.filter((val) => {
		return domainContactList.indexOf(val.domain) >= 0;
	});

	// Do not proceed when domain was not synced
	// In this case, the start time(lastSyncTime) would be a newer date than the endTime

	if (lastSyncTime >= endTime) {
		console.log("return domain", domainData.name);
		return;
	}
	const admin = domains.filter((val) => val.domain === domainData.name)[0].email;

	// Fetching the list of users newly created and recently deleted
	const users = await getUniqueUsers(admin, lastSyncTime, endTime, domainData.name);
	console.log("users : ", users)
	const usersCreated = users.userCreated;
	const usersDeleted = users.userDeleted;
	const usersUpdated = users.userupdated;

	// Fetching the list of users which are recently updated

	// const eventArray = ["CHANGE_FIRST_NAME", "CHANGE_LAST_NAME", "CHANGE_USER_ADDRESS", "CHANGE_USER_ORGANIZATION", "CHANGE_USER_PHONE_NUMBER"];
	// // const eventArray = ["CHANGE_USER_ADDRESS", "CHANGE_USER_ORGANIZATION", "CHANGE_USER_PHONE_NUMBER"];
	// // const endTime = new Date();
	// const startTime = new Date(endTime - (3600 * 1000 * 24) * 2);
	// if (domainData.name === "jindalsteelodisha.com") {

	// 	contactUpdatedThrottle(async () => {
	// 		const updatedUsers = await getUpdatedUsersForContact(admin, startTime, endTime, domainData.name, eventArray);
	// 		console.log("updatedUsers", domainData.name, updatedUsers);

	// 		// add filter based on time
	// 		console.log("1111111111");
	// 		await Promise.all(domainContactList.map(async (val) => {
	// 			// console.log("val", val);
	// 			updatedUsers
	// 				.forEach(user => {
	// 					contactThrottle(async () => {
	// 						console.log("user", user);

	// 						insertContactsForUser(admin, user, [val], false)

	// 					});
	// 				});

	// 		}));
	// 		console.log("22222222222");
	// 		await Promise.all(domainContactList.map(async (val) => {
	// 			// console.log("val", val);
	// 			updatedUsers
	// 				.forEach(user => {
	// 					contactThrottle(async () => {
	// 						console.log("user", user);

	// 						insertContactsForUser(admin, user, [val], true)

	// 					});
	// 				});

	// 		}));

	// 	})
	// }

	// if (domainData.name === "jindalsteel.com") {
	// 	contactUpdatedThrottle(async () => {
	// 		const updatedUsers = await getUpdatedUsersForContact(admin, startTime, endTime, domainData.name, eventArray);
	// 		console.log("updatedUsers", domainData.name, updatedUsers);
	// 	})

	// }

	// Calendar resync
	// eslint-disable-next-line array-callback-return
	usersCreated.forEach((user) => {
		calendarThrottle(() => {
			insertACLRulesForUser(admin, user.email, domainCalendarList, true);
		});
	});
	usersDeleted.forEach((user) => {
		calendarThrottle(() => {
			insertACLRulesForUser(admin, user.email, domainCalendarList, false);
		});
	});

	// Contact resync

	// Run a separate loop for each domain in contactList to avoid adding duplicate contacts
	// Take into consideration the last sync time of the domain in question
	domainContactList.forEach(async (val) => {
		// get the last sync time of the domain to be synced
		const domainContactLastSyncTime = new Date(domainData.syncStatus.filter(item => item.domainName === val.domain)[0].contact.substring(1));
		// Filter users who were created after the last time contacts were synced with val.domain
		usersCreated.filter(user => new Date(user.time) > new Date(domainContactLastSyncTime)
		).forEach(user => {
			contactThrottle(() => {
				insertContactsForUser(admin, user.email, [val], true);
			});
		});

		usersDeleted.filter(user => new Date(user.time) > new Date(domainContactLastSyncTime))
			.forEach(user => {
				contactThrottle(() => {
					insertContactsForUser(admin, user.email, [val], false);
				});
			});
		
		usersUpdated.filter(user => new Date(user.time) > new Date(domainContactLastSyncTime)
		).forEach(user => {
			contactThrottle(() => {
				insertContactsForUser(admin, user.email, [val], true, "true");
			});
		});
	});

	const auth =  getAuthToken(process.env.GOOGLE_EMAIL,process.env.GOOGLE_PRIVATE_KEY,[
		"https://www.googleapis.com/auth/calendar",
		"https://www.googleapis.com/auth/admin.directory.user.readonly",
		"https://www.googleapis.com/auth/admin.directory.resource.calendar",
	],admin)
	const calendar = google.calendar({
		version: "v3",
		project: process.env.GOOGLE_PROJECT_NUMBER,
		auth
	});

	primaryDomainResourceList.forEach(async (domain) => {
		const resources = await getUniqueResources(admin, domainData.name, domain)
		const resourceCreated = resources.resourceCreated
		const resourceDeleted = resources.resourceDeleted

		const admin2 = domains.filter((val) => val.domain === domain)[0].email;
		const auth2 = getAuthToken(process.env.GOOGLE_EMAIL,process.env.GOOGLE_PRIVATE_KEY,["https://www.google.com/m8/feeds"],admin2)

		resourceCreated.forEach((resource) => {
			resourceThrottle(() => {
				insertACLRulesResources(calendar, resource.resourceEmail, domain, resource.resourceName, auth2, domainData.name)
			});
		});
		resourceDeleted.forEach((resource) => {
			resourceThrottle(() => {
				removeACLRulesResources(calendar, resource.calendarId, domain, admin2 , resource.UIDUrl, resource[datastore.KEY].id, true)
			});
		});
	})
	
	// Update datastore with new timestamp
	const date = endTime.toISOString();
	const newSyncStatus = domainData.syncStatus.map(val => {
		// let prefix = "";
		// if (val.calendar) {
		// prefix = val.calendar[0] === "+" ? "+" : "-";
		// val.calendar = prefix + date;
		// }
		// if (val.contact) {
		// prefix = val.contact[0] === "+" ? "+" : "-";
		// val.contact = prefix + date;
		// }
		val.autoSync = date;
		return val;
	});

	updateDomainSyncStatus(domainData.name, newSyncStatus);

	// Delete deleted users entries in user and userSync tables in datastore
	usersDeleted.push({ time: "2023-04-17T09:25:02.048Z", email: "xyzte@dev.searce.me" });
	if (usersDeleted.length > 0) {
		usersDeleted.forEach((user) => {
			const userKey = datastore.key(["User", user.email]);
			console.log("userKey: ", userKey);
			datastore.delete(userKey);
			const userSyncKey = datastore.key(["UserSync", user.email]);
			datastore.delete(userSyncKey);
			console.log("user deleted from UserSync and User database: ", user.email);
		});
	}
}

async function reSyncAllDomains (endTime) {
	try {
		// console.log(endTime);
		const domains = await getAllDomains();
		const domainSyncList = await getAllDomainsSyncStatus();
		domainSyncList.filter(domain => domain.autoSync).forEach((domain) => {
			reSyncDomain(domains, domain, endTime);
		});
	} catch (e) {
		console.log("Error in AutoSync: ", e);
	}
}

module.exports = {
	reSyncDomain,
	reSyncAllDomains,
	getNewSuspendedUsers,
};
