/* eslint-disable brace-style */
const express = require("express");

const { errorHandler, logger } = require("../middleware/index.js");

const mailRouter = require("./mail/routes");

const calendarRouter = require("./calendar/routes");

const contactRouter = require("./contact/routes");

const authRouter = require("./auth/routes");

const domainRouter = require("./domain/routes");

const peopleRouter = require("./user/routes");

const driveRouter = require("./drive/routes");

const backupRouter = require("./backup/routes");

const progressesRouter = require("./progress/routes");

const backup = require("../api/backup/routes.js");
const { google } = require("googleapis");
// const schedule = require("node-schedule");

const { removeContact, getAllContactsForBackendOnly } = require("../util/contact/index.js");
const { exportToMatters, getAllDomains, getUserData, getUserCount, moveFilesForAllUsers, getDomainSyncStatus, getNewSuspendedUsers, reSyncAllDomains } = require("../util");
const { checkAuth } = require("../middleware/checkAuth");

const moment = require("moment");

// DataStore Setup
const { Datastore } = require("@google-cloud/datastore");
const { config, getAuthToken } = require("../config");
const datastore = new Datastore({
	projectId: config.GCLOUD_PROJECT,
	keyFilename: config.keyFile
});

// combine all the models here
const api = (apiConfig) => {
	const app = express();

	if (apiConfig.NODE_ENV === "development") {
		app.use(logger);
	}

	// TODO Use Cloud scheduler / app engine's cron when deployed on app engine
	// function nodeSchedule() {
	// schedule.scheduleJob(
	// `0 */${config.autoSyncTimeInterval} * * *`,
	// function (endTime) {
	// console.log("This Function ran at: ", endTime);
	// reSyncAllDomains(endTime.toISOString());
	// }
	// );
	// }

	// nodeSchedule();

	app.get("/removeSyncedContactsFromDomain/:adminAcc", async (req, res) => {
		// const organization = req.params.adminAcc.split("@")[1];
		const output = await getAllContactsForBackendOnly(req.params.adminAcc);
		output.map(async (item) => {
			await removeContact(item.email, req.params.adminAcc, item.url);
		}
		);
		// const primaryEmail = "sonam.nikam@dev.searce.me";
		// const adminAcc = "ojas@demo.searce.me";
		// const url = "https://www.google.com/m8/feeds/contacts/demo.searce.me/full/50054b3d0a653a9d/1676554609906497";
		// const output = await removeContact("item.email", req.params.adminAcc, url);
		res.send(output);
	});

	// Cronjob to check the length of inprogress exports in temp kind and take action accordingly
	app.get("/tempSearch20", async (req, res, next) => {
		try {
			// query to get the pending exports from Permanenet kind and sorting them acc to the created Time
			const PermQuery = datastore.createQuery("Export Permanent").order("createdTime");
			const [globalPermList] = await datastore.runQuery(PermQuery); // getting array of pending exports, ordered in created Time
			// console.log("Perm Exports list : ", globalPermList);

			const domains = await getAllDomains();

			for (const domain of domains) {
				const auth = getAuthToken(
					process.env.GOOGLE_EMAIL,
					process.env.GOOGLE_PRIVATE_KEY, [
						"https://www.googleapis.com/auth/ediscovery"
					],
					domain.email
				);
				// query to get the inProgress exports from Temp kind
				const tempQuery = datastore.createQuery("Export Temporary").filter("statusCode", "=", 2);
				const [tempExports] = await datastore.runQuery(tempQuery); // getting array of inProgress exports
				// console.log("temp Exports list : ", tempExports);

				const PermExports = globalPermList.filter((item) => {
					return item.statusCode === 0 && item.domain === domain.domain;
				});
				// console.log("Perm Exports list : ", domain.domain, PermExports)

				for (let i = 0; i < PermExports.length; i++) {
					if (JSON.parse(PermExports[i].params).scheduleStatus && JSON.parse(PermExports[i].params).scheduleDateTime > Date.now()) {
						PermExports.splice(i, 1);
						i--;
					}
				}
				// condition in which no.of Exports to be initiated is 1
				if ((PermExports.length === 1 && tempExports.length < 20) || (PermExports.length > 1 && tempExports.length === 19)) {
					// calling function to initiate export and update kinds, passing the 1st export of Permanent exports list obtained
					await backup.insertInTempAndUpdatePerm(PermExports[0], auth);
					console.log("1 export initiated");
				}

				// condition in which no. of Exports to be initiated is 2
				else if (PermExports.length > 1 && tempExports.length < 19) {
					// calling function 2 times simontaneously to initiate export and update kinds, passing the 1st and 2nd export of Permanent exports list obtained
					// 2 functions call will return 2 promise, running them parallely using Promise.all
					await Promise.all([backup.insertInTempAndUpdatePerm(PermExports[0], auth), backup.insertInTempAndUpdatePerm(PermExports[1], auth)]);
					console.log("2 exports initiated");
				}
			}

			console.log("completed");
			res.send("Completed");
		} catch (error) {
			next(error);
		}
	});

	// Cronjob which will check the status of inProgress exports in temp kind and take necessary actions if completed
	app.get("/tempCheckStatus", async (req, res, next) => {
		try {
			// const auth = await authenticatedClient(); //making auth token
			const domains = await getAllDomains();
			for (const domain of domains) {
				// console.log(domain);
				const auth = getAuthToken(
					process.env.GOOGLE_EMAIL,
					process.env.GOOGLE_PRIVATE_KEY,
					["https://www.googleapis.com/auth/ediscovery", "https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/devstorage.full_control"],
					domain.email
				);

				// query to get the inProgress exports from Temp kind
				const tempQuery = datastore.createQuery("Export Temporary").filter("statusCode", "=", 2);
				const [temp] = await datastore.runQuery(tempQuery); // getting array of inProgress exports
				// console.log(temp);
				const tempExports = temp.filter((item) => {
					return item.domain === domain.domain;
				});
				// console.log("tempExports: ", tempExports);
				// loop to go through all the inProgress exports retrieved
				for (let i = 0; i < tempExports.length; i++) {
					const exp = tempExports[i]; // particular export in the list
					// function to get the export status, passing the matterId and export Id from the retrieved export JSON
					const resp = await exportToMatters.checkExportJson(auth, exp.matterId, exp.exportId);

					// functionalities to do if the export status is completed
					if (resp.status === "COMPLETED") {
						console.log("Export Completed", exp.exportId);
						// numeric id of the export entity stored in database, will be used to update the entity in temp kind
						const databaseId = exp[datastore.KEY].id;
						exp.statusCode = 3; // modifying the export JSON, setting status code to moving, to be used for updating the entities
						exp.percentage = "90";
						// updating the export entity in temp kind, using the database id of that particular entity
						const tempKey = datastore.key(["Export Temporary", Number(databaseId)]);
						const tempEntityPush = {
							key: tempKey, // the key where to update the data
							data: exp // the new data to be updated
						};
						await datastore.update(tempEntityPush); // api to update the entity
						console.log("Temporary updated, status set to moving");
						// guery to get the particular export entity in permanent kind, using the export id filter
						const permQuery = datastore.createQuery("Export Permanent").filter("exportId", "=", exp.exportId);
						const [permExports] = await datastore.runQuery(permQuery); // getting the Permanent export entity for that exportId
						// numeric id of the Permanent export entity stored in database, will be used to update the entity in permanent kind
						const permDatabaseId = permExports[0][datastore.KEY].id;
						// updating the export entity in permanent kind, using the database id of that particular entity
						const permKey = datastore.key(["Export Permanent", Number(permDatabaseId)]);
						const permKeyPush = {
							key: permKey, // the key where to update the data
							data: exp // the new data to be updated
						};
						await datastore.update(permKeyPush); // api to update the entity
						console.log("Perm updated with percentage 90");

						// Export Related Code

						const exportFiles = resp.cloudStorageSink.files; // getting the export Files of completed export
						console.log("exportFiles: ", exportFiles, exp.name);
						const movingPromises = []; // declaring array of promises, for moving each file of export
						for (const file of exportFiles) {
							// promise to move a file ot the user bucket
							const movePromise = exportToMatters.exportMove(auth, JSON.parse(exp.params).accountEmail, exp.service, file);
							movingPromises.push(movePromise); // pushing promise to array
						}
						console.log("Moving promises created");

						// functionality when all the files get moved, or all promises are completed
						Promise.all(movingPromises).then(async () => {
							console.log("Promise Completed");
							exp.statusCode = 1; // modifying the export JSON, setting status code to completed, to be used for updating the permanend kind
							exp.completedTime = Date.now(); // setting the completed time to current time
							exp.percentage = "";
							const domainName = JSON.parse(exp.params).accountEmail.split("@")[1]; // domainName of user for whom export is created
							exp.cloudStorage = `https://console.cloud.google.com/storage/browser/${config.backupDestinationBucketName}/${domainName}/${JSON.parse(exp.params).accountEmail}/${exp.service}`; // setting the cloud storage link for view option
							console.log(exp.cloudStorage);

							// deleting the export entity in temp kind, using the database id of that particular entity
							const tempKey = datastore.key(["Export Temporary", Number(databaseId)]);
							await datastore.delete(tempKey); // api to delete the entity
							console.log("Temp entity deleted");

							const permKeyPush = {
								key: permKey, // the key where to update the data
								data: exp // the new data to be updated
							};
							await datastore.update(permKeyPush); // api to update the entity
							console.log("Perm updated with status set to completed");

							let length = 0;
							let isMatterCompleted = true; // setting the matter as completed, which would be set to false if any export is not completed
							// guery to get the list of export entity in permanent kind, using the matter id filter
							const permMatterQuery = datastore.createQuery("Export Permanent").filter("matterId", "=", exp.matterId);
							const [permMatterExports] = await datastore.runQuery(permMatterQuery); // getting the Permanent export entities for that matter Id
							// checking if all exports in this list has statusCode as completed

							for (const permMatterExport of permMatterExports) {
								if (permMatterExport.statusCode !== 1 && permMatterExport.statusCode !== 4) {
									isMatterCompleted = false; // if not 1, setting matter completed to false
								} else if (permMatterExport.statusCode === 1) {
									length = length + 1;
								}
							}
							if (length < 3) isMatterCompleted = false;
							// functionality if matter is indeed completed
							if (isMatterCompleted) {
								console.log("Matter is completed and can be closed");
								const resp = await exportToMatters.matterClose(auth, exp.matterId); // function to close the matter, passing the matterId
								console.log("matter closed");

								// guery to get the matter entity in Matter kind, using the matter id filter
								const matterQuery = datastore.createQuery("Matter").filter("matterId", "=", exp.matterId);
								const [matters] = await datastore.runQuery(matterQuery); // getting the matter entity for that matter Id
								matters[0].closedTime = Date.now(); // setting the completed time to current time
								matters[0].state = resp.data.matter.state; // setting the status of that matter to closed
								matters[0].cloudStorageFolder = `https://console.cloud.google.com/storage/browser/${config.backupDestinationBucketName}/${domainName}/${JSON.parse(exp.params).accountEmail}`; // setting the cloud storage folder link for view option
								console.log(matters[0].cloudStorageFolder);

								// numeric id of the matter entity stored in database, will be used to update the entity in Matter kind
								const matterDatabaseId = matters[0][datastore.KEY].id;
								// updating the matter entity in Matter kind, using the database id of that particular entity
								const matterKey = datastore.key(["Matter", Number(matterDatabaseId)]);
								const matterKeyPush = {
									key: matterKey, // the key where to update the data
									data: matters[0] // the new data to be updated
								};
								await datastore.update(matterKeyPush); // api to update the entity
								console.log("matter kind updated");
							}
						});
					}
					// nothing to do if the export is still in progress
					else if (resp.status === "IN_PROGRESS") {
						console.log("IN_PROGRESS", exp.exportId);

						// calcultae percentage of the in progress exports
						const total = resp.stats.totalArtifactCount;
						const completed = resp.stats.exportedArtifactCount;
						const remaining = (completed * 90) / total;
						// formating percent
						let percentage = remaining.toFixed(2);
						if (isNaN(percentage)) { percentage = 0; };

						// numeric id of the export entity stored in database, will be used to update the entity in temp kind
						const databaseId = exp[datastore.KEY].id;
						exp.percentage = percentage.toString();
						// updating the export entity in temp kind, using the database id of that particular entity
						const tempKey = datastore.key(["Export Temporary", Number(databaseId)]);
						const tempEntityPush = {
							key: tempKey, // the key where to update the data
							data: exp // the new data to be updated
						};
						await datastore.update(tempEntityPush); // api to update the entity
						console.log("Temporary updated with latest percentage");
						// guery to get the particular export entity in permanent kind, using the export id filter
						const permQuery = datastore.createQuery("Export Permanent").filter("exportId", "=", exp.exportId);
						const [permExports] = await datastore.runQuery(permQuery); // getting the Permanent export entity for that exportId
						// numeric id of the Permanent export entity stored in database, will be used to update the entity in permanent kind
						const permDatabaseId = permExports[0][datastore.KEY].id;
						// updating the export entity in permanent kind, using the database id of that particular entity
						const permKey = datastore.key(["Export Permanent", Number(permDatabaseId)]);
						const permKeyPush = {
							key: permKey, // the key where to update the data
							data: exp // the new data to be updated
						};
						await datastore.update(permKeyPush); // api to update the entity
						console.log("Perm updated with latest percentage");
					}
				}
			}

			res.send("Completed");
		} catch (error) {
			next(error);
		}
	});

	// Cronjob to get the user count of all the domains
	app.get("/getUserCountForAllDomains", async (req, res, next) => {
		try {
			const domains = await getAllDomains();
			const promises = domains.map((domain) => {
				return getUserCount(domain.domain, domain.email);
			});
			await Promise.all(promises);
			res.send("User Count Updated!!!");
		} catch (err) {
			next(err);
		}
	});

	// Cron job to move files for all the user of all the domains to shared drive
	app.get("/moveFilesForAllUsers", async (req, res, next) => {
		try {
			const domainArr = await getAllDomains();

			for (const domain of domainArr) {
				const { driveAutoMove } = await getDomainSyncStatus(domain.domain);
				if (driveAutoMove.value) {
					// eslint-disable-next-line no-unused-vars
					const response = await moveFilesForAllUsers(domain.domain, domain.email, driveAutoMove);
					// console.log("users", response);
				}
			}
			res.send("initiated drive backup");
		} catch (err) {
			next(err);
		}
	});

	// Cron job to initiate backup for sudpended user in last 24 hours
	app.get("/initiateBackupForSuspendedUser", async (req, res, next) => {
		const endTime = new Date();
		const startTime = new Date(endTime - (3600 * 1000 * config.suspendedUserBackupTimeInterval));
		const domainArr = await getAllDomains();
		for (const domain of domainArr) {
			// get suspended users
			const users = await getNewSuspendedUsers(domain.email, "SUSPEND_USER", startTime, endTime, domain.domain);

			const ownerEmail = domain.email;
			console.log("users", domain.domain, users);
			const services = {};
			config.services.forEach(service => {
				services[service.name] = service;
			});
			for (const user of users) {
				const params = {
					accountEmail: user.email,
					services,
					ownerEmail,
					creationTime: moment().unix(),
					name: `${user.email}'s backup`,
					description: `${user.email}'s backup created by ${ownerEmail}`,
					bucketDetails: `${user.email}'s backup created by ${ownerEmail}`
				};

				const auth = getAuthToken(
					process.env.GOOGLE_EMAIL,
					process.env.GOOGLE_PRIVATE_KEY,
					["https://www.googleapis.com/auth/ediscovery", "https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/devstorage.full_control"],
					ownerEmail
				);

				// Check whether matter already exist or not
				const matterQuery = datastore.createQuery("Matter").filter("userEmail", "=", user.email); // query to get all entities of Matter kind
				const [Matters] = await datastore.runQuery(matterQuery); // getting list of all matter entities
				// console.log("matter", Matters);
				let matterRes = "";

				if (Matters.length === 0) {
					// calling to the matter creation function from object file
					matterRes = await exportToMatters.makeVaultMatter(auth, params.name, params.description);
					matterRes = matterRes.data;

					// creating matter json to be pushed on the db
					const matterJson = {
						matterId: matterRes.matterId,
						name: params.name,
						state: matterRes.state,
						adminEmail: params.ownerEmail,
						userEmail: params.accountEmail,
						createdTime: params.creationTime,
						closedTime: 0,
						cloudStorageFolder: params.bucketDetails
					};
					// making matter key in datastore to be pushed in entity
					const matterKey = datastore.key("Matter");
					// wait for the insert to be completed
					await datastore.insert({
						key: matterKey, // key from matter
						data: matterJson // json object to push
					});
				} else {
					matterRes = Matters[0];
				}
				// creating export json to be pushed on the db
				const exportJsonFormat = {
					matterId: matterRes.matterId,
					exportId: "",
					service: "",
					params: "",
					createdTime: params.creationTime,
					completedTime: 0,
					initiatedTime: 0,
					statusCode: 0,
					cloudStorage: "",
					percentage: "",
					adminEmail: ownerEmail,
					domain: domain.domain
				};

				// list to iterate json
				const exportJsons = [];

				// making export key in datastore to be pushed in entity
				const exportKey = datastore.key("Export Permanent");

				// looping on the service object
				for (const service in params.services) {
					// making a copy of json object and adding
					const newExportJsonFormat = Object.assign({}, exportJsonFormat);
					// assigning changed field
					newExportJsonFormat.service = service;

					// making a copy of json object for permanent storage and adding the changed fields
					const newParamsObject = Object.assign({}, params);
					delete newParamsObject.services;
					newParamsObject.serviceParams = service;
					// parsing the params to put as string in the json
					newExportJsonFormat.params = JSON.stringify(newParamsObject);

					// pushing new json into list to
					exportJsons.push({
						key: exportKey, // export key
						data: newExportJsonFormat // export json object
					});
				}
				// pushing list of exports to the datastore
				await datastore.insert(exportJsons);
			}
		}
		res.send("Suspender user added into database");
	});

	const fs = require("fs");
	app.get("/getAllContacts", async (req, res, next) => {
		console.log("Inside route");
		try {
			const domainArr = await getAllDomains();
			console.log("domain", domainArr);
			for (const domain of domainArr) {
				// console.log("domain", domain.domain);
				const auth = getAuthToken(
					process.env.GOOGLE_EMAIL,
					process.env.GOOGLE_PRIVATE_KEY,
					[
						"https://www.google.com/m8/feeds",
						"https://www.googleapis.com/auth/directory.readonly"
					],
					domain.email
				);
				const users = [];
				const service = google.people({ version: "v1", auth });
				let nextPageToken = "";
				// Get all users
				do {
					const { data } = await service.people.listDirectoryPeople({
						pageSize: 1000, // Adjust the page size as needed
						readMask: "addresses,ageRanges,biographies,birthdays,calendarUrls,clientData,coverPhotos,emailAddresses,events,externalIds,genders,imClients,interests,locales,locations,memberships,metadata,miscKeywords,names,nicknames,occupations,organizations,phoneNumbers,photos,relations,sipAddresses,skills,urls,userDefined", // Specify the fields to retrieve
						sources: ["DIRECTORY_SOURCE_TYPE_DOMAIN_CONTACT"],
						pageToken: nextPageToken

					});

					const people = data?.people;
					if (Array.isArray(people)) {
						people.forEach((item) => {
							// if (item?.emailAddresses) {
							// users.push(item.emailAddresses[0].value)
							// }
							users.push(item);
						});
					}

					nextPageToken = data?.nextPageToken;
				} while (nextPageToken !== undefined);
				console.log("domain", domain.domain);
				console.log("users", users.length);
				const jsonContent = {
					domain: domain.domain,
					totalContact: users.length,
					userEmails: users
				};
				fs.writeFileSync(`./contactData/${domain.domain}.json`, JSON.stringify(jsonContent), "utf8", function (err) {
					console.log("Hello");
					if (err) {
						console.log("An error occured while writing JSON Object to File.");
						console.log(err);
						// return console.log(err);
					}
					console.log("JSON file has been saved.");
				});
			}
			// for (const domainItem of domainArr) {
			// let contactsSynced = await getAllContactEmails(domainItem.email, domainItem.domain, currDomain);
			// }
		} catch (error) {
			console.log(error);
		}

		// res.send("Completed");
	});
	app.get("/test", async (req, res) => {
		const userData = await getUserData("ant1.man@dev.searce.me");
		console.log("userdata", userData);

		res.send("Done test");
	});

	app.use("/", checkAuth);
	app.use("/mail", mailRouter);
	app.use("/calendar", calendarRouter);
	app.use("/contact", contactRouter);
	app.use("/auth", authRouter);
	app.use("/domain", domainRouter);
	app.use("/people", peopleRouter);
	app.use("/drive", driveRouter);
	app.use("/progress", progressesRouter);
	app.use("/backup", backupRouter.router);

	app.get("/autoSync", (req, res) => {
		reSyncAllDomains(new Date());
		console.log("Auto Synced Called");
		res.send("Auto Sync");
	});

	app.use(errorHandler);

	return app;
};

module.exports = {
	api
};
