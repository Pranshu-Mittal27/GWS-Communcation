/* eslint-disable no-tabs */
/* eslint-disable no-undef */
const { getAuthToken } = require("./auth");

const path = require("path");

const config = {
	PORT: process.env.PORT || 4000,
	ORIGIN_URL: process.env.ORIGIN_URL || "http://localhost:3000",
	NODE_ENV: process.env.NODE_ENV || "development",
	GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
	keyFile: path.resolve("./apiKey.json"),
	autoSyncTimeInterval: 24,
	suspendedUserBackupTimeInterval: 24,
	backupDestinationBucketName: "destination-bucket",
	services: [
		{
			name: "gmail",
			// "startDate":date,
			// "endDate":date,
			includeDraft: true,
			onlySentMail: false
		},
		{
			name: "drive",
			// "startDate":date,
			// "endDate":date,
			includeSharedDrive: true
		},
		{
			name: "groups",
			// "startDate": date,
			// "endDate":date,
			includeDraft: true,
			onlySentMail: false
		},
		{
			name: "chat",
			// "startDate":date,
			// "endDate":date,
			includChatSpace: true
		}
	],
	calendarThrottle: 3,
	contactThrottle: 2,
	resourceThrottle: 3,
};

module.exports = {
	config,
	getAuthToken
};
