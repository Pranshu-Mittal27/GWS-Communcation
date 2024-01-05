/* eslint-disable no-tabs */
/* eslint-disable eqeqeq */
const { google } = require("googleapis"); // google api library to be used in app
const { config } = require("../../config");

// Object of function which will perform operations on Vault.
module.exports = {
	gmail: (auth, matterId, params) => {
		// make vault object to use exports
		const vault = google.vault({ version: "v1", auth });
		// using exports from matters and create an export from the api
		return vault.matters.exports.create({
			// matter id in which export occures
			matterId,
			// request body having other params
			requestBody: {
				// name of the current export must be simple string
				name: params.name + "_mail",
				// search query which can be used to find data
				query: {
					terms: params.serviceParams.onlySentMail == "true" ? `from:${params.accountEmail}` : "", // filter on the mail and find one sent by specific user
					corpus: "MAIL", // type of the service drive,mail
					mailOptions: { // mailOptions which has exclude draft in email as boolean
						excludeDrafts: !(params.serviceParams.includeDraft)
					},
					dataScope: "ALL_DATA", // range of data can be alldata,helddata,unprotected
					searchMethod: "ACCOUNT", // this differs from account,orgunit,room,shareddrive,entireorg
					...(params.serviceParams.startDate !== "") && {startTime: params.serviceParams.startDate},
					...(params.serviceParams.endDate !== "") && {endTime: params.serviceParams.endDate},
					accountInfo: {
						// list of the emails to be passed.
						emails: [params.accountEmail]
					}
				},
				// export option which has details about the specific export and how it should be stored
				exportOptions: {
					// region to be define it can be any,us,europe
					region: "ANY",
					// mail options which has param of following
					mailOptions: {
						exportFormat: "MBOX", // mbox,pst
						useNewExport: false, // boolean value of new export type to be used
						showConfidentialModeContent: false // show or hide confidential content
					}
				}
			}
		});
	},
	drive: (auth, matterId, params) => {
		// console.log("params", params);
		// make vault object to use exports
		const vault = google.vault({ version: "v1", auth });
		// using exports from matters and create an export from the api
		return vault.matters.exports.create({
			// matter id in which export occures
			matterId,
			// request body having other params
			requestBody: {
				// name of the current export must be simple string
				name: params.name + "_drive",
				// search query which can be used to find data
				query: {
					corpus: "DRIVE", // type of the service drive,mail
					driveOptions: {
						includeTeamDrives: true, // boolean for inclusion of team drive
						includeSharedDrives: params.serviceParams.includeSharedDrive, // boolean for inclusion of shared drive
					},
					dataScope: "ALL_DATA", // range of data can be alldata,helddata,unprotected
					searchMethod: "ACCOUNT", // this differs from account,orgunit,room,shareddrive,entireorg
					...(params.serviceParams.startDate !== "") && {startTime: params.serviceParams.startDate},
					...(params.serviceParams.endDate !== "") && {endTime: params.serviceParams.endDate},
					accountInfo: {
						// list of the emails to be passed.
						emails: [params.accountEmail]
					}
				},
				// export option which has details about the specific export and how it should be stored
				exportOptions: {
					// region to be define it can be any,us,europe
					region: "ANY",
					// mail options which has param of following
					driveOptions: {
						includeAccessInfo: true
					}
				}
			}
		});
		// log the response from the api
		// console.log(res);
	},
	chat: (auth, matterId, params) => {
		// calling vault services, passing the authentication created and with version v1
		const vault = google.vault({ version: "v1", auth });
		// calling the create method on a matter export, i.e, for the given matter, creating a new export
		return vault.matters.exports.create({
			// matter on which we have to create export, by matterid
			matterId,
			resource: {
				// the name of export that we have to keep
				name: params.name + "_chat",
				query: {
					// the type of export we want, i.e, the GWS for which we want the export for
					// currently want chat export
					corpus: "HANGOUTS_CHAT",
					// the scope of data we want in export, i.e, whether we want all data, held data or retention data
					dataScope: "ALL_DATA",
					// what type of search should export do to fetch data, i.e, passing account or organization
					searchMethod: "ACCOUNT",
					// the account info for which we want the data for
					...(params.serviceParams.startDate !== "") && {startTime: params.serviceParams.startDate},
					...(params.serviceParams.endDate !== "") && {endTime: params.serviceParams.endDate},
					accountInfo: {
						emails: [
							// email of user
							params.accountEmail
						]
					},
					hangoutsChatOptions: {
						includeRooms: params.serviceParams.includeChatSpace
					}
				},
				exportOptions: {
					// region to be define it can be any,us,europe
					region: "ANY",
					// mail options which has param of following
					hangoutsChatOptions: {
						exportFormat: "PST"
					}
				}
			}
		});
		// console.log(chatRes);
	},
	group: (auth, matterId, params) => {
		// calling vault services, passing the authentication created and with version v1
		const vault = google.vault({ version: "v1", auth });
		// calling the create method on a matter export, i.e, for the given matter, creating a new export
		return vault.matters.exports.create({
			// matter on which we have to create export, by matterid
			matterId,
			resource: {
				// the name of export that we have to keep
				name: params.name + "_groups",
				query: {
					terms: params.serviceParams.onlySentMail == "true" ? `from:${params.accountEmail}` : "", // filter on the mail and find one sent by specific user
					// the type of export we want, i.e, the GWS for which we want the export for
					// currently want chat export
					corpus: "GROUPS",
					// the scope of data we want in export, i.e, whether we want all data, held data or retention data
					mailOptions: { // mailOptions which has exclude draft in email as boolean
						excludeDrafts: !(params.serviceParams.includeDraft)
					},
					dataScope: "ALL_DATA",
					// what type of search should export do to fetch data, i.e, passing account or organization
					searchMethod: "ACCOUNT",
					// the account info for which we want the data for
					...(params.serviceParams.startDate !== "") && {startTime: params.serviceParams.startDate},
					...(params.serviceParams.endDate !== "") && {endTime: params.serviceParams.endDate},
					accountInfo: {
						emails: [
							// email of user
							params.serviceParams.groupEmail
						]
					}
				},
				exportOptions: {
					// region to be define it can be any,us,europe
					region: "ANY",
					// mail options which has param of following
					groupsOptions: {
						exportFormat: "PST"
					}
				}
			}
		});
		// console.log(groupRes)
	},
	checkExportJson: async (auth, matterId, exportId) => {
		// calling vault services, passing the authentication created and with version v1
		const vault = google.vault({ version: "v1", auth });
		// make list export api call with matter id
		const res = await vault.matters.exports.get({
			matterId,
			exportId
		});

		return res.data;
	},
	makeVaultMatter: async (auth, matterName, matterDesc) => {
		// function to create matter in the valut
		const vault = google.vault({ version: "v1", auth });
		// required params to call the create valut method with name

		const res = await vault.matters.create({
			requestBody: {
				name: matterName,
				description: matterDesc
			}
		});
		// console.log("res", res);
		return res;
	},
	matterClose: (auth, matterId) => {
		// making auth for vault
		const vault = google.vault({ version: "v1", auth });
		// method to close the vault matter.
		return vault.matters.close({
			matterId
		});
	},
	exportMove: async (auth, userEmail, serviceName, BucketJson) => {
		const fileName = BucketJson.objectName.split("/")[2];
		const domainName = userEmail.split("@")[1]; // domainName of user for whom export is created
		console.log(fileName + " " + domainName + " " + userEmail + " " + serviceName);

		const destinationObject = `${domainName}/${userEmail}/${serviceName}/${fileName}`;
		console.log(destinationObject);

		const storage = google.storage({ version: "v1", auth });
		let rewriteToken = "";
		do {
			const res = rewriteToken !== ""
				? await storage.objects.rewrite({
					sourceBucket: BucketJson.bucketName,
					sourceObject: BucketJson.objectName,
					destinationBucket: config.backupDestinationBucketName,
					destinationObject,
					maxBytesRewrittenPerCall: 6962544640,
					rewriteToken
				})
				: await storage.objects.rewrite({
					sourceBucket: BucketJson.bucketName,
					sourceObject: BucketJson.objectName,
					destinationBucket: config.backupDestinationBucketName,
					maxBytesRewrittenPerCall: 6962544640,
					destinationObject
				});
			console.log("resData: ", res.data);
			rewriteToken = res.data?.rewriteToken;
			// console.log("rewriteToken: ", rewriteToken);
		} while (rewriteToken !== undefined);

		// storage.objects.copy({
		// 	sourceBucket: BucketJson.bucketName,
		// 	sourceObject: BucketJson.objectName,
		// 	destinationBucket: config.backupDestinationBucketName,
		// 	destinationObject,
		// 	resource: {}
		// });
	},
	backupDelete: async (auth, viewLink, matterName) => {
		const bucketName = viewLink.split("/")[5];
		const serviceLink = viewLink.split("/")[6] + viewLink.split("/")[7] + viewLink.split("/")[8];
		const matterNameArray = matterName.split(" ");
		let isDeletable = true;

		const storage = google.storage({ version: "v1", auth });
		const res = await storage.objects.list({
			bucket: bucketName
		});

		for (const item of res.data.items) {
			if ((serviceLink == (item.name.split("/")[0] + item.name.split("/")[1] + item.name.split("/")[2]))) {
				for (let i = 0; i < matterNameArray.length; i++) {
					if (matterNameArray[i] != item.name.split("/")[3].split("_")[i]) { isDeletable = false; };
				}
				if (isDeletable) {
					storage.objects.delete({
						object: item.name,
						bucket: bucketName
					});
				}
			}
		}
	}
};
