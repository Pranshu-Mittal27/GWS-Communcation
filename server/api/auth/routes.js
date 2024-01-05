/* eslint-disable no-tabs */
// importing required libraries, datastore for db connection, firebase for checking authentication, zod for checking req parameters
const { Router } = require("express");
const { Datastore } = require("@google-cloud/datastore");
const { getAuth } = require("firebase-admin/auth");
const { z } = require("zod");
const { google } = require("googleapis");

// importing functions from index file of config and util
const { config, getAuthToken } = require("../../config");
const { getDomainFromEmail, getAllDomains } = require("../../util");

const router = Router();
// const users = [
// 	{
// 		email: "superadmin@email.com",
// 		password: "admin",
// 		role: "superadmin"
// 	},
// 	{
// 		email: "admin@email.com",
// 		password: "admin",
// 		role: "admin"
// 	},
// 	{
// 		email: "user@email.com",
// 		password: "user",
// 		role: "user"
// 	}
// ];

// ─────────────────────────────────────────────────────────────────────────────
// User authentication and authorization
// ─────────────────────────────────────────────────────────────────────────────
// ─── Login With Google And User Initialization And Role Check ────────────────
router.post("/login", (req, res, next) => {
	// console.log("req : ", req.body)
	// console.log("inside login")
	// fetching id token of user trying to login through sso, for checking authentication
	const { idToken } = req.body;

	const idTokenSchema = z.string();

	// make sure the parameters are present
	// chekcing that the idToken is a valid token
	if (!idTokenSchema.safeParse(idToken).success) {
		res.status(400).send({
			message: "Bad request, idToken missing"
		});
		return;
	}

	// checking authentication through firebase
	const auth = getAuth();
	// if the idToken is verified, proceed with authentication
	auth.verifyIdToken(idToken)
		.then(async (decodedToken) => {
			// get the email of the user
			const email = decodedToken.email;
			// check if the user is in the datastore kind User
			const db = new Datastore({
				projectId: config.GCLOUD_PROJECT,
				keyFilename: config.keyFile
			});
			// console.log("db", db)
			// if the user is in the datastore kind User, then return the role
			const key = db.key(["User", email]);
			// console.log("key" ,key)
			const query = await db.get(key);
			// console.log(query)
			if (query.length > 0 && query[0] != undefined) {
				const user = query[0];
				
				// checking if in the datastore, the user is disabled
				if (user.disabled) {
					// disable user in firebase as well
					// const auth = getAuth();
					// auth.getUserByEmail(email)
					// 	.then((userRecord) => {
					// 		auth
					// 			.updateUser(userRecord.uid, {
					// 				disabled: true
					// 			})
					// 			.catch((error) => next(error));
					// 	})
					// 	.catch(error => next(error));
					
					// if user is diabled, send the appropriate msg
					res.status(401).send({
						message: "Your account is unauthorized/disabled. Please contact your administrator."
					});
				} else {
					// send the role of the user with status 200
					// console.log("login", user);
					res.status(200).send(user.role);
				}
			}
			// if the user does not exist in the databse, send appropriate msg 
			else{
				res.status(401).send({
					message: "Your account is unauthorized/disabled. Please contact your administrator."
				});
			}
			// else {
			// 	// check if the user email domain is in the datastore kind Domain
			// 	const key = db.key(["Domain", getDomainFromEmail(email)]);
			// 	const results = await db.get(key);
			// 	if (results.length > 0) {
			// 		// insert the user into the datastore kind User
			// 		// with role user by default and disabled = false
			// 		const key = db.key(["User", email]);
			// 		const entity = {
			// 			key,
			// 			data: {
			// 				role: "user",
			// 				disabled: false
			// 			}
			// 		};
			// 		db
			// 			.save(entity)
			// 			.then(() => {
			// 				res.status(200).send("user");
			// 			})
			// 			.catch((error) => next(error));
			// 	} else {
			// 		// disable the user in firebase
			// 		auth
			// 			.updateUser(decodedToken.uid, {
			// 				disabled: true
			// 			}).catch((error) => next(error));
			// 		// send status 401 for unauthorized access
			// 		res.status(401).send({
			// 			message: "Your account is unauthorized/disabled. Please contact your administrator."
			// 		});
			// 	}
			// }
		})
		// if the id token could not be verified, send the appropriate msg
		.catch(() => {
			res.status(401).send({
				message: "Your account is unauthorized/disabled. Please contact your administrator."
			});
		});
});

// ─────────────────────────────────────────────────────────────────────────────
// User Management Routes
// ─────────────────────────────────────────────────────────────────────────────
// ─── Get Selected User ───────────────────────────────────────────────────────
router.get("/users/:email", async (req, res, next) => {
	// console.log("inside user/email")
	const { email } = req.params;

	// checking if the email passed as query is a string
	const emailSchema = z.string().email();

	// if not string, return an error 
	if (!emailSchema.safeParse(email).success) {
		res.status(400).status({
			message: "Bad Request, valid email required"
		});
		return;
	}

	// getting datastore object passing the credentials for service account and the GCP project associated with it.
	const db = new Datastore({
		projectId: config.GCLOUD_PROJECT,
		keyFilename: config.keyFile
	});

	let fbDisabled;

	// check if the user is disabled in firebase
	const auth = getAuth();
	auth.getUserByEmail(email).then((userRecord) => {
		fbDisabled = userRecord.disabled;
	})
		.catch(() => {
			fbDisabled = false;
		});

	//if user is not disbaled in the firebase, check their entity in database
	const key = db.key(["User", email]);
	const [user] = await db.get(key);
	// if the user does not exist return acc response
	if (!((user === undefined) || (user === null))) {
		res.status(200).send(user);
	} else {
		// Get user created time
		// get domain of user
		const currDomain = getDomainFromEmail(email);
		const domainsArr = await getAllDomains();
		// get admin email of that domain
		const adminAcc = domainsArr.filter(val => val.domain === currDomain)[0].email;
		// building authentication using admin email
		const auth2 = getAuthToken(
			process.env.GOOGLE_EMAIL,
			process.env.GOOGLE_PRIVATE_KEY,
			[
				"https://www.googleapis.com/auth/admin.directory.user.readonly"
			],
			adminAcc
		);
		// getting user details through api
		const service = google.admin({ version: "directory_v1", auth: auth2 });
		const { data: user } = await service.users.get({
			userKey: email,
			fields: "creationTime"
		});

		// insert the user into the datastore kind User
		// with role user by default and disabled = true
		const entity = {
			key,
			data: {
				role: "user",
				disabled: true || fbDisabled,
				creationTime: user.creationTime
			}
		};
		db
			.save(entity)
			.then(() => {
				res.status(200).send({
					email,
					role: "user",
					disabled: true || fbDisabled,
					creationTime: user.creationTime
				});
			})
			.catch(error => next(error));
	}
});
// ─── Update Selected User ────────────────────────────────────────────────────
router.put("/users", async (req, res, next) => {
	const { email, role, disabled } = req.body;
	// get the database object using GCP project and service account creds
	const db = new Datastore({
		projectId: config.GCLOUD_PROJECT,
		keyFilename: config.keyFile
	});

	// the disabled parameter sent from the frontend
	if (disabled === true) {
		// disable firebase authentication for the user
		// and set the disabled status to true
		const auth = getAuth();
		auth.getUserByEmail(email).then((userRecord) => {
			auth.updateUser(userRecord.uid, {
				disabled: true
			}).catch((error) => next(error));
		}).catch((error) => next(error));
	} else {
		// enable firebase authentication for the user
		const auth = getAuth();
		auth.getUserByEmail(email).then((userRecord) => {
			auth
				.updateUser(userRecord.uid, {
					disabled: false
				})
				.catch((error) => next(error));
		}
		).catch((error) => next(error));
	}

	// getting the entity for that particular email user from database
	const key = db.key(["User", email]);
	const [user] = await db.get(key);

	// check if the user is present
	if (!((user === undefined) || (user === null))) {
		// Check if there are more than 1 superadmin before demoting
		if (user.role === "superadmin" && role !== "superadmin") {
			// Get number of superadmins
			const query = db.createQuery("User").filter("role", "superadmin");
			const [superadmins] = await db.createAggregationQuery(query).count().run();
			// checking the number of superadmins greater than 1
			if (superadmins[0].property_1 === 1) {
				// if only 1 superadmin, can not demote since atleast 1 superadmin required.
				res.status(409).send({
					message: "Cannot change role. Atleast one Superadmin required!!!"
				});
				return;
			}
		}
		// else update the user in database acc to the role passed from frontend
		const entity = {
			key,
			data: {
				...user,
				role,
				disabled
			}
		};
		db
			.save(entity)
			.then(() => {
				res.status(200).send({
					email,
					role,
					disabled,
					message: "User updated successfully"
				});
			})
			.catch((error) => next(error));
	} else {
		res.status(404).send({
			message: "User not found"
		});
	}
});

module.exports = router;
