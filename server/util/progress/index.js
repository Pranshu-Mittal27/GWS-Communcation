const { Datastore } = require("@google-cloud/datastore");
const { config } = require("../../config");

const datastore = new Datastore({
	projectId: config.GCLOUD_PROJECT,
	keyFile: config.keyFile
});

const getAllProgresses = async (key, value) => {
	let query;
	if (key === undefined && value === undefined) {
		query = datastore.createQuery("Processes").select();
	} else {
		query = datastore.createQuery("Processes").select().filter(key, value);
	}
	let [tasks] = await datastore.runQuery(query);
	tasks = tasks.map(task => {
		let isContact = task[datastore.KEY].name.split("|");
		isContact = isContact[0] === "contact";
		return {
			from: task.from,
			to: task.to,
			totalCount: task.totalCount,
			current: task.current,
			key: isContact ? "contact" : "calendar",
			sync: task[datastore.KEY].name.split(":")[0].split("|")[1] === "insert"
		};
	});
	return tasks;
};

const GetProgressesById = async (Id) => {
	const key = datastore.key(["Processes", Id]);
	const entity = await datastore.get(key);
	return entity;
};

const UpdateProgressesById = async (Id, entity) => {
	// console.log("Inside Update", entity.current)
	const key = datastore.key(["Processes", Id]);
	await datastore.save({
		key,
		data: {
			totalCount: entity.totalCount,
			current: entity.current,
			from: entity.from,
			to: entity.to
		}
	});
};

const InsertProgressesById = async (syncType, insertType, entity) => {
	if (!["contact", "calendar", "resource"].includes(syncType)) {
		console.log("Invalid Sync type");
		return undefined;
	}
	if (!["insert", "remove"].includes(insertType)) {
		console.log("Invalid Insert type");
		return undefined;
	}
	const Id = `${syncType}|${insertType}:${entity.from}|${entity.to}`;
	const key = datastore.key(["Processes", Id]);
	await datastore.save({
		key,
		data: {
			totalCount: entity.totalCount,
			current: entity.current,
			from: entity.from,
			to: entity.to
		}
	});
};

const RemoveProgressesById = (Id) => {
	const key = datastore.key(["Processes", Id]);
	datastore.delete(key);
};

function calculateProgress (currentCount, totalUsers, currDomain, domainItem, insertType, syncType) {
	const progress = (currentCount / totalUsers) * 100;
	if (Math.floor(progress) % 10 === 0) {
		UpdateProgressesById(`${syncType}|${insertType}:${currDomain}|${domainItem}`, {
			from: currDomain,
			to: domainItem,
			current: currentCount,
			totalCount: totalUsers
		});
	}
	if (progress >= 100) {
		setTimeout(() => {
			RemoveProgressesById(`${syncType}|${insertType}:${currDomain}|${domainItem}`);
		}, 10 * 1000);
	}
}

module.exports = {
	getAllProgresses,
	GetProgressesById,
	UpdateProgressesById,
	InsertProgressesById,
	RemoveProgressesById,
	calculateProgress
};
