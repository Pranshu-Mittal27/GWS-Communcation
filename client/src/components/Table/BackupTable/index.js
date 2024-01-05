/* eslint-disable no-tabs */
import { useCallback, useEffect, useState } from "react";
import ReactDataGrid from "@inovua/reactdatagrid-community";
import "@inovua/reactdatagrid-community/index.css";
import "./index.css";
import PropTypes from "prop-types";
import { DateTime } from "luxon";
import gmailIcon from "../../../assets/img/icons/unicons/gmailIcon.png";
import driveIcon from "../../../assets/img/icons/unicons/driveIcon.png";
import chatIcon from "../../../assets/img/icons/unicons/chatIcon.png";
import groupIcon from "../../../assets/img/icons/unicons/groupIcon.png";
import linkIcon from "../../../assets/img/icons/unicons/linkIcon.png";
import { Tooltip } from "@mui/material";
// import { Loader } from "../../../components";
import { config } from "../../../config";
import axios from "axios";
import notify from "../../../components/Toast";
import { ModalConsumer } from "../../../hooks";

const columns = (dayMode) => [
	{
		name: "params",
		header: "User email",
		defaultFlex: 2,
		textAlign: "center",
		headerProps: {
			style: {
				border: "none"
			}
		},
		visible: !dayMode,
		render: ({ value }) => {
			return JSON.parse(value).accountEmail;
		}
	},
	{
		name: "service",
		header: "Service",
		defaultFlex: 1,
		textAlign: "center",
		headerProps: {
			style: {
				border: "none"
			}
		},
		render: ({ value }) => {
			if (value === "gmail") {
				return <img src={gmailIcon} alt="gmail" className="aspect-ratio-1 w-5"/>;
			} else if (value === "drive") {
				return <img src={driveIcon} alt="drive" className="aspect-ratio-1 w-5"/>;
			} else if (value === "chat") {
				return <img src={chatIcon} alt="chat" className="aspect-ratio-1 w-5"/>;
			} else if (value === "groups") {
				return <img src={groupIcon} alt="chat" className="aspect-ratio-1 w-5"/>;
			}
		}
	},
	{
		name: "initiatedTime",
		header: "Initiated Time",
		defaultFlex: 1.5,
		textAlign: "center",
		headerProps: {
			style: {
				border: "none"
			}
		},
		render: ({ value }) => {
			if (value === 0) return "Not started yet";
			return DateTime.fromMillis(value).toFormat("dd-MM-yyyy HH:mm");
		}
	},
	{
		name: "completedTime",
		header: "Completed Time",
		defaultFlex: 1.5,
		textAlign: "center",
		headerProps: {
			style: {
				border: "none"
			}
		},
		render: ({ value }) => {
			if (value === 0) return "Not started yet";
			return DateTime.fromMillis(value).toFormat("dd-MM-yyyy HH:mm");
		}
	},
	{
		name: "statusCode",
		header: "Status",
		defaultFlex: 1,
		textAlign: "center",
		headerProps: {
			style: {
				border: "none"
			}
		},
		render: ({ value }) => {
			let status = "";
			if (value === 0) {
				status = "Yet to start";
			} else if (value === 1) {
				status = "Completed";
			} else if (value === 2) {
				status = "On going";
			} else if (value === -1) {
				status = "License not available";
			} else if (value === 4) {
				status = "Deleted";
			}
			return status;
		}
	},
	{
		name: "percentage",
		header: "Percentage",
		defaultFlex: 1,
		textAlign: "center",
		headerProps: {
			style: {
				border: "none"
			}
		},
		render: ({ data }) => {
			console.log("value: ", data);
			if (data.statusCode === 1) return "100%";
			if (data.percentage === "") return "-";
			return data.percentage + "%";
		}
	},
	{
		name: "cloudStorage",
		header: "Backup",
		defaultFlex: 0.75,
		textAlign: "center",
		headerProps: {
			style: {
				border: "none"
			}
		},
		render: ({ data }) => {
			if (data.statusCode !== 1) return "-";
			return <Tooltip title={"Click to open backup bucket"}><a href={data.cloudStorage} target="_blank" rel="noreferrer"><img src={linkIcon} alt="chat" className="aspect-ratio-1 w-5 linkZoom"/></a></Tooltip>;
		}
	},
	{
		name: "exportId",
		header: "Delete",
		defaultFlex: 0.75,
		textAlign: "center",
		headerProps: {
			style: {
				border: "none"
			}
		},
		render: ({ data }) => {
			if (data.statusCode !== 1) return "-";

			const { dispatch: dispatchModal } = ModalConsumer();
			const deleteObject = {
				accountEmail: JSON.parse(data.params).accountEmail,
				viewLink: data.cloudStorage,
				exportId: data.exportId,
				matterId: data.matterId
			};

			const deleteBackup = async () => {
				console.log("requestBackup: ", deleteObject);
				let response = await axios.post(config.urls.backup.delete(), deleteObject);
				if (response.status === 404) {
					// setLoading(false);
					return Promise.resolve([]);
				}
				response = response.data;
				notify.success(response.result);
				// getMatterStatus();
				setTimeout(() => {
				}, 5000);
				window.location.reload();
				console.log("deleteBackup res: ", response);
			};

			const deleteBackupModal = (e) => {
				e.preventDefault();
				dispatchModal({
					type: "open",
					payload: {
						title: "Delete backup",
						content: "This will delete the complete backup of the selected user. Do you want to proceed?",
						onSuccess: deleteBackup
					}
				});
			};

			return <Tooltip onClick={deleteBackupModal} title={"Click to delete bucket data"}><img src={linkIcon} alt="chat" className="aspect-ratio-1 w-5 linkZoom"/></Tooltip>;
			// return (
			// 	<div>
			// 		{!loading
			// 			? <Tooltip onClick={deleteBackupModal} title={"Click to delete bucket data"}><img src={linkIcon} alt="chat" className="aspect-ratio-1 w-5 linkZoom"/></Tooltip>
			// 			: <Loader />
			// 		}
			// 	</div>
			// );
		}
	}
];

const gridStyle = { height: "99%" };

// const dataSource = [
// 	{ id: 1, firstName: 'John', lastName: 'McQueen', phoneNumber: '1234567890', callState: 0, duration: 350 },
// 	{ id: 2, firstName: 'Mary', lastName: 'Stones', phoneNumber: '1234567890', callState: 2, duration: 250 },
// 	{ id: 3, firstName: 'Robert', lastName: 'Fil', phoneNumber: '1234567890', callState: 0, duration: 270 },
// 	{ id: 4, firstName: 'Roger', lastName: 'Robson', phoneNumber: '1234567890', callState: 2, duration: 810 },
// 	{ id: 5, firstName: 'Billary', lastName: 'Konwik', phoneNumber: '1234567890', callState: 0, duration: 180 },
// 	{ id: 6, firstName: 'Bob', lastName: 'Martin', phoneNumber: '1234567890', callState: 2, duration: 180 },
// 	{ id: 7, firstName: 'Matthew', lastName: 'Richardson', phoneNumber: '1234567890', callState: 2, duration: 540 },
// 	{ id: 8, firstName: 'Ritchie', lastName: 'Peterson', phoneNumber: '1234567890', callState: 0, duration: 540 },
// 	{ id: 9, firstName: 'Bryan', lastName: 'Martin', phoneNumber: '1234567890', callState: 1, duration: 400 },
// 	{ id: 10, firstName: 'Mark', lastName: 'Martin', phoneNumber: '1234567890', callState: 1, duration: 440 },
// 	{ id: 11, firstName: 'Michelle', lastName: 'Sebastian', phoneNumber: '1234567890', callState: 0, duration: 240 },
// 	{ id: 12, firstName: 'Michelle', lastName: 'Sullivan', phoneNumber: '1234567890', callState: 3, duration: 610 },
// 	{ id: 13, firstName: 'Jordan', lastName: 'Bike', phoneNumber: '1234567890', callState: 3, duration: 160 },
// 	{ id: 14, firstName: 'Nelson', lastName: 'Ford', phoneNumber: '1234567890', callState: 0, duration: 340 },
// 	{ id: 15, firstName: 'Tim', lastName: 'Cheap', phoneNumber: '1234567890', callState: 3, duration: 30 },
// 	{ id: 16, firstName: 'Robert', lastName: 'Carlson', phoneNumber: '1234567890', callState: 3, duration: 310 },
// 	{ id: 17, firstName: 'Johny', lastName: 'Perterson', phoneNumber: '1234567890', callState: 0, duration: 400 }
// ]

const BackupTable = ({ fetchData, shouldRefresh, dayMode = false }) => {
	const [gridRef, setGridRef] = useState(null);
	const loadData = useCallback(async () => {
		const data = await fetchData();
		return data;
	}, [fetchData]);

	useEffect(() => {
		if (gridRef && shouldRefresh) {
			gridRef.current.reload();
		}
	}, [gridRef, shouldRefresh]);

	const defaultSortInfo = { name: "initiatedTime", dir: -1, type: "number" };

	return (
		<ReactDataGrid
			onReady={setGridRef}
			className="last-20-calls-grid"
			idProperty="id"
			columns={columns(dayMode)}
			dataSource={loadData}
			style={gridStyle}
			showColumnMenuTool={false}
			showCellBorders="horizontal"
			showZebraRows={false}
			rowFocusClassName="row-focus"
			activeRowIndicatorClassName='active-row-indicator'
			defaultSortInfo={defaultSortInfo}
		/>
	);
};

BackupTable.propTypes = {
	fetchData: PropTypes.func,
	shouldRefresh: PropTypes.bool,
	dayMode: PropTypes.bool
};

export default BackupTable;
