/* eslint-disable no-tabs */
/* eslint-disable brace-style */
// importing required libraries, datastore for db connection, firebase for checking authentication, zod for checking req parameters
const { Router } = require("express");
const moment = require("moment");
const { google } = require("googleapis");
const { z } = require("zod");
const { Datastore } = require("@google-cloud/datastore");
const path = require("path");
const { getAuth } = require("firebase-admin/auth");

// importing functions from index file of config and util
const { getAuthToken, config } = require("../../config");
const { exportToMatters, getDomainFromEmail } = require("../../util");

// get the database object using GCP project and service account creds
const datastore = new Datastore({
	projectId: config.GCLOUD_PROJECT,
	keyFilename: config.keyFile
});

// scopes required for making vault api calls
const SCOPES = ["https://www.googleapis.com/auth/ediscovery", "https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/devstorage.full_control"];
const router = Router();

// route to initiate an export.
router.post("/initiate", async (req, res, next) => {
	try {
		// getting authentication from Firebase first.
		const idToken = req.get("Authorization") || "";
		const decodedToken = await getAuth().verifyIdToken(idToken);
		console.log("email", decodedToken.email);

		// checking if the request object sent has the correct form of data passed.
		// account email should be a string and email type.
		// services should be either a object or an error message string
		const paramsSchema = z.object({
			accountEmail: z.string().email(),
			services: z.object({
				gmail: z.union([z.object({
					name: z.string(),
					startDate: z.string(),
					endDate: z.string(),
					includeDraft: z.boolean(),
					onlySentMail: z.boolean()
				}), z.boolean(), z.string()]) ,
				drive: z.union([z.object({
					name: z.string(),
					startDate: z.string(),
					endDate: z.string(),
					includeSharedDrive: z.boolean()
				}), z.boolean(), z.string()]) ,
				chat: z.union([z.object({
					name: z.string(),
					startDate: z.string(),
					endDate: z.string(),
					includChatSpace: z.boolean()
				}), z.boolean()]) ,
				groups: z.union([z.object({
					name: z.string(),
					startDate: z.string(),
					endDate: z.string(),
					includeDraft: z.boolean(),
					onlySentMail: z.boolean()
				}), z.boolean(), z.string()])
			})
		});
		console.log(z.object)

		// if the req body is not in the correct form, send an error
		const parseParams = paramsSchema.safeParse(req.body);
		console.log("parse", parseParams.data);
		if (!parseParams.success) {
			return res.status(200).send({
				message: "Missing parameter."
			});
		}

		const services = [];
		let shouldBackup = false;

		// checking what all services are present in the req body.
		// push only the present services in an array
		config.services.forEach(service => {
			if (parseParams.data.services[service.name] !== false) {
				shouldBackup = true;
				services.push(parseParams.data.services[service.name]);
			}
		});

		// if there are no services present in the req body, send appropriate msg
		if (!shouldBackup) {
			return res.send({
				message: "Please select alteast something to backup."
			});
		};

		// getting the domain of the the email for which backup is being initiated
		const key = datastore.key(["Domain", getDomainFromEmail(parseParams.data.accountEmail)]);
		const [results] = await datastore.get([key]);

		// if there is no domain for that email, send error.
		if (!Array.isArray(results) || (Array.isArray(results) && (results.length < 1))) {
			return res.status(404).send({
				message: "User Email's Domain not found"
			});
		}
		// getting the admin email of that domain, to make auth
		const ownerEmail = results[0].adminEmail;

		// building params object using the data from req body
		const params = {
			...parseParams.data,
			services,
			ownerEmail,
			creationTime: moment().unix(),
			name: `${parseParams.data.accountEmail}'s backup `,
			description: `${parseParams.data.accountEmail}'s backup created by ${ownerEmail}`,
			bucketDetails: `${parseParams.data.accountEmail}'s backup created by ${ownerEmail}`
		};
		console.log("params", params);
		// builidng auth for api call, using the admin email of domain.
		const auth = getAuthToken(
			process.env.GOOGLE_EMAIL,
			process.env.GOOGLE_PRIVATE_KEY,
			SCOPES,
			params.ownerEmail
		); // making auth token

		// Check whether matter already exist or not
		var matterQuery = datastore.createQuery("Matter").filter("name", "=", params.name); // query to get the matter entity with particular name
		var [Matters] = await datastore.runQuery(matterQuery);
		var currentMatterNumber = 1

		// if a matter already exist with the same name
		while(Matters.length > 0){
			// add an integer
			params.name =  `${parseParams.data.accountEmail}'s backup ` + currentMatterNumber
			matterQuery = datastore.createQuery("Matter").filter("name", "=", params.name); // query to get all entities of Matter kind
			[Matters] = await datastore.runQuery(matterQuery); // getting list of all matter entities

			currentMatterNumber++
		}
		
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
			adminEmail: ownerEmail
		};

		// list to iterate json
		const exportJsons = [];

		// making export key in datastore to be pushed in entity
		const exportKey = datastore.key("Export Permanent");

		// looping on the service object
		// console.log(params.services)
		for (var i=0; i<params.services.length; i++) {
			if(typeof params.services[i] === "string"){
				// creating matter json to be pushed on the db
				const ErrorJson = {
					createdTime: new Date().getTime(),
					errorMsg: params.services[i],
					userEmail: parseParams.data.accountEmail,
					adminEmail: decodedToken.email
				};
				// making matter key in datastore to be pushed in entity
				const errorKey = datastore.key("Error Logs");
				// wait for the insert to be completed
				await datastore.insert({
					key: errorKey, // key from matter
					data: ErrorJson // json object to push
				});
			}
			else {
				const newExportJsonFormat = Object.assign({}, exportJsonFormat);
				// assigning changed field
				newExportJsonFormat.service = params.services[i].name;

				// making a copy of json object for permanent storage and adding the changed fields
				const newParamsObject = Object.assign({}, params);
				delete newParamsObject.services;
				// console.log("service : " + params.services[i].name)
				newParamsObject.serviceParams = params.services[i];
				// parsing the params to put as string in the json
				newExportJsonFormat.params = JSON.stringify(newParamsObject);

				// pushing new json into list to
				exportJsons.push({
					key: exportKey, // export key
					data: newExportJsonFormat // export json object
				});
			}
			// making a copy of json object and adding
			
		}

		// pushing list of exports to the datastore
		await datastore.insert(exportJsons);

		res.send({ result: "Backup Initiated" });
	} catch (error) {
		next(error);
	}
});

router.post("/errorEntry", async (req, res, next) => {
	try {
		const idToken = req.get("Authorization") || "";
		const decodedToken = await getAuth().verifyIdToken(idToken);
		console.log("email", decodedToken.email);
		
		const paramsSchema = z.object({
			accountEmail: z.string().email(),
			errorMsg: z.string()
		});
		console.log(z.object)

		const parseParams = paramsSchema.safeParse(req.body);
		console.log("parse", parseParams.data);
		if (!parseParams.success) {
			return res.status(200).send({
				message: "Missing parameter."
			});
		}

		// creating matter json to be pushed on the db
		const ErrorJson = {
			createdTime: new Date().getTime(),
			errorMsg: parseParams.data.errorMsg,
			userEmail: parseParams.data.accountEmail,
			adminEmail: decodedToken.email
		};
		// making matter key in datastore to be pushed in entity
		const errorKey = datastore.key("Error Logs");
		// wait for the insert to be completed
		await datastore.insert({
			key: errorKey, // key from matter
			data: ErrorJson // json object to push
		});

		res.send({ result: "Error Logs Pushed" });
	} catch (error) {
		next(error);
	}
})

router.post("/validForm", async (req, res, next) => {
	try {
		const paramsSchema = z.object({
			accountEmail: z.string().email(),
			name: z.string()
		});

		const parseParams = paramsSchema.safeParse(req.body);

		if (!parseParams.success) {
			return res.status(200).send({
				message: "Missing parameter."
			});
		}
		// console.log("params", parseParams);
		const keyEmail = parseParams.data.accountEmail;
		const matterName = parseParams.data.name;
		// const auth = await authenticatedClient(); //making auth token

		const key = datastore.key(["Domain", getDomainFromEmail(parseParams.data.accountEmail)]);
		const [results] = await datastore.get([key]);

		if (!Array.isArray(results) || (Array.isArray(results) && (results.length < 1))) {
			return res.status(404).send({
				message: "Domain not found"
			});
		}
		const ownerEmail = results[0].adminEmail;

		const auth = getAuthToken(
			process.env.GOOGLE_EMAIL,
			process.env.GOOGLE_PRIVATE_KEY,
			["https://www.googleapis.com/auth/admin.directory.user.readonly"],
			// ["https://www.googleapis.com/auth/ediscovery", "https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/devstorage.full_control"],

			ownerEmail
		);

		const service = google.admin({ version: "directory_v1", auth });
		let token = null;
		const users = [];
		do {
			const res = await service.users.list({
				customer: "my_customer",
				maxResults: 100,
				orderBy: "email",
				pageToken: token
			});
			const currentRes = res.data.users;
			currentRes.forEach((elem) => {
				users.push(elem.primaryEmail);
			});
			token = res.data.nextPageToken;
		} while (token);
		console.log("Users:", users.length);

		console.log("matter", matterName);
		const matterQuery = datastore.createQuery("Matter").filter("name", "=", matterName); // query to get all entities of Matter kind
		const [Matters] = await datastore.runQuery(matterQuery); // getting list of all matter entities
		console.log("matter", Matters);
		const resObject = {
			isNameUnique: true,
			isUserValid: false
		};

		if (Matters.length) { resObject.isNameUnique = false; };

		if (users.includes(keyEmail)) {
			console.log("found");
			resObject.isUserValid = true;
		}
		console.log("resObject", resObject);
		res.json(resObject);
	} catch (error) {
		next(error);
	}
});

// route to call on loading the homepage, to show the list of matters
router.post("/homepage", async (req, res, next) => {
	try {
		const matterQuery = datastore.createQuery("Matter").filter("createdTime", "!=", 10); // query to get all entities of Matter kind
		const [Matters] = await datastore.runQuery(matterQuery); // getting list of all matter entities
		res.json(Matters); // return the list of Matter JSON as response
	} catch (error) {
		next(error);
	}
});

// route to show the cards on clicking a matter row
router.post("/homepage/export/list", async (req, res, next) => {
	try {
		const paramsSchema = z.object({
			matterId: z.string()
		});

		const parseParams = paramsSchema.safeParse(req.body);

		if (!parseParams.success) {
			return res.status(200).send({
				message: "Missing parameter."
			});
		}
		const MatterExportsQuery = datastore.createQuery("Export Permanent").filter("matterId", "=", req.body.matterId); // query to get the entities for a particular matter id from permanent export kind
		const [MatterExportsList] = await datastore.runQuery(MatterExportsQuery); // getting the list of exports for that matterId

		// modifying the JSON to be sent to frontend, deleting some fields present in the retrieved Export Json
		for (const MatterExport of MatterExportsList) {
			delete MatterExport.createdTime;
			delete MatterExport.matterId;
		}

		// building the JSON to be sent to Frontend
		const exportListJson = {
			matterId: req.body.matterId, // the overall matterId of the all the exports
			services: MatterExportsList // All the exports JSON
		};

		res.json(exportListJson); // return the list of export List Json as response
	} catch (error) {
		next(error);
	}
});

// route to delete an export from user bucket, once moved
// router.post("/export/delete", async (req, res, next) => {
// 	try {
// 		const viewLink = req.body.viewLink;
// 		const exportId = req.body.exportId;
// 		const matterName = JSON.parse(req.body.params).name;

// 		const myAuth = await authenticatedClient();
// 		await exportToMatters.backupDelete(myAuth, viewLink, matterName);

// 		// guery to get the particular export entity in permanent kind, using the export id filter
// 		const permQuery = datastore.createQuery("Export Permanent").filter("exportId", "=", exportId);
// 		const [permExports] = await datastore.runQuery(permQuery); // getting the Permanent export entity for that exportId
// 		permExports[0].statusCode = 4;
// 		// numeric id of the Permanent export entity stored in database, will be used to update the entity in permanent kind
// 		const permDatabaseId = permExports[0][datastore.KEY].id;
// 		// updating the export entity in permanent kind, using the database id of that particular entity
// 		const permKey = datastore.key(["Export Permanent", Number(permDatabaseId)]);
// 		const permKeyPush = {
// 			key: permKey, // the key where to update the data
// 			data: permExports[0] // the new data to be updated
// 		};
// 		await datastore.update(permKeyPush); // api to update the entity
// 		console.log("Perm updated with status set to deleted");

// 		let isMatterDeleted = true; // setting the matter as deleted, which would be set to false if any export is not deleted
// 		// guery to get the list of export entity in permanent kind, using the matter id filter
// 		const permMatterQuery = datastore.createQuery("Export Permanent").filter("matterId", "=", permExports[0].matterId);
// 		const [permMatterExports] = await datastore.runQuery(permMatterQuery); // getting the Permanent export entities for that matter Id
// 		// checking if all exports in this list has statusCode as completed
// 		for (const permMatterExport of permMatterExports) {
// 			if (permMatterExport.statusCode !== 4) { isMatterDeleted = false; }; // if not 1, setting matter completed to false
// 		}

// 		// functionality if matter is indeed completed
// 		if (isMatterDeleted) {
// 			console.log("All exports are and matter can be deleted");

// 			// guery to get the matter entity in Matter kind, using the matter id filter
// 			const matterQuery = datastore.createQuery("Matter").filter("matterId", "=", permExports[0].matterId);
// 			const [matters] = await datastore.runQuery(matterQuery); // getting the matter entity for that matter Id
// 			matters[0].state = "DELETED"; // setting the status of that matter to deleted

// 			// numeric id of the matter entity stored in database, will be used to update the entity in Matter kind
// 			const matterDatabaseId = matters[0][datastore.KEY].id;
// 			// updating the matter entity in Matter kind, using the database id of that particular entity
// 			const matterKey = datastore.key(["Matter", Number(matterDatabaseId)]);
// 			const matterKeyPush = {
// 				key: matterKey, // the key where to update the data
// 				data: matters[0] // the new data to be updated
// 			};
// 			await datastore.update(matterKeyPush); // api to update the entity
// 			console.log("matter kind updated");
// 		}

// 		res.send({ result: "export deleted" });
// 	} catch (error) {
// 		next(error);
// 	}
// });

// route to show the cards on clicking a matter row
router.post("/dashboard", async (req, res, next) => {
	try {
		const MatterExportsQuery = datastore.createQuery("Export Permanent");// query to get the entities for a particular matter id from permanent export kind
		const [MatterExportsList] = await datastore.runQuery(MatterExportsQuery); // getting the list of exports for that matterId

		// console.log(MatterExportsList);
		let completed = 0;
		let onGoing = 0;
		let yetToStart = 0;
		// const all = [];
		for (const item of MatterExportsList) {
			if (item.statusCode === 1 || item.statusCode === 4) completed = completed + 1;
			else if (item.statusCode === 0) yetToStart = yetToStart + 1;
			else if (item.statusCode === 2) onGoing = onGoing + 1;
		}
		const response = {
			completed,
			onGoing,
			yetToStart,
			all: MatterExportsList
		};
		res.json(response); // return the list of export List Json as response
	} catch (error) {
		next(error);
	}
});

router.post("/errorDashboard", async (req, res, next) => {
	try {
		const ErrorsQuery = datastore.createQuery("Error Logs");// query to get the entities for a particular matter id from permanent export kind
		const [ErrorsList] = await datastore.runQuery(ErrorsQuery); // getting the list of exports for that matterId

		const response = {
			all: ErrorsList
		};
		res.json(response); // return the list of export List Json as response
	} catch (error) {
		next(error);
	}
});


// route to show the different backup status of matter
router.post("/getMatterStatus", async (req, res, next) => {
	try {
		const paramsSchema = z.object({
			accountEmail: z.string().email()
		});

		const parseParams = paramsSchema.safeParse(req.body);

		if (!parseParams.success) {
			return res.status(200).send({
				message: "Missing parameter."
			});
		}
		const matterQuery = datastore.createQuery("Matter").filter("userEmail", "=", parseParams.data.accountEmail); // query to get all entities of Matter kind
		const [Matters] = await datastore.runQuery(matterQuery); // getting list of all matter entities
		// console.log("matter", Matters);

		const serviceStatus = {
			accountEmail: parseParams.data.accountEmail,
			services: {
				drive: false,
				gmail: false,
				chat: false,
				groups : false
			},
			serviceList: []
		};
		if (Matters.length > 0) {
			for (const matter of Matters) {
				const MatterExportsQuery = datastore.createQuery("Export Permanent").filter("matterId", "=", matter.matterId); // query to get the entities for a particular matter id from permanent export kind
				const [MatterExportsList] = await datastore.runQuery(MatterExportsQuery); // getting the list of exports for that matterId

				// modifying the JSON to be sent to frontend, deleting some fields present in the retrieved Export Json
				for (const MatterExport of MatterExportsList) {
					delete MatterExport.createdTime;
					// delete MatterExport.matterId;
				}
				// serviceStatus["matterId"] = Matters[0].matterId;
				for (const status of MatterExportsList) {
					// serviceStatus["services"][status.service] = status.statusCode === 1 ? true : false;
					serviceStatus.services[status.service] = true;
					serviceStatus.serviceList.push(status);
				}

				// // building the JSON to be sent to Frontend
				// const exportListJson = {
				// "matterId": parseParams.data.accountEmail, // the overall matterId of the all the exports
				// "services": MatterExportsList // All the exports JSON
				// }
				// console.log(exportListJson);
			}
			res.json(serviceStatus);
		} else {
			res.json(serviceStatus);
		}
		// return the list of export List Json as response
	} catch (error) {
		next(error);
	}
});

router.post("/delete", async(req,res,next) => {
	try{
		const paramsSchema = z.object({
			accountEmail: z.string().email(),
			viewLink: z.string(),
			exportId: z.string(),
			matterId: z.string()
		});
	
		const parseParams = paramsSchema.safeParse(req.body);
		console.log("parse", parseParams.data);
		if (!parseParams.success) {
			return res.status(200).send({
				message: "Missing parameter."
			});
		}

		const key = datastore.key(["Domain", getDomainFromEmail(parseParams.data.accountEmail)]);
		const [results] = await datastore.get([key]);

		if (!Array.isArray(results) || (Array.isArray(results) && (results.length < 1))) {
			return res.status(404).send({
				message: "Domain not found"
			});
		}
		const ownerEmail = results[0].adminEmail;

		const auth = getAuthToken(
			process.env.GOOGLE_EMAIL,
			process.env.GOOGLE_PRIVATE_KEY,
			SCOPES,
			ownerEmail
		); // making auth token
	
		const matterQuery = datastore.createQuery('Matter').filter('matterId', '=', parseParams.data.matterId);
		const [matterExports] = await datastore.runQuery(matterQuery);
		const matterName = matterExports[0].name
	
		await exportToMatters.backupDelete(auth,parseParams.data.viewLink,matterName);
	
		// guery to get the particular export entity in permanent kind, using the export id filter 
		const permQuery = datastore.createQuery('Export Permanent').filter('exportId', '=', parseParams.data.exportId);
		const [permExports] = await datastore.runQuery(permQuery); // getting the Permanent export entity for that exportId
		permExports[0].statusCode = 4
		// numeric id of the Permanent export entity stored in database, will be used to update the entity in permanent kind 
		let permDatabaseId = permExports[0][datastore.KEY].id;
		// updating the export entity in permanent kind, using the database id of that particular entity
		const permKey = datastore.key(["Export Permanent",Number(permDatabaseId)])
		const permKeyPush = {
			key: permKey, // the key where to update the data
			data: permExports[0] // the new data to be updated
		};
		await datastore.update(permKeyPush); // api to update the entity
		console.log("Perm updated with status set to deleted")
	
		res.send({"result" : "Export deleted"})

	} catch (error) {
		next(error);
	}
})

// function that actually do matter export of service
async function insertInTempAndUpdatePerm (PermExport, auth) {
	// numeric id of the export entity stored in database, will be used to update the entity in permanend kind
	const databaseId = PermExport[datastore.KEY].id;
	console.log("Hello");
	// calling function to initiate the export, the function call is made using the service key of PermExport
	// matterId and user Params stored in database are passed as paramaters to function call
	let exportRes = "";
	try {
		exportRes = await exportToMatters[PermExport.service](auth, PermExport.matterId, JSON.parse(PermExport.params));
		console.log("Created Export data is : " + exportRes.data);
		// creating export Json to be inserted to temp kind and updated in permanent kind, by modifying the retrieved Permanent export Json
		PermExport.statusCode = 2; // setting status code to in progress
		PermExport.exportId = exportRes.data.id; // filling in the export id key, using the response from api call
		PermExport.initiatedTime = new Date(exportRes.data.createTime).getTime(); // setting the createdTime key, and storing date in timestamp
		PermExport.percentage = "0";
	} catch (error) {
		console.log("kkkkkkkkk");
		console.log(error);
		PermExport.statusCode = -1; // setting status code to -1 for not licensed user
	}

	// If statusCode is not -1 only data will be inserted in temporary kind
	if (PermExport.statusCode !== -1) {
		// inserting the modified export JSON in temporary kind
		const tempKey = datastore.key("Export Temporary");
		const tempEntity = {
			key: tempKey, // the key whete to insert the data
			data: PermExport // the data to be inserted
		};
		await datastore.insert(tempEntity); // api to insert entity in datastore
		console.log("temporary inserted");
	}

	// updating the export entity in permnanet kind, using the database id of that particular entity
	const permKey = datastore.key(["Export Permanent", Number(databaseId)]);
	const PermEntity = {
		key: permKey, // the key where to update the data
		data: PermExport // the new data to be updated
	};
	await datastore.update(PermEntity); // api to update entity in datastore
	console.log("Permanent updated");
}

// router.post("/getMatterExport", async (req, res, next) => {
// try {
// const paramsSchema = z.object({
// accountEmail: z.string().email()

// });

// const parseParams = paramsSchema.safeParse(req.body);

// if (!parseParams.success) {
// return res.status(200).send({
// message: "Missing parameter."
// });
// }
// const key = datastore.key(["Domain", getDomainFromEmail(parseParams.data.accountEmail)]);
// const [results] = await datastore.get([key]);

// if (!Array.isArray(results) || (Array.isArray(results) && (results.length < 1))) {
// return res.status(404).send({
// message: "Domain not found"
// });
// }

// const ownerEmail = results[0].adminEmail;
// const auth = getAuthToken(
// process.env.GOOGLE_EMAIL,
// process.env.GOOGLE_PRIVATE_KEY,
// ["https://www.googleapis.com/auth/ediscovery", "https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/devstorage.full_control"],
// ownerEmail
// ); // making auth token

// // query to get the pending exports from Permanenet kind and sorting them acc to the created Time
// const PermQuery = datastore.createQuery('Export Permanent').filter('statusCode', '=', 2).order('statusCode')
// const [PermExports] = await datastore.runQuery(PermQuery); // getting array of pending exports, ordered in created Time
// // console.log("Perm Exports list : " + PermExports);

// for (let i = 0; i < PermExports.length; i++) {
// // console.log("PermExports", PermExports[i].exportId);
// if (PermExports[i].exportId !== undefined) {
// const res = await exportToMatters["checkExportJson"](auth, PermExports[i].matterId, PermExports[i].exportId);
// console.log("res", res.cloudStorageSink.files[0]);

// const auth3 = getAuthToken(
// process.env.GOOGLE_EMAIL,
// process.env.GOOGLE_PRIVATE_KEY,
// ["https://www.googleapis.com/auth/ediscovery", "https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/devstorage.full_control"],

// );

// // const buffer = await downloadFileFromBucket(res.cloudStorageSink.files[0].bucketName, "ff", auth3);

// }
// }
// }
// catch (error) {
// console.log("error", error);
// }

// res.send("Successfully");
// });

// function to initiate export and update kinds for worker thread
// input : a single pending Permanent export object

// module.exports = router;
module.exports = {
	router,
	insertInTempAndUpdatePerm
};
