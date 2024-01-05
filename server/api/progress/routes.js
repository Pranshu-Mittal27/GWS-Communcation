/* eslint-disable no-tabs */
const { Router } = require("express");
const { z } = require("zod");
// const { sse } = require("../../middleware");
const router = Router();
const { getAllProgresses, GetProgressesById, UpdateProgressesById } = require("../../util");

router.get("/getProgress", (req, res, next) => {
	async function myFunction () {
		try {
			const progresses = await getAllProgresses();
			// res.write(`data: ${JSON.stringify(progresses)}\n\n`);
			res.send(progresses);
		} catch (err) {
			next(err);
			// res.write(`error: ${JSON.stringify(err)}\n\n`);
		}
		console.log(`[log]: ${req.method} --- ${decodeURI(req.url)} --- ${res.statusCode} ${res.statusMessage}`);
	}

	myFunction();
	// const interval = setInterval(async () => {
	// 	myFunction();
	// }, 5 * 1000);

	// // once the request is closed server should close the connection
	// res.on("close", () => {
	// 	console.log(`[log]: ${req.method} --- ${decodeURI(req.url)} --- 444 Connection Closed`);
	// 	clearInterval(interval);
	// });
});

router.get("/getProgress/:key/:value", async (req, res, next) => {
	const { key, value } = req.params;

	const paramsSchema = {
		key: z.string(),
		value: z.string()
	};

	if (!paramsSchema.key.safeParse(key).success) {
		res.status(400).status({
			message: "Bad Request, valid key required"
		});
		return;
	}

	if (!paramsSchema.value.safeParse(value).success) {
		res.status(400).status({
			message: "Bad Request, valid value required"
		});
		return;
	}
	try {
		const progresses = await getAllProgresses(key, value);
		res.status(200).send(progresses);
	} catch (err) {
		next(err);
	}
});

router.get("/getProgress/:Id", async (req, res, next) => {
	const { Id } = req.params;

	const IdSchema = z.string().email();

	if (!IdSchema.safeParse(Id).success) {
		res.status(400).status({
			message: "Bad Request, valid Id required"
		});
		return;
	}

	try {
		const progresses = await GetProgressesById(Id);
		res.status(200).send(progresses);
	} catch (err) {
		next(err);
	}
});

router.post("/updateProgress", async (req, res, next) => {
	const { Id, status } = req.body;

	if (Id === undefined) {
		res.status(400).send({
			message: "Bad Request, valid Id required"
		});
		return;
	}
	if (status === undefined) {
		res.status(400).send({
			message: "Bad Request, valid status required"
		});
		return;
	}

	try {
		const progresses = await GetProgressesById(Id);
		await UpdateProgressesById(Id, {
			...progresses[0],
			status: {
				...status
			}
		});
		res.status(200).send("SuccessFully Updated Entity");
	} catch (err) {
		next(err);
	}
});

module.exports = router;
