// eslint-disable-next-line max-len
const exportToMatters = require("./backup");

const {
	calendarInsertUsersACL,
	calendarInsertResourcesACL,
	insertACLRulesForUser,
	insertACLRulesForAllUsers,
	insertACLRulesForAllResources,
	insertACLRulesResourcesForUser
} = require("./calendar");
const {
	retractMailForAllUsers,
	getMailsAndMessageDetails,
	getMailsAndMessageDetailsWithPage
} = require("./gmail");
const {
	isDelegationEnabled,
	addDomain,
	searchDomains,
	getAllDomains,
	getDomainSyncStatus,
	updateDomainSyncStatus,
	addDomainSync,
	getAllDomainsData,
	setLock,
	getAllDomainsSyncStatus,
	changeAutoSyncStatus,
	deleteDomainSyncStatus,
	getUserCount,
	getUserCountFromDatabase,
	isBucketPermissionAdded,
	getDomainUpdationArrayOfWorkspace,
	getParentDomainList,
	getResourcesDatabseUpdationArray
} = require("./domain");
const {
	calendarInsertContacts,
	insertContactsForUser,
	insertContactsForAllUsers,
	getContact,

} = require("./contact");
const {
	searchUsers,
	getUserData,
	getUserSyncStatus,
	getUserDriveAutoMoveStatus,
	createUserSync,
	updateUserSyncStatus,
	getUserSyncData,
	getAllUserTypeCount,
	getAllUserDisabled,
	createUser
} = require("./user");
const {
	getAllProgresses,
	GetProgressesById,
	UpdateProgressesById,
	InsertProgressesById,
	RemoveProgressesById
} = require("./progress");
const { moveFilesForUser, moveFilesForAllUsers } = require("./drive");
const { reSyncDomain, reSyncAllDomains, getNewSuspendedUsers, getUniqueResources } = require("./autoSync");

const getDomainFromEmail = (email) => {
	return email.split("@")[1];
};

module.exports = {
	exportToMatters,
	getDomainFromEmail,
	calendarInsertUsersACL,
	calendarInsertResourcesACL,
	insertACLRulesForAllUsers,
	insertACLRulesForUser,
	insertACLRulesForAllResources,
	calendarInsertContacts,
	insertContactsForAllUsers,
	insertContactsForUser,
	retractMailForAllUsers,
	changeAutoSyncStatus,
	isDelegationEnabled,
	addDomain,
	searchDomains,
	getAllDomains,
	getAllDomainsData,
	getDomainSyncStatus,
	updateDomainSyncStatus,
	addDomainSync,
	setLock,
	getDomainUpdationArrayOfWorkspace,
	getMailsAndMessageDetails,
	getMailsAndMessageDetailsWithPage,
	searchUsers,
	getUserData,
	getUserSyncStatus,
	getUserDriveAutoMoveStatus,
	deleteDomainSyncStatus,
	getUserCount,
	getUserCountFromDatabase,
	createUserSync,
	updateUserSyncStatus,
	getUserSyncData,
	getAllProgresses,
	GetProgressesById,
	UpdateProgressesById,
	InsertProgressesById,
	RemoveProgressesById,
	getAllUserTypeCount,
	getAllUserDisabled,
	createUser,
	getAllDomainsSyncStatus,
	getContact,
	moveFilesForUser,
	moveFilesForAllUsers,
	reSyncDomain,
	reSyncAllDomains,
	insertACLRulesResourcesForUser,
	isBucketPermissionAdded,
	getNewSuspendedUsers,
	getParentDomainList,
	getResourcesDatabseUpdationArray
};
