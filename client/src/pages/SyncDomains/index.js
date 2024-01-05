/*eslint-disable*/
import { useCallback, useMemo, useState } from "react";
import { config } from "../../config";
import { AdminLayout } from "../../layouts";
import axios from "axios";
import { getDomainFromEmail } from "../../helpers";
import { ModalConsumer, useEventSource } from "../../hooks";
import closeIcon from "../../assets/img/icons/unicons/closeIcon.png";
import doneImg from "../../assets/img/icons/unicons/Done.png";
import calendarImg from "../../assets/img/icons/brands/google-calendar.png";
import contactImg from "../../assets/img/icons/brands/google-contacts.png";
import progressImg from "../../assets/img/icons/unicons/progress.png";
import tagImg from "../../assets/img/icons/unicons/tag.png";

const SyncDomains = () => {
	const { dispatch: dispatchModal } = ModalConsumer();
	const searchFetch = useCallback(async (query) => {
		let response = await axios.get(config.urls.domains.get(query));

		if (response.status === 404) {
			return Promise.resolve([]);
		}

		response = response.data;

		if (Array.isArray(response) && (response.length > 0)) {
			response = response.map((item) => {
				return {
					name: item.domain,
					email: item.email
				};
			});
		}

		return Promise.resolve(response);
	}, []);

	const syncDomain = async (syncObject, refetchData, unSync) => {
		// Body formate to change
		// const body = {
		// 	email: syncObject.userEmail,
		// 	calendarList: [dom1,dom2],
		// 	contactList: [dom1,dom2]
		// 	insert: false/true - meaning unsync/sync
		// };
		syncObject["insert"] = !unSync;
		console.log("syncObject: ", syncObject);
		const response = await axios.post(config.urls.domains.syncDomainWithDomains(), syncObject);
		refetchData();
		return response;
	};
	const contentHeaderSyncButtonAction = (syncObject, refetchData, unSync) => {
		dispatchModal({
			type: "open",
			payload: {
				title: `${!unSync ? "Sync" : "Un-sync"} Domain`,
				content: `Do you want to ${!unSync ? "sync" : "un-sync"} domain with all the selected domains?`,
				onSuccess: () => syncDomain(syncObject, refetchData, unSync)
			}
		})
	};

	// const unSyncDomain = async (syncObject, refetchData) => {
	// 	console.log("UnSync domains clicked");
	// 	console.log("syncObject: ", syncObject);
	// 	syncObject["insert"] = false;
	// 	console.log("syncObject", syncObject);
	// 	const response = await axios.post(config.urls.domains.syncDomainWithDomains(), syncObject);
	// 	refetchData();
	// 	return response;
	// };
	// const contentHeaderUnSyncButtonAction = (syncObject, refetchData) => {
	// 	dispatchModal({
	// 		type: "open",
	// 		payload: {
	// 			title: "Un-Sync Domain",
	// 			content: "Do you want to un-sync domain with all the selected domains?",
	// 			onSuccess: () => unSyncDomain(syncObject, refetchData)
	// 		}
	// 	});
	// };

	const changeAutoSyncStatus = async (domain, autoSync, setAutoSyncStatus) => {
		const response = await axios.put(config.urls.domains.changeAutoSyncStatus(domain), {
			autoSync
		});
		if (response.status === 200) {
			setAutoSyncStatus(autoSync);
		}
		return response;
	};

	const toggleAutoSyncEnable = (e, autoSyncStatus, domain, setAutoSyncStatus) => {
		e.preventDefault();
		dispatchModal({
			type: "open",
			payload: {
				title: !autoSyncStatus ? "Enable Auto Sync" : "Disable Auto Sync",
				content: `This feature will start automatic ${!autoSyncStatus ? "syncing" : "un-syncing"} of new users added or removed. Do you want to ${!autoSyncStatus ? "enable" : "disable"} Auto Sync?`,
				onSuccess: () => changeAutoSyncStatus(domain, !autoSyncStatus, setAutoSyncStatus)
			}
		});
	};

	const tableDataFetch = useCallback(async (domain) => {
		let response = await axios.get(config.urls.domains.syncStatus(domain.name));

		response = response.data;
		console.log("domain Response", response);
		return response;
	}, []);

	const resources = useMemo(() => {
		return [
			{
				key: "calendarStatus",
				value: "Calendar",
				defaultSelection: 1,
				states: [
					{
						filter: {
							key: "calendarStatus",
							value: true
						},
						label: "synced",
						icon: {
							enabled: <img src={require("../../assets/img/icons/unicons/sync-enabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/unicons/sync-disabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: "0.3" }} />
						}
					},
					{
						filter: {
							key: "calendarStatus",
							value: "all"
						},
						label: "all",
						icon: {
							enabled: <img src={require("../../assets/img/icons/brands/google-calendar.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/brands/google-calendar.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: "0.3" }} />
						}
					},
					{
						filter: {
							key: "calendarStatus",
							value: false
						},
						label: "not-synced",
						icon: {
							enabled: <img src={require("../../assets/img/icons/unicons/un-sync-enabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/unicons/un-sync-disabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: "0.3" }} />
						}
					}
				]
			},
			{
				key: "contactStatus",
				value: "Contacts",
				defaultSelection: 1,
				states: [
					{
						filter: {
							key: "contactStatus",
							value: true
						},
						label: "synced",
						icon: {
							enabled: <img src={require("../../assets/img/icons/unicons/sync-enabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/unicons/sync-disabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: "0.3" }} />
						}
					},
					{
						filter: {
							key: "contactStatus",
							value: "all"
						},
						label: "all",
						icon: {
							enabled: <img src={require("../../assets/img/icons/brands/google-contacts.png")} alt="filter" style={{ width: "16px", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/brands/google-contacts.png")} alt="filter" style={{ width: "16px", cursor: "pointer", opacity: "0.3" }} />
						}
					},
					{
						filter: {
							key: "contactStatus",
							value: false
						},
						label: "not-synced",
						icon: {
							enabled: <img src={require("../../assets/img/icons/unicons/un-sync-enabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/unicons/un-sync-disabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: "0.3" }} />
						}
					}
				]
			},
			{
				key: "resourceStatus",
				value: "Calendar Resources",
				defaultSelection: 1,
				states: [
					{
						filter: {
							key: "resourceStatus",
							value: true
						},
						label: "synced",
						icon: {
							enabled: <img src={require("../../assets/img/icons/unicons/sync-enabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/unicons/sync-disabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: "0.3" }} />
						}
					},
					{
						filter: {
							key: "resourceStatus",
							value: "all"
						},
						label: "all",
						icon: {
							enabled: <img src={require("../../assets/img/icons/brands/calendar-resources.png")} alt="filter" style={{ width: "16px", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/brands/calendar-resources.png")} alt="filter" style={{ width: "16px", cursor: "pointer", opacity: "0.3" }} />
						}
					},
					{
						filter: {
							key: "resourceStatus",
							value: false
						},
						label: "not-synced",
						icon: {
							enabled: <img src={require("../../assets/img/icons/unicons/un-sync-enabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/unicons/un-sync-disabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: "0.3" }} />
						}
					},
				]
			}
		];
	}, []);

	const [openBackDrop, setOpenBackDrop] = useState(false);
	const [progressData] = useEventSource(config.urls.progresses.get(), openBackDrop, []);
	console.log("progressData", progressData);

	const getCurrentProgress = useCallback(() => {
		setOpenBackDrop(true);
	}, []);

	return (
		<>
			{
				openBackDrop
					? <div
						className="p-5"
						style={{
							position: "absolute",
							top: 0,
							right: 0,
							width: "35dvw",
							height: "100dvh",
							display: "grid",
							gridTemplateRows: "min-content auto",
							color: "white",
							zIndex: 999,
							backgroundColor: "rgba(0, 0, 0, 0.8)"
						}}
					>
						<div className="flex justify-between items-center p-5 text-2xl">
							All Sync Processes
							<img src={closeIcon} className="cursor-pointer" style={{ width: "2rem", aspectRatio: "1/1" }} onClick={() => setOpenBackDrop(false)} />
						</div>
						<div
							className="flex h-full flex-col overflow-scroll"
							style={{ gap: "1rem" }}
						>
							{
								(Array.isArray(progressData) && (progressData.length > 0))
									? progressData.map((item, index) => {
										return (
											<div
												className={`flex flex-col p-4 ${item.sync ? "bg-green-100" : "bg-yellow-100"} text-gray-700 rounded-md`}
												style={{
													gap: "0.5rem"
												}}
												key={index}
											>
												<div className="flex justify-between items-start">
													<div className="flex flex-col items-center justify-between h-full">
														<p className="test-xs text-gray-400 mb-1">{item.sync ? "Sync" : "Unsync"}</p>
														<img src={(item.key === "contact") ? contactImg : calendarImg} style={{ height: "4rem" }} className="cursor-pointer" />
													</div>
													<div className="flex flex-col items-end justify-between h-full">

														<p className="flex items-center" style={{ gap: "1rem" }}><img src={progressImg} className="aspect-ration-1 w-7" />{`${item.current} / ${item.totalCount}`}</p>
														<p className="flex justify-end items-center" style={{ gap: "0.5rem" }}><img src={tagImg} className="aspect-ration-1 w-5" />{item.from} {"-->"} {item.to}</p>
													</div>
												</div>
											</div>
										);
									})
									: <img src={doneImg} className="w-full aspect-ratio-1 p-20" />
							}
						</div>
					</div>
					: null
			}
			<AdminLayout
				pageName="Domain"
				searchFetch={searchFetch}
				contentHeaderSyncButtonAction={contentHeaderSyncButtonAction}
				// contentHeaderUnSyncButtonAction={contentHeaderUnSyncButtonAction}
				placeHolderForSearchBar={"Search Domains..."}
				tableDataFetch={tableDataFetch}
				keyToSearchBy={"name"}
				resources={resources}
				showProgress={true}
				getCurrentProgress={getCurrentProgress}
				changeAutoSyncStatus={changeAutoSyncStatus}
				toggleAutoSyncEnable={toggleAutoSyncEnable}
			/>
		</>
	);
};

export default SyncDomains;
