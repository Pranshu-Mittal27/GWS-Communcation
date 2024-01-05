/* eslint-disable brace-style */
/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const { getAuthToken, config } = require("../../config");
const { google } = require("googleapis");
const { getAuth } = require("firebase-admin/auth");
const { Datastore } = require("@google-cloud/datastore");
const { getAllDomains, getDomainSyncStatus } = require("../domain");
// const { getDomainFromEmail } = require("../index");

const getDomainFromEmail = (email) => {
	return email.split("@")[1];
};

const datastore = new Datastore({
	projectId: config.GCLOUD_PROJECT,
	keyFilename: config.keyFile
});

async function searchUsers (email, query, domain) {
	try {
		const auth = getAuthToken(
			process.env.GOOGLE_EMAIL,
			process.env.GOOGLE_PRIVATE_KEY,
			[
				"https://www.googleapis.com/auth/directory.readonly"
			],
			email
		);
		const service = google.people({ version: "v1", auth });
		const response = await service.people.searchDirectoryPeople({
			readMask: "names,photos,emailAddresses",
			sources: "DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE",
			query,
			fields: "people(names/displayName,photos/url,emailAddresses/value)",
			pageSize: 15
		});
		if (!response.data?.people) {
			return [];
		}
		const users = response.data.people.map((user) => {
			return {
				name: user?.names?.[0]?.displayName,
				photo: user?.photos?.[0]?.url,
				email: user?.emailAddresses?.[0]?.value
			};
		}).filter((user) => {
			return getDomainFromEmail(user.email) === domain;
		});
		return users;
	}

	catch (e) {
		console.log("Problem with domain: ", domain);
		console.log("error search users: ", e.errors[0].message);
		return [];
	}
}

// TODO - Redundant - written by Ravi in auth - bring it here
async function getUserData (userEmail) {
	const key = datastore.key(["User", userEmail]);
	const [tasks] = await datastore.get(key);
	return tasks;
}

async function createUser (email) {
	let fbDisabled;

	// check if the user is disabled in firebase
	const auth = getAuth();
	try {
		const userRecord = await auth.getUserByEmail(email);
		fbDisabled = userRecord.disabled;
	} catch (err) {
		fbDisabled = false;
	}

	const currDomain = email.split("@")[1];
	const domainsArr = await getAllDomains();
	const adminAcc = domainsArr.filter(val => val.domain === currDomain)[0].email;
	const auth2 = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/admin.directory.user.readonly"
		],
		adminAcc
	);
	const service = google.admin({ version: "directory_v1", auth: auth2 });
	const { data: user } = await service.users.get({
		userKey: email,
		fields: "creationTime"
	});

	// insert the user into the datastore kind User
	// with role user by default and disabled = false
	const key = datastore.key(["User", email]);
	const entity = {
		key,
		data: {
			role: "user",
			disabled: false || fbDisabled,
			creationTime: user.creationTime
		}
	};
	await datastore.save(entity);
	return {
		email,
		role: "user",
		disabled: false || fbDisabled,
		creationTime: user.creationTime
	};
}

async function getUserSyncData (userEmail) {
	const key = datastore.key(["UserSync", userEmail]);
	const queries = await datastore.get(key);
	return queries[0];
}

async function getUserSyncStatus (userEmail) {
	const key = datastore.key(["UserSync", userEmail]);
	const queries = await datastore.get(key);
	return queries[0]?.syncStatus;
}

async function getUserDriveAutoMoveStatus (userEmail) {
	const key = datastore.key(["UserSync", userEmail]);
	const queries = await datastore.get(key);
	return queries[0]?.driveAutoMove;
}

async function createUserSync (userEmail) {
	const userSyncStatus = await getUserSyncStatus(userEmail);
	const domainSyncStatus = await getDomainSyncStatus(userEmail.split("@")[1]);

	// if user does not exist in userSync kind
	if (userSyncStatus !== undefined && Array.isArray(userSyncStatus) && (userSyncStatus.length > 0)) {
		return "user already exist in userSync kind";
	} else {
		const key = datastore.key(["UserSync", userEmail]);
		const entity = {
			key,
			data: {
				driveAutoMove: { value: domainSyncStatus.driveAutoMove.value, timeStamp: new Date().toISOString() }
			},
			excludeFromIndexes: ["syncStatus[]"]
		};
		const res = await datastore.upsert(entity);
		return res;
	}
}

async function updateUserSyncStatus (userEmail, syncStatus, driveAutoMove) {
	const userSyncStatus = await getUserSyncData(userEmail);
	// If userSync status is not empty
	if (userSyncStatus?.syncStatus !== undefined && Array.isArray(userSyncStatus?.syncStatus) && (userSyncStatus?.syncStatus.length > 0)) {
		let arr3 = [];
		// when inserting calendar or contact list in userSync kind
		const map = new Map();
		userSyncStatus?.syncStatus.forEach(item => map.set(item.domainName, item));
		syncStatus.forEach(item => map.set(item.domainName, { ...map.get(item.domainName), ...item }));
		arr3 = Array.from(map.values());

		const key = datastore.key(["UserSync", userEmail]);

		const entity = {
			key,
			data: {
				syncStatus: arr3,
				driveAutoMove
			},
			excludeFromIndexes: ["syncStatus[]"]
		};
		const res = await datastore.upsert(entity);
		return res;
	}
	// when userSync status is empty
	else {
		let res = "";
		const key = datastore.key(["UserSync", userEmail]);
		const entity = {
			key,
			data: {
				syncStatus,
				driveAutoMove
			},
			excludeFromIndexes: ["syncStatus[]"]
		};
		res = await datastore.upsert(entity);
		console.log("data updated");

		return res;
	}
}

async function getAllUserTypeCount () {
	const query = datastore.createQuery("User").select(["role"]);
	const [tasks] = await datastore.runQuery(query);
	const entires = tasks.reduce((accumlatedValue, currentValue) => {
		const role = currentValue.role;
		return {
			...accumlatedValue,
			[role]: accumlatedValue[role] === undefined ? 1 : (accumlatedValue[role] + 1)
		};
	}, {});
	const output = [];
	for (const key of Object.keys(entires)) {
		output.push({
			name: key,
			data: entires[key]
		});
	}
	return output;
};

async function getAllUserDisabled () {
	const query = datastore.createQuery("User").select(["disabled"]);
	const [tasks] = await datastore.runQuery(query);
	const entires = tasks.reduce((accumlatedValue, currentValue) => {
		const disabled = currentValue.disabled;
		return {
			disabled: disabled ? (accumlatedValue.disabled + 1) : accumlatedValue.disabled,
			enabled: disabled ? accumlatedValue.enabled : (accumlatedValue.enabled + 1)
		};
	}, {
		disabled: 0,
		enabled: 0
	});
	const output = [
		{
			name: "disabled",
			value: entires.disabled
		},
		{
			name: "enabled",
			value: entires.enabled
		}
	];

	return output;
}

module.exports = {
	searchUsers,
	getUserData,
	getUserSyncStatus,
	getUserDriveAutoMoveStatus,
	createUserSync,
	getUserSyncData,
	updateUserSyncStatus,
	getAllUserTypeCount,
	getAllUserDisabled,
	createUser
};
