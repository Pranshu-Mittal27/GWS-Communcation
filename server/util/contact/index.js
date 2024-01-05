/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
/* eslint-disable no-tabs */
/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const dotenv = require("dotenv");
dotenv.config();

const axios = require("axios");

const { google } = require("googleapis");
const { getAuthToken } = require("../../config");
const { InsertProgressesById, calculateProgress } = require("../progress");
const promiseRetry = require("promise-retry");
const config = require("../../config");

const throttledQueue = require("throttled-queue");
const throttle = throttledQueue(config.config.contactThrottle, 1000, true);

let userCount = 0;
// let rateLimit = 0;
// let errorCount = 0;

function calendarInsertContacts (domainsData) {
	domainsData.forEach((value, index, array) => {
		const newArray = array.filter((val) => {
			return val.domain !== value.domain;
		});
		insertContactsForAllUsers(value.email, value.domain, newArray);
	});
}

async function insertContactsForAllUsers (adminAcc, currDomain, domains, flag) {
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
	do {
		const usersRes = await service.users.list({
			// maxResults: 2,
			orderBy: "email",
			domain: currDomain,
			showDeleted: false,
			pageToken: nextPageToken
		});
		users.push(...usersRes.data.users);
		nextPageToken = usersRes.data?.nextPageToken;
	} while (nextPageToken !== undefined);

	const totalUsers = users.length;
	const syncType = flag ? "insert" : "remove";

	if (Array.isArray(users) && totalUsers > 0) {
		domains.forEach(domainItem => {
			InsertProgressesById("contact", syncType, {
				from: currDomain,
				to: domainItem.domain,
				current: 0,
				totalCount: totalUsers
			});
		});
	}

	console.log("Total Users- ", currDomain, ": ", totalUsers);

	domains.forEach(async (domainItem) => {
		// Get all contacts(from current domain) that are already synced and store in set for fast search
		const auth2 = getAuthToken(process.env.GOOGLE_EMAIL, process.env.GOOGLE_PRIVATE_KEY, ["https://www.google.com/m8/feeds"], domainItem.email)
		let currentCount = 0;
		if (flag) {
			let contactsSynced = await getAllContactEmails(domainItem.email, domainItem.domain, currDomain);
			contactsSynced = new Set(contactsSynced);

			users
				.forEach(async (user) => {
					// Do not sync if the user is already synced

					if (contactsSynced.has(user.primaryEmail)) {
						currentCount = currentCount + 1;
						calculateProgress(currentCount, totalUsers, currDomain, domainItem.domain, "insert", "contact");
						return;
					}
					const body = {
						primaryEmail: replaceSpecialCharacter(user.primaryEmail),
						givenName: replaceSpecialCharacter(user.name.givenName),
						familyName: replaceSpecialCharacter(user.name.familyName),
						fullName: replaceSpecialCharacter(user.name.fullName),
						relations: user.relations,
						addresses: user.addresses,
						organizations: user.organizations,
						phones: user.phones,
						locations: user.locations,
						languages: user.languages,
						orgUnitPath: user.orgUnitPath,
						externalIds: user.externalIds,
						thumbnailPhotoUrl: replaceSpecialCharacter(user.thumbnailPhotoUrl),
						thumbnailPhotoEtag: user.thumbnailPhotoEtag
					};
					throttle(() => {
						insertContact(auth2, body, domainItem.domain, "contact").finally(() => {
							currentCount = currentCount + 1;
							calculateProgress(currentCount, totalUsers, currDomain, domainItem.domain, "insert", "contact");
						});
					});
				});
		} else {
			const output = await getAllContacts(domainItem.email, domainItem.domain, currDomain);
			console.log("All contacts fetched for :", domainItem.domain);
			console.log("CurrDomain :", currDomain);
			output.map(async (item) => {
				throttle(() => {
					removeContact(item.email, domainItem.email, item.url, domainItem.domain).finally(() => {
						currentCount = currentCount + 1;
						calculateProgress(currentCount, output.length, currDomain, domainItem.domain, "remove", "contact");
					});
				});
			}
			);
		}
	});
}

// For a single user
async function insertContactsForUser (adminAcc, userEmail, domains, flag, isUpdate) {
	// Get user data
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.googleapis.com/auth/admin.directory.user.readonly"
		],
		adminAcc
	);
	let user = "";
	if (flag) {
		const service = google.admin({ version: "directory_v1", auth });
		try {
			const data = await service.users.get({
				userKey: userEmail
			});
			user = data.data;
		} catch (error) {
			console.log("error", error.data);
			return;
		}
	}

	domains.forEach(async (value) => {
		if (flag) {
			const auth2 = getAuthToken(
				process.env.GOOGLE_EMAIL,
				process.env.GOOGLE_PRIVATE_KEY,
				["https://www.google.com/m8/feeds"],
				value.email
			);
			const body = {
				primaryEmail: replaceSpecialCharacter(user.primaryEmail),
				givenName: replaceSpecialCharacter(user.name.givenName),
				familyName: replaceSpecialCharacter(user.name.familyName),
				fullName: replaceSpecialCharacter(user.name.fullName),
				relations: user.relations,
				addresses: user.addresses,
				organizations: user.organizations,
				phones: user.phones,
				locations: user.locations,
				languages: user.languages,
				orgUnitPath: user.orgUnitPath,
				externalIds: user.externalIds,
				thumbnailPhotoUrl: replaceSpecialCharacter(user.thumbnailPhotoUrl),
				thumbnailPhotoEtag: user.thumbnailPhotoEtag
			};

			if(isUpdate === "true") {
				const output = await getAllContacts(value.email, value.domain, userEmail);
				output.map(async (item) => {
					updateContact(auth2, body, value.domain, "contact", item.url)
						.then(() => {
							console.log("Update contact called");
						});
				}
				);
			}
			else {
				insertContact(auth2, body, value.domain, "contact")
				.then(() => {
					console.log("Insert contact called");
				});
			}
		} else {
			const output = await getAllContacts(value.email, value.domain, userEmail);
			console.log("All contacts fetched");
			output.map(async (item) => {
				removeContact(item.email, value.email, item.url, userEmail.split("@")[1])
					.then(() => {
						console.log("Remove contact called");
					});
			}
			);
		}
	});
}

// End function to insert a contact
async function insertContact (authToken, body, organization, type) {
	const { access_token, token_type } = await authToken.authorize();
	const url = `https://www.google.com/m8/feeds/contacts/${organization}/full`;
	// const xmlBody = require('./test.xml');
	try {
		const res = await promiseRetry(async (retry, number) => {
			try {
				const output = await axios({
					method: "post",
					url,
					data: `
					<atom:entry xmlns:atom='http://www.w3.org/2005/Atom'
							xmlns:gd='http://schemas.google.com/g/2005'>
						<atom:category scheme='http://schemas.google.com/g/2005#kind'
							term='http://schemas.google.com/contact/2008#contact' 
						/>
						<content>Created by Universal Sync Tool</content>
						<gd:name>
							<gd:givenName>${body.givenName}</gd:givenName>
							<gd:familyName>${body.familyName}</gd:familyName>
							<gd:fullName>${body.fullName}</gd:fullName>
						</gd:name>
						<gd:email rel='http://schemas.google.com/g/2005#work'
							primary='true'
							address='${body.primaryEmail}' displayName='${body.fullName}' 
						/>
						${body.phones !== undefined
		? body?.phones?.map((phone) => {
			return phone.value && `<gd:phoneNumber rel='http://schemas.google.com/g/2005#${(phone.type)}' primary='${phone.type === "work" ? "true" : "false"}'>
							${replaceSpecialCharacter(phone.value)}
				</gd:phoneNumber>`;
		})
		: ""}
						${body.addresses !== undefined
		? body?.addresses?.map((address, key) => {
			return address.formatted && `<gd:structuredPostalAddress rel='http://schemas.google.com/g/2005#${address.type}' primary='${key === 0}'>
							<gd:formattedAddress>${replaceSpecialCharacter(address.formatted)}</gd:formattedAddress>
				</gd:structuredPostalAddress>`;
		})
		: ""}
					${body.organizations && body.organizations?.map((org, key) => {
		return `<gd:organization primary='${key === 0}'>
							<gd:orgTitle>${replaceSpecialCharacter(org.title)}</gd:orgTitle>
							<gd:OrgCustomType>${replaceSpecialCharacter(org.customType)}</gd:OrgCustomType>
							${org.department !== undefined ? `<gd:OrgDepartment>${replaceSpecialCharacter(org.department)}</gd:OrgDepartment>` : ""}  
				</gd:organization>`;
	})}

					${body.relations !== undefined
				? body?.relations?.map((relation) => {
					return `<gd:email rel='http://schemas.google.com/g/2005#home'
						address='${"Manager : " + replaceSpecialCharacter(relation.value)}' />`
					}) 
				: ""}

					${body.externalIds !== undefined
						? body?.externalIds?.map((externalId) => {
							return `<gd:structuredPostalAddress rel='http://schemas.google.com/g/2005#work'>
										<gd:postcode>${"Employee Id : " + replaceSpecialCharacter(externalId.value)}</gd:postcode>
								</gd:structuredPostalAddress>`;
						})
						: ""}

						<link rel="http://schemas.google.com/contacts/2008/rel#photo" type="image/*"
							href="${body.thumbnailPhotoUrl}"/>
					</atom:entry>`,
					headers: {
						Authorization: `${token_type} ${access_token}`,
						"GData-Version": 3.0,
						"Content-Type": "application/xml"
					}
				});
				userCount = userCount + 1;
				console.log(`${userCount} Contact ${body.primaryEmail} added successfully in ${organization} `);
				if(type === "contact")
				return true;
				else
				return output
			} catch (e) {
				// TODO Sometimes it gives an error: deadline exceeded
				if (e?.response?.data === "Deadline exceeded.") {
					console.log("Retrying");
					retry();
				} else {
					console.log("insertContact Error here: ", e?.response?.data, body);
					return false;
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
		console.log("Failed after all retries");
		return false;
	}
};

async function removeContact (primaryEmail, adminAcc, url, organization) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.google.com/m8/feeds"
		],
		adminAcc
	);
	const { access_token, token_type } = await auth.authorize();
	// const organization = adminAcc.split("@")[1];
	try {
		await promiseRetry(async (retry, number) => {
			try {
				await axios({
					method: "DELETE",
					url,
					headers: {
						Authorization: `${token_type} ${access_token}`,
						"GData-Version": 3.0,
						"Content-Type": "application/xml"
					}
				});
				userCount = userCount + 1;
				console.log(`${userCount} Contact ${primaryEmail} deleted successfully from ${organization} `);
			} catch (err) {
				console.log("Retrying");
				retry();
			}
		}, {
			minTimeout: 2000,
			retries: 6,
			factor: 4,
			randomize: true
		});
	} catch (err) {
		console.log("Failed after all retries");
	}
};

async function updateContact (authToken, body, organization, type, UIDUrl) {
	const { access_token, token_type } = await authToken.authorize();
	const url = UIDUrl
	// const xmlBody = require('./test.xml');
	try {
		const res = await promiseRetry(async (retry, number) => {
			try {
				const output = await axios({
					method: "PUT",
					url,
					data: `
					<atom:entry xmlns:atom='http://www.w3.org/2005/Atom'
							xmlns:gd='http://schemas.google.com/g/2005'>
						<atom:category scheme='http://schemas.google.com/g/2005#kind'
							term='http://schemas.google.com/contact/2008#contact' 
						/>
						<content>Created by Universal Sync Tool</content>
						<gd:name>
							<gd:givenName>${body.givenName}</gd:givenName>
							<gd:familyName>${body.familyName}</gd:familyName>
							<gd:fullName>${body.fullName}</gd:fullName>
						</gd:name>
						<gd:email rel='http://schemas.google.com/g/2005#work'
							primary='true'
							address='${body.primaryEmail}' displayName='${body.fullName}' 
						/>
						${body.phones !== undefined
		? body?.phones?.map((phone) => {
			return phone.value && `<gd:phoneNumber rel='http://schemas.google.com/g/2005#${(phone.type)}' primary='${phone.type === "work" ? "true" : "false"}'>
							${replaceSpecialCharacter(phone.value)}
				</gd:phoneNumber>`;
		})
		: ""}
						${body.addresses !== undefined
		? body?.addresses?.map((address, key) => {
			return address.formatted && `<gd:structuredPostalAddress rel='http://schemas.google.com/g/2005#${address.type}' primary='${key === 0}'>
							<gd:formattedAddress>${replaceSpecialCharacter(address.formatted)}</gd:formattedAddress>
				</gd:structuredPostalAddress>`;
		})
		: ""}
					${body.organizations && body.organizations?.map((org, key) => {
		return `<gd:organization primary='${key === 0}'>
							<gd:orgTitle>${replaceSpecialCharacter(org.title)}</gd:orgTitle>
							<gd:OrgCustomType>${replaceSpecialCharacter(org.customType)}</gd:OrgCustomType>
							${org.department !== undefined ? `<gd:OrgDepartment>${replaceSpecialCharacter(org.department)}</gd:OrgDepartment>` : ""}
				</gd:organization>`;
	})}

					${body.relations !== undefined
				? body?.relations?.map((relation) => {
					return `<gd:email rel='http://schemas.google.com/g/2005#home'
						address='${"Manager : " + replaceSpecialCharacter(relation.value)}' />`
					}) 
				: ""}

				${body.externalIds !== undefined
				? body?.externalIds?.map((externalId) => {
					return `<gd:structuredPostalAddress rel='http://schemas.google.com/g/2005#work'>
								<gd:postcode>${"Employee Id : " + replaceSpecialCharacter(externalId.value)}</gd:postcode>
						</gd:structuredPostalAddress>`;
				})
				: ""}
						<link rel="http://schemas.google.com/contacts/2008/rel#photo" type="image/*"
							href="${body.thumbnailPhotoUrl}"/>
					</atom:entry>`,
					headers: {
						Authorization: `${token_type} ${access_token}`,
						"GData-Version": 3.0,
						"Content-Type": "application/xml"
					}
				});
				userCount = userCount + 1;
				console.log(`${userCount} Contact ${body.primaryEmail} updated successfully in ${organization} `);
				if(type === "contact")
				return true;
				else
				return output
			} catch (e) {
				// TODO Sometimes it gives an error: deadline exceeded
				if (e?.response?.data === "Deadline exceeded.") {
					console.log("Retrying");
					retry();
				} else {
					console.log("updateContact Error here: ", e?.response?.data, body);
					return false;
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
		console.log("Failed after all retries");
		return false;
	}
};

async function getAllContactEmails (adminAcc, organization, requiredDomain = false) {
	// const organization = adminAcc.split("@")[1];
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.google.com/m8/feeds"
		],
		adminAcc
	);
	const { access_token, token_type } = await auth.authorize();

	let url = `https://www.google.com/m8/feeds/contacts/${organization}/full?alt=json&max-results=500`;
	let users = [];
	try {
		while (url) {
			const output = await getPageToken(url, access_token, token_type);
			if (output?.data?.feed?.entry === undefined) {
				url = output.data.feed.link.filter(val => val.rel === "next")?.[0]?.href;
				continue;
			}
			users.push(...output?.data?.feed?.entry?.filter((val) => Array.isArray(val.gd$email))
				.map(val => val.gd$email[0].address));
			url = output.data.feed.link.filter(val => val.rel === "next")?.[0]?.href;
		}
		users = requiredDomain ? users.filter(val => val.split("@")[1] === requiredDomain) : users;
		console.log("Already added contacts: ", users.length);
		return users;
	} catch (e) {
		console.log("getAllContactEmails error here: ", e?.response?.data);
		return [];
	}
};

async function getAllContacts (adminAcc, organization, userEmail = undefined) {
	// const domain = adminAcc.split("@")[1];
	// const organization = adminAcc.split("@")[1];
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.google.com/m8/feeds"
		],
		adminAcc
	);
	const { access_token, token_type } = await auth.authorize();

	let url = `https://www.google.com/m8/feeds/contacts/${organization}/full?alt=json&max-results=500`;
	// const xmlBody = require('./test.xml');
	try {
		const output = [];
		while (url) {
			let res = await getPageToken(url, access_token, token_type);

			url = res.data.feed.link.filter(val => val.rel === "next")?.[0]?.href;
			// eslint-disable-next-line array-callback-return
			res = res?.data?.feed?.entry?.map((val) => {
				if (!Array.isArray(val?.gd$email)) {
					return {
						email: "dummy@domain.com",
						url: ""
					};
				} else {
					return {
						email: val?.gd$email[0]?.address,
						url: val?.link?.find((item) => item?.rel === "edit")?.href
					};
				}
			})
				.filter((val) => {
					// return val.email.split("@")[1] === organization;
					return userEmail.includes("@")
						? val.email === userEmail
						: val.email.split("@")[1].toLowerCase() === userEmail.toLowerCase();
				});
			output.push(...res);
		}
		// const output = await getPageToken(url, access_token, token_type);
		console.log("getAllContacts length:", output.length);
		return output;
	} catch (e) {
		console.log("error", e);
		return [];
	}
};

// getAllContactsFor Backend Only
async function getAllContactsForBackendOnly (adminAcc) {
	const domain = adminAcc.split("@")[1];
	const organization = adminAcc.split("@")[1];
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://www.google.com/m8/feeds"
		],
		adminAcc
	);
	const { access_token, token_type } = await auth.authorize();

	let url = `https://www.google.com/m8/feeds/contacts/${domain}/full?alt=json`;
	// const xmlBody = require('./test.xml');
	try {
		const output = [];
		while (url) {
			let res = await getPageToken(url, access_token, token_type);

			url = res.data.feed.link.filter(val => val.rel === "next")?.[0]?.href;
			res = res?.data?.feed?.entry?.map((val) => {
				// console.log("inside");
				return {
					email: val?.gd$email[0]?.address,
					url: val?.link?.find((item) => item?.rel === "edit")?.href
				};
			})
				.filter((val) => {
					return val.email.split("@")[1] !== organization;
				});
			output.push(...res);
		}
		// const output = await getPageToken(url, access_token, token_type);
		return output;
	} catch (e) {
		console.log("error", e);
		return [];
	}
};

async function getPageToken (url, access_token, token_type) {
	const output = await axios({
		method: "get",
		url,
		headers: {
			Authorization: `${token_type} ${access_token}`,
			"GData-Version": 3.0,
			"Content-Type": "application/xml"
		}
	});
	// console.log(output)
	return output;
}

function replaceSpecialCharacter (string) {
	if (string === undefined) return undefined;
	string = string.split("<").join("&#60;");
	string = string.split("&").join("&#38;");
	string = string.split(">").join("&#62;");
	string = string.split("'").join("&#39;");
	string = string.split("\"").join("&#34;");

	// string = string.replaceAll("<", "&#60;");
	// string = string.replaceAll("&", "&#38;");
	// string = string.replaceAll(">", "&#62;");
	// string = string.replaceAll("'", "&#39;");
	// string = string.replaceAll("\"", "&#34;");
	return string;
}

module.exports = {
	calendarInsertContacts,
	insertContactsForAllUsers,
	insertContactsForUser,
	removeContact,
	getAllContacts,
	getAllContactsForBackendOnly,
	insertContact,
	replaceSpecialCharacter
};
