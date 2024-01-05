/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const dotenv = require("dotenv");
dotenv.config();

// const axios = require('axios');

const { google } = require("googleapis");
const { getAuthToken } = require("../../config");

// getMailId
async function getMails (userMail, query) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://mail.google.com/"
		],
		userMail
	);

	const gmail = google.gmail({ version: "v1" });

	const usersRes = await gmail.users.messages.list({
		userId: userMail,
		q: query,
		auth
	});
	return usersRes.data.messages;
}

/*
async function getMailsTrial (userMail, query) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://mail.google.com/"
		],
		userMail
	);

	const gmail = google.gmail({ version: "v1" });

	const usersRes = await gmail.users.messages.list({
		userId: userMail,
		q: query,
		auth,
		maxResults: 5
	});
	return { messages: usersRes.data.messages, nextPageToken: usersRes.data.nextPageToken };
}

async function getMailsTrialWithPage (userMail, query, nextPageToken) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://mail.google.com/"
		],
		userMail
	);

	const gmail = google.gmail({ version: "v1" });

	const usersRes = await gmail.users.messages.list({
		userId: userMail,
		q: query,
		auth,
		maxResults: 5,
		pageToken: nextPageToken
	});
	return { messages: usersRes.data.messages, nextPageToken: usersRes.data.nextPageToken };
}
*/

// getMailInfo
async function getMessageDetails (userMail, mailID) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://mail.google.com/"
		],
		userMail
	);

	const gmail = google.gmail({ version: "v1" });

	const usersRes = await gmail.users.messages.get({
		userId: userMail,
		id: mailID,
		fields: "id, payload/headers(name, value) payload/parts",
		auth
	});
	const obj = usersRes.data;
	const result = {};
	result.id = obj.id;
	obj.payload.headers.forEach(ele => {
		if (ele.name === "To" || ele.name === "From" || ele.name === "Subject" || ele.name === "Date" || ele.name === "Message-ID") {
			result[ele.name] = ele.value;
		};
	});
	if (obj.payload.parts[0].parts) {
		result.body = Buffer.from(obj.payload.parts[0].parts[0].body.data, "base64").toString("ascii");
	} else {
		result.body = Buffer.from(obj.payload.parts[0].body.data, "base64").toString("ascii");
	}
	return result;
}

async function deleteMail (userMail, mailID) {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://mail.google.com/"
		],
		userMail
	);
	const gmail = google.gmail({ version: "v1" });

	gmail.users.messages.trash({
		id: mailID,
		userId: userMail,
		auth
	});
}

function extractEmail (str) {
	const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
	const matches = str.match(emailRegex);
	return matches ? matches[0] : null;
}

async function deleteAllMails (recieversList, messageID, pushResultsToArray) {
	for (let i = 0; i < recieversList.length; i++) {
		// seprate out the email from the rest of the string
		const userEmail = extractEmail(recieversList[i].trim());

		let mailIDArray;

		try {
			mailIDArray = await getMails(userEmail, `Rfc822msgid:${messageID}`);

			if ((mailIDArray !== undefined) && Array.isArray(mailIDArray) && (mailIDArray.length !== 0)) {
				await deleteMail(userEmail, mailIDArray[0].id);
				pushResultsToArray(`Email retracted from ${userEmail}.`);
			} else {
				pushResultsToArray(`Email not available in ${userEmail}.`);
			}
		} catch (err) {
			pushResultsToArray(`${userEmail}: ${err?.data?.error}`);
		}
	}
};

async function retractMailForAllUsers (senderMail, mailID) {
	const results = [];
	const mailInfo = await getMessageDetails(senderMail, mailID);

	// mailInfo = new Map(mailInfo.headers.map((header) => [header.name, header.value]));

	// for e.g, Random User <random.user@domain.com>, Other User <other.user@domain.com>
	let recieversList = mailInfo.To;
	recieversList = recieversList.split(",");

	await deleteAllMails(recieversList, mailInfo["Message-ID"], (msg) => results.push(msg));

	try {
		await deleteMail(senderMail, mailID);
		results.push(`Email retracted from ${senderMail}.`);
	} catch (err) {
		results.push(`${senderMail}: ${err.data.error}`);
	}

	return results;
}

const getMailsAndMessageDetails = async (userMail, query) => {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://mail.google.com/"
		],
		userMail
	);

	const gmail = google.gmail({ version: "v1" });

	const usersRes = await gmail.users.messages.list({
		userId: userMail,
		q: query,
		auth,
		maxResults: 10
	});

	if (usersRes.data.messages === undefined) {
		return { messages: [] };
	}

	const messageDetails = await Promise.all(usersRes.data.messages?.map(async (message) => {
		const messageDetails = await gmail.users.messages.get({
			userId: userMail,
			id: message.id,
			fields: "id, payload",
			auth
		});
		const obj = messageDetails.data;
		const result = {
			attachments: []
		};
		result.id = obj.id;
		obj.payload.headers.forEach(ele => {
			if (ele.name === "To" || ele.name === "From" || ele.name === "Subject" || ele.name === "Date") {
				result[ele.name] = ele.value;
			};
		});

		const partQueue = [];
		partQueue.push(obj.payload);
		while (partQueue.length > 0) {
			const part = partQueue[0];
			partQueue.shift();

			if (part.filename) {
				result.attachments.push(part.filename);
			} else if (part.mimeType === "text/html") {
				result.body = Buffer.from(part.body.data, "base64").toString("utf-8");
			} else if (part.mimeType === "text/plain") {
				result.text = Buffer.from(part.body.data, "base64").toString("ascii");
			}

			if (part.parts) {
				partQueue.push(...part.parts);
			}
		}
		if (!result.body) result.body = result.text;

		return { ...result, ...message };
	}));

	// GAPI sends a pageToken when maxResults === mails left
	// In this case, the nextPage is empty and is of no use
	// Send a undefined token in this case
	const usersRes2 = usersRes.data.nextPageToken && await gmail.users.messages.list({
		userId: userMail,
		q: query,
		auth,
		maxResults: 1,
		pageToken: usersRes.data.nextPageToken,
		fields: "resultSizeEstimate"
	});
	const nextPageToken = usersRes2?.data?.resultSizeEstimate === 0
		? undefined
		: usersRes.data.nextPageToken;
	return { messages: messageDetails, nextPageToken };
};

// get next page of mails
const getMailsAndMessageDetailsWithPage = async (userMail, query, nextPageToken) => {
	const auth = getAuthToken(
		process.env.GOOGLE_EMAIL,
		process.env.GOOGLE_PRIVATE_KEY,
		[
			"https://mail.google.com/"
		],
		userMail
	);

	const gmail = google.gmail({ version: "v1" });

	const usersRes = await gmail.users.messages.list({
		userId: userMail,
		q: query,
		auth,
		maxResults: 10,
		pageToken: nextPageToken
	});

	if (usersRes.data.messages === undefined) {
		return { messages: [] };
	}

	const messageDetails = await Promise.all(usersRes.data.messages.map(async (message) => {
		const messageDetails = await gmail.users.messages.get({
			userId: userMail,
			id: message.id,
			fields: "id, payload",
			auth
		});
		const obj = messageDetails.data;
		const result = {
			attachments: []
		};
		result.id = obj.id;
		obj.payload.headers.forEach(ele => {
			if (ele.name === "To" || ele.name === "From" || ele.name === "Subject" || ele.name === "Date") {
				result[ele.name] = ele.value;
			};
		});

		const partQueue = [];
		partQueue.push(obj.payload);
		while (partQueue.length > 0) {
			const part = partQueue[0];
			partQueue.shift();

			if (part.mimeType === "text/html") {
				result.body = Buffer.from(part.body.data, "base64").toString("utf-8");
			} else if (part.mimeType === "text/plain") {
				result.text = Buffer.from(part.body.data, "base64").toString("ascii");
			} else if (part.filename) {
				result.attachments.push(part.filename);
			}

			if (part.parts) {
				partQueue.push(...part.parts);
			}
		}
		if (!result.body) result.body = result.text;
		return { ...result, ...message };
	}));

	// GAPI sends a pageToken when maxResults === mails left
	// In this case, the nextPage is empty and is of no use
	// Send a undefined token in this case
	const usersRes2 = usersRes.data.nextPageToken && await gmail.users.messages.list({
		userId: userMail,
		q: query,
		auth,
		maxResults: 1,
		pageToken: usersRes.data.nextPageToken,
		fields: "resultSizeEstimate"
	});
	const nextPageToken2 = usersRes2?.data?.resultSizeEstimate === 0
		? undefined
		: usersRes.data.nextPageToken;

	return { messages: messageDetails, nextPageToken: nextPageToken2 };
};

module.exports = {
	retractMailForAllUsers,
	getMailsAndMessageDetails,
	getMailsAndMessageDetailsWithPage
};
