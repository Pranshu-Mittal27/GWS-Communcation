/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs").promises;
const { getAuthToken, config } = require("../../config");
const { google } = require("googleapis");
const { Datastore } = require("@google-cloud/datastore");
const moment = require("moment");
const datastore = new Datastore({
	projectId: config.GCLOUD_PROJECT,
	keyFilename: config.keyFile
});
const path = require("path");

async function isDelegationEnabled (userMail, domain) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/calendar",
			"https://www.googleapis.com/auth/admin.directory.user.readonly",
			"https://www.googleapis.com/auth/admin.directory.resource.calendar",
			"https://www.googleapis.com/auth/contacts",
			"https://mail.google.com/",
			"https://www.googleapis.com/auth/gmail.metadata",
			"https://www.googleapis.com/auth/gmail.modify",
			"https://www.googleapis.com/auth/gmail.readonly",
			"https://www.google.com/m8/feeds"
		],
		userMail
	);
	try {
		const service = google.admin({ version: "directory_v1", auth });
		await service.users.list({
			maxResults: 1,
			domain,
			showDeleted: false
		});
	} catch (error) {
		console.log("catched error here");
		return error;
	}
	return true;
}

async function isBucketPermissionAdded (userMail, domain) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		["https://www.googleapis.com/auth/ediscovery", "https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/devstorage.full_control"],
		userMail
	);
	try {
		const filePath = "../../Asset/file.txt";
		const storage = google.storage({ version: "v1", auth });
		const data = await fs.readFile(path.resolve(__dirname, filePath), "utf8");

		const res = await storage.objects.insert({
			bucket: config.backupDestinationBucketName,
			media: {
				mimeType: "application/octet-stream",
				body: data
			},
			name: `${userMail}`
		});
		if (res.status === 200) {
			const res1 = await storage.objects.delete({
				bucket: config.backupDestinationBucketName,
				object: `${userMail}`
			});
			console.log(res1);
		} else {
			return false;
		}
		return true;
	} catch (error) {
		return error;
	}
}

async function addDomain (domainName, adminEmail, creatorEmail) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/calendar",
			"https://www.googleapis.com/auth/admin.directory.user.readonly",
			"https://www.googleapis.com/auth/admin.directory.resource.calendar",
			"https://www.googleapis.com/auth/contacts",
			"https://mail.google.com/",
			"https://www.googleapis.com/auth/gmail.metadata",
			"https://www.googleapis.com/auth/gmail.modify",
			"https://www.googleapis.com/auth/gmail.readonly",
			"https://www.google.com/m8/feeds",
			"https://www.googleapis.com/auth/admin.directory.domain",
			"https://www.googleapis.com/auth/admin.directory.domain.readonly"
		],
		adminEmail
	);
	const service = google.admin({ version: "directory_v1", auth });
	const { data: response } = await service.users.get({
		userKey: adminEmail
	});
	// console.log("data", response);
	const customer = response.customerId;
	const { data: { domains } } = await service.domains.list({
		customer
	});
	// console.log("data", domains);

	// const parentDomain = domains.filter((item) => item.domainAliases === undefined)
	const parentDomain = domains.filter((item) => item.isPrimary)[0].domainName;
	// console.log("parentDomain", parentDomain);
	const domainData = [
		{
			name: "adminEmail",
			value: adminEmail
		},
		{
			name: "createdAt",
			value: moment().format("DD MMM, YYYY")
		},
		{
			name: "creator",
			value: creatorEmail
		},
		{
			name: "userCount",
			value: 0
		},
		{
			name: "parentDomain",
			value: parentDomain
		}
	];

	datastore.save({
		key: datastore.key(["Domain", domainName.toLowerCase()]),
		data: domainData
	});

	// Add email as superadmin of this domain into User table
	datastore.save({
		key: datastore.key(["User", adminEmail]),
		data: {
			role: "superadmin",
			disabled: false,
			creationTime: new Date().toISOString()
		}
	});
}

async function getAllDomainsData () {
	const query = datastore.createQuery("Domain")
		.select();
	const [tasks] = await datastore.runQuery(query);

	return tasks.map((task) => {
		return {
			domain: task[datastore.KEY].name,
			adminEmail: task.adminEmail,
			creator: task.creator,
			createdAt: task.createdAt,
			userCount: task.userCount,
			parentDomain: task.parentDomain
		};
	});
}

async function getAllDomains () {
	const query = datastore.createQuery("Domain");
	let [tasks] = await datastore.runQuery(query);
	tasks = tasks.map((value) => {
		// console.log("value", value);
		return {
			domain: value[datastore.KEY].name,
			email: value.adminEmail,
			parentDomain: value.parentDomain
		};
	});

	return tasks;
}

async function searchDomains (searchQuery) {
	let domainArr = await getAllDomains();
	domainArr = domainArr.filter((value) => {
		return value.domain.toLowerCase().includes(searchQuery);
	}).map((value) => {
		return value;
	});
	return domainArr;
}

async function getDomainSyncStatus (domainName) {
	const key = datastore.key(["DomainSync", domainName]);
	const queries = await datastore.get(key);
	if (queries[0] === undefined) {
		return undefined;
	}
	return {
		name: queries[0][datastore.KEY].name,
		...queries[0]
	};
}

async function changeAutoSyncStatus (domainName, autoSync, driveAutoMove) {
	const key = datastore.key(["DomainSync", domainName]);
	const queries = await datastore.get(key);
	const data = {
		autoSync: autoSync === undefined || autoSync === "" ? queries[0].autoSync : autoSync,
		driveAutoMove: driveAutoMove === undefined || driveAutoMove === "" ? queries[0].driveAutoMove : { value: driveAutoMove, timeStamp: new Date().toISOString() },
		syncStatus: queries[0].syncStatus
	};

	const entity = {
		key,
		data,
		excludeFromIndexes: ["syncStatus[]"]
	};
	await datastore.upsert(entity);
	return "Updated";
}

async function updateDomainSyncStatus (domainName, syncStatus) {
	let domainSyncStatus = await getDomainSyncStatus(domainName);
	domainSyncStatus = domainSyncStatus?.syncStatus;

	// get autoSync and driveAutoMove status
	const key = datastore.key(["DomainSync", domainName]);
	const queries = await datastore.get(key);
	if (domainSyncStatus === undefined) {
		domainSyncStatus = [];
	}

	// Merge existing and new syncObject
	let arr3 = [];

	const map = new Map();
	domainSyncStatus?.forEach(item => map.set(item.domainName, item));
	syncStatus.forEach(item => map.set(item.domainName, { ...map.get(item.domainName), ...item }));
	arr3 = Array.from(map.values());

	const entity = {
		key,
		data: {
			syncStatus: arr3,
			autoSync: queries[0].autoSync,
			driveAutoMove: queries[0].driveAutoMove
		},
		excludeFromIndexes: ["syncStatus[]"]
	};
	// console.log("entity", entity.data.syncStatus);
	const res = await datastore.upsert(entity);
	return res;
}

async function deleteDomainSyncStatus (domainName) {
	const key = datastore.key(["DomainSync", domainName]);
	const queries = await datastore.get(key);

	let domainSyncStatus = await getDomainSyncStatus(domainName);
	domainSyncStatus = domainSyncStatus?.syncStatus;
	if (domainSyncStatus === undefined) {
		return;
	}
	const entity = {
		key,
		data: {
			syncStatus: [],
			autoSync: queries[0].autoSync,
			driveAutoMove: queries[0].driveAutoMove
		},
		excludeFromIndexes: ["syncStatus[]"]
	};
	const res = await datastore.upsert(entity);
	return res;
}

async function addDomainSync (domainName) {
	const domainSyncStatus = await getDomainSyncStatus(domainName);

	// if user does not exist in userSync kind
	if (domainSyncStatus !== undefined) {
		return "domain already exist in domainSync kind";
	} else {
		let syncStatus = []

		const domainQuery = datastore.key(["Domain", domainName]);
		const domainQueries = await datastore.get(domainQuery);
		const domainNameParent = domainQueries[0].parentDomain

		const domainQuery2 = datastore.createQuery("Domain").filter("parentDomain", "=", domainNameParent)
		const [domainQueries2] = await datastore.runQuery(domainQuery2);
		if(domainQueries2.length != 1){
			let i = 0
			if(domainQueries2[0][datastore.KEY].name === domainName)
			i = 1
			const domainToCheck = domainQueries2[i][datastore.KEY].name

			const domainSyncQuery = datastore.key(["DomainSync", domainToCheck]);
			const domainSyncQueries = await datastore.get(domainSyncQuery);

			const currentSyncStatus = domainSyncQueries[0].syncStatus

			for(let a=0; a<currentSyncStatus.length; a++){
				if(currentSyncStatus[a].resource != undefined){
					const syncObject = {
						domainName : currentSyncStatus[a].domainName,
						resource: currentSyncStatus[a].resource,
					}
					if(currentSyncStatus[a].isPrimary != undefined)
					syncObject.isPrimary = currentSyncStatus[a].isPrimary

					syncStatus.push(syncObject)
				}
			}
		}

		const key = datastore.key(["DomainSync", domainName]);
		const entity = {
			key,
			data: {
				driveAutoMove: { value: false, timeStamp: new Date().toISOString() },
				autoSync: true,
				syncStatus: syncStatus
			},
			excludeFromIndexes: ["syncStatus[]"]
		};
		await datastore.upsert(entity);
		return "Row Added";
	}
}

async function setLock (domainName, syncStatus) {
	const transaction = datastore.transaction();
	try {
		await transaction.run();
		let domainStatus = await getDomainSyncStatus(domainName);
		domainStatus = domainStatus?.syncStatus;

		// filter redundant entries in syncStatus
		const modifiedSyncStatus = syncStatus.reduce((modifiedSyncStatus, val) => {
			const obj = domainStatus?.find(v => v.domainName === val.domainName);
			if (!obj) {
				modifiedSyncStatus.push(val);
			} else {
				const newObj = {
					domainName: val.domainName
				};
				if (val.calendar && obj?.calendar !== "processing") {
					newObj.calendar = val.calendar;
				}
				if (val.contact && obj?.contact !== "processing") {
					newObj.contact = val.contact;
				}
				if (val.resource && obj?.resource !== "processing") {
					newObj.resource = val.resource;
				}
				if (newObj.calendar || newObj.contact || newObj.resource) {
					modifiedSyncStatus.push(newObj);
				}
			}
			return modifiedSyncStatus;
		}, []);

		// If modifiedSyncStatus is empty, all entries were already processing
		if (modifiedSyncStatus.length === 0) return "1";

		// update domainStatus
		const map = new Map();
		domainStatus?.forEach(item => map.set(item.domainName, item));
		modifiedSyncStatus.forEach(item => map.set(item.domainName, { ...map.get(item.domainName), ...item }));
		const arr3 = Array.from(map.values());
		const key = datastore.key(["DomainSync", domainName]);
		const queries = await datastore.get(key);
		const entity = {
			key,
			data: {
				syncStatus: arr3,
				autoSync: queries[0].autoSync,
				driveAutoMove: queries[0].driveAutoMove
			},
			excludeFromIndexes: ["syncStatus[]"]
		};
		transaction.upsert(entity);
		await transaction.commit();

		// return modifiedSyncStatus
		return modifiedSyncStatus;
	} catch (err) {
		console.log("Transcation error: ", err);
		transaction.rollback();
		return "-1";
	}
}

async function getAllDomainsSyncStatus () {
	const query = datastore.createQuery("DomainSync")
		.select();
	let [tasks] = await datastore.runQuery(query);
	tasks = tasks.map((item) => {
		return { syncStatus: item?.syncStatus, name: item[datastore.KEY].name, autoSync: item?.autoSync, driveAutoMove: item?.driveAutoMove };
	});
	return tasks;
}

async function getUserCount (domainName, adminAcc) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/admin.directory.user.readonly"
		],
		adminAcc
	);

	const service = google.admin({ version: "directory_v1", auth });
	let nextPageToken = "";
	let count = 0;
	do {
		const usersRes = await service.users.list({
			// maxResults: 500,
			orderBy: "email",
			domain: domainName,
			showDeleted: false,
			pageToken: nextPageToken
		});
		count += usersRes.data.users.length;
		nextPageToken = usersRes?.data?.nextPageToken;
	} while (nextPageToken !== undefined);

	// Update Datastore
	const key = datastore.key(["Domain", domainName]);
	const queries = await datastore.get(key);
	const entity = {
		key,
		data: {
			...queries[0],
			userCount: count
		}
	};
	await datastore.upsert(entity);
}

async function getUserCountFromDatabase () {
	const query = datastore.createQuery("Domain").select(["userCount"]);
	const [tasks] = await datastore.runQuery(query);
	return tasks.map((task) => {
		return {
			name: task[datastore.KEY].name,
			value: task.userCount
		};
	});
}

async function getDomainUpdationArrayOfWorkspace (domainArray, contact, resource, domains1, prefix, date) {
	const updatedArray3 = [];

	await Promise.all(domainArray.map(async (val) => {
		const adminAcc = domains1.filter(value => value.domain === val)[0].email;
		const auth = getAuthToken(
			process.env.GOOGLE_EMAIL,
			process.env.GOOGLE_PRIVATE_KEY,
			[
				"https://www.googleapis.com/auth/calendar",
				"https://www.googleapis.com/auth/admin.directory.user.readonly",
				"https://www.googleapis.com/auth/admin.directory.resource.calendar",
				"https://www.googleapis.com/auth/contacts",
				"https://mail.google.com/",
				"https://www.googleapis.com/auth/gmail.metadata",
				"https://www.googleapis.com/auth/gmail.modify",
				"https://www.googleapis.com/auth/gmail.readonly",
				"https://www.google.com/m8/feeds",
				"https://www.googleapis.com/auth/admin.directory.domain",
				"https://www.googleapis.com/auth/admin.directory.domain.readonly"
			],
			adminAcc
		);
		const service = google.admin({ version: "directory_v1", auth });

		const { data: response } = await service.users.get({
			userKey: adminAcc
		});
		const customer = response.customerId;
		const { data: { domains: domainList } } = await service.domains.list({
			customer
		});

		// eslint-disable-next-line array-callback-return
		domainList.map((domain) => {
			updatedArray3.push({
				domainName: domain.domainName,
				...(contact) && { contact: prefix + date },
				...(!contact && !resource) && { calendar: prefix + date },
				...(!contact && resource) && { resource: prefix + date }
			});
		});
	}));
	return updatedArray3;
}

async function getParentDomainList (domainArray, domains) {
	let parentDomainList = [];

	await Promise.all(domainArray.map(async (val) => {
		const response = await getParentDomain(val, domains);
		parentDomainList.push(response);
	}));
	parentDomainList = parentDomainList.filter((value, index, array) => array.indexOf(value) === index);
	return parentDomainList;
}

async function getParentDomain (currentDomain, domains) {
	const adminAcc = domains.filter(value => value.domain === currentDomain)[0].email;
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/calendar",
			"https://www.googleapis.com/auth/admin.directory.user.readonly",
			"https://www.googleapis.com/auth/admin.directory.resource.calendar",
			"https://www.googleapis.com/auth/contacts",
			"https://mail.google.com/",
			"https://www.googleapis.com/auth/gmail.metadata",
			"https://www.googleapis.com/auth/gmail.modify",
			"https://www.googleapis.com/auth/gmail.readonly",
			"https://www.google.com/m8/feeds",
			"https://www.googleapis.com/auth/admin.directory.domain",
			"https://www.googleapis.com/auth/admin.directory.domain.readonly"
		],
		adminAcc
	);
	const service = google.admin({ version: "directory_v1", auth });

	const { data: response } = await service.users.get({
		userKey: adminAcc
	});
	const customer = response.customerId;
	const { data: { domains: domainList } } = await service.domains.list({
		customer
	});
	// console.log("domainList", domainList);
	const parentDomain = domainList.filter((item) => item.isPrimary)[0].domainName;
	return parentDomain;
}

async function getResourcesDatabseUpdationArray(domainName, domains) {
	const resourcesDatabseUpdationArray = []
	const parentDomainName = await getParentDomain(domainName,domains)
	const query = datastore.createQuery("DomainSync")
	const [tasks] = await datastore.runQuery(query);

	for(let i=0; i<tasks.length; i++) {
		let currentDomain = tasks[i][datastore.KEY].name
		const key = datastore.key(["Domain", currentDomain]);
		const queries = await datastore.get(key);

		if(queries[0].parentDomain === parentDomainName)
		resourcesDatabseUpdationArray.push(currentDomain)
	}
	return resourcesDatabseUpdationArray
}

module.exports = {
	isDelegationEnabled,
	searchDomains,
	addDomain,
	getAllDomains,
	getAllDomainsData,
	getDomainSyncStatus,
	updateDomainSyncStatus,
	addDomainSync,
	setLock,
	getAllDomainsSyncStatus,
	changeAutoSyncStatus,
	deleteDomainSyncStatus,
	getUserCount,
	getUserCountFromDatabase,
	isBucketPermissionAdded,
	getDomainUpdationArrayOfWorkspace,
	getParentDomainList,
	getResourcesDatabseUpdationArray
};
