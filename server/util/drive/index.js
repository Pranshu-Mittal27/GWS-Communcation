/* eslint-disable no-unused-vars */
const uuid = require("uuid");
const { getAuthToken, config } = require("../../config");
const { google } = require("googleapis");
const { getAllDomains } = require("../../util/domain");
const { getUserSyncData } = require("../../util/user");

// DataStore Setup

const { Datastore } = require("@google-cloud/datastore");
const datastore = new Datastore({
	projectId: config.GCLOUD_PROJECT,
	keyFilename: config.keyFile
});

// Get all files (not folders) stored in user's drive
/* async function getAllFiles (service) {
	let files = [];
	let nextPageToken = "";

	do {
		const res = await service.files.list({
			pageToken: nextPageToken,
			fields: "files(id, parents)",
			q: "mimeType != 'application/vnd.google-apps.folder' and trashed = false and 'me' in owners"
		});
		nextPageToken = res.data?.nextPageToken;
		files.push(...res.data.files);
	} while (nextPageToken !== undefined);

	// Create a comma separated string of parent ids
	files = files.map((val) => {
		return {
			...val,
			parents: val?.parents?.join(",") || ""
		};
	});
	console.log("Files are: ", files);
	return files;
} */

// Get all files including folders inside a parent
async function getAllFilesInParent (service, parent) {
	let files = [];
	let nextPageToken = "";

	do {
		const res = await service.files.list({
			pageToken: nextPageToken,
			fields: "files(id, parents, mimeType, name)",
			q: `trashed = false and 'me' in owners and '${parent}' in parents`
		});
		nextPageToken = res.data?.nextPageToken;
		files.push(...res.data.files);
	} while (nextPageToken !== undefined);

	// Create a comma separated string of parent ids
	files = files.map((val) => {
		return {
			...val,
			parents: val?.parents?.join(",") || ""
		};
	});
	console.log("Files are: ", files);
	return files;
}

// To create a folder with folderName inside parent
async function createFolder (service, folderName, parent) {
	const fileMetadata = {
		name: folderName,
		mimeType: "application/vnd.google-apps.folder",
		parents: [parent]
	};
	const file = await service.files.create({
		resource: fileMetadata,
		fields: "id",
		supportsAllDrives: true
	});
	console.log("Shared Folder ID: ", file.data.id);

	return file.data.id;
}

async function getFolderInsideParent (service, folderName, parent) {
	const res = await service.files.list({
		q: `name = '${folderName}' and '${parent}' in parents and trashed = false`,
		supportsAllDrives: true,
		includeItemsFromAllDrives: true,
		fields: "files(id)"
	});
	const file = res.data.files[0]?.id;
	if (file === undefined) {
		console.log("Creating Folder: ", folderName);
		return createFolder(service, folderName, parent);
	}
	console.log("Folder exists: ", folderName, file);
	return file;
}

// Create a shared drive and make userEmail content manager
async function createSharedDrive (userEmail) {
	const domain = userEmail.split("@")[1];
	const domains = await getAllDomains();
	const adminAcc = domains.filter(val => val.domain === domain)[0].email;
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/drive"
		],
		adminAcc
	);

	const service = google.drive({ version: "v3", auth });
	// Create a shared drive
	try {
		const driveMetadata = {
			name: userEmail
		};
		const requestId = uuid.v4();
		const drive = await service.drives.create({
			requestId,
			resource: driveMetadata,
			fields: "id"
		});
		console.log("Drive created with id: ", drive.data.id);

		// Add user as a content manager in the shared drive
		const permission = {
			type: "user",
			role: "fileOrganizer",
			emailAddress: userEmail
		};
		await service.permissions.create({
			fileId: drive.data.id,
			resource: permission,
			supportsAllDrives: true
		});
		return drive.data.id;
	} catch (err) {
		console.log("Error while creating and sharing shared drive: ", err);
		return -1;
	}
}

// Get user's shared drive
async function getSharedDrive (service, userEmail) {
	const response = await service.drives.list({
		q: `name = '${userEmail}'`
	});
	let driveId = response.data.drives[0]?.id;

	// Create a shared drive if drive ID doesn't exists
	if (driveId === undefined) {
		driveId = await createSharedDrive(userEmail);
	}

	return driveId;
}

// Move files to new parent
async function moveFile (service, file, newParent) {
	try {
		const files = await service.files.update({
			fileId: file.id,
			addParents: newParent,
			removeParents: file.parents,
			fields: "id, parents",
			supportsAllDrives: true
		});
		console.log("File moved: ", file.id, files.status);
		return files.status;
	} catch (err) {
		console.log("Error: ", err);
	}
}

async function bfsDrive (service, oldParent, newParent) {
	const filesAndFolders = await getAllFilesInParent(service, oldParent);
	filesAndFolders.forEach(async (file) => {
		// Call bfs for each folder
		if (file.mimeType === "application/vnd.google-apps.folder") {
			const newFolderId = await getFolderInsideParent(service, file.name, newParent);
			bfsDrive(service, file.id, newFolderId);
		} else {
			moveFile(service, file, newParent);
		}
	});
}

// Maintain folder structure
async function moveFilesForUser (userEmail) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/drive"
		],
		userEmail
	);

	const service = google.drive({ version: "v3", auth });

	// Get shared drive id
	const sharedDrive = await getSharedDrive(service, userEmail);
	if (sharedDrive === -1) return;

	bfsDrive(service, "root", sharedDrive);

	return "Moving Files...";
}

async function moveFilesForAllUsers (domainName, adminAcc, domainSyncStatus) {
	// Get all users
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
	const service = google.admin({ version: "directory_v1", auth });
	const users = [];
	let nextPageToken = "";
	// Get all users
	do {
		const usersRes = await service.users.list({
			orderBy: "email",
			domain: domainName,
			showDeleted: false,
			pageToken: nextPageToken,
			fields: "users(primaryEmail)"
		});
		users.push(...usersRes.data.users);
		nextPageToken = usersRes.data?.nextPageToken;
	} while (nextPageToken !== undefined);

	function mapAsync (array) {
		return Promise.all(array.map(async (item) => {
			const userSyncData = await getUserSyncData(item.primaryEmail);
			return userSyncData === undefined ? true : (domainSyncStatus.timeStamp < userSyncData.driveAutoMove.timeStamp ? userSyncData.driveAutoMove.value : true);
		}));
	}

	async function filterAsync (array) {
		const filterMap = await mapAsync(array);
		return array.filter((value, index) => filterMap[index]);
	}

	const filteredUser = await filterAsync(users);
	filteredUser.forEach(val => moveFilesForUser(val.primaryEmail));
	return filteredUser;
	// run the function for each user
	// TODO remove filter for production
	// users.filter(val => val.primaryEmail === "ojas@dev.searce.me" || val.primaryEmail === "john.doe@dev.searce.me" || val.primaryEmail === "iron.man@dev.searce.me" || val.primaryEmail === "tony.stark@dev.searce.me").forEach(val => moveFilesForUser(val.primaryEmail));
	// return users;
}

module.exports = {
	moveFilesForUser,
	moveFilesForAllUsers
};
