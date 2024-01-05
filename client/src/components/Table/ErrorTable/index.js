/* eslint-disable*/
import { useCallback, useEffect, useState } from "react";
import ReactDataGrid from "@inovua/reactdatagrid-community";
import "@inovua/reactdatagrid-community/index.css";
import "./index.css";
import PropTypes from "prop-types";
import { DateTime } from "luxon";

const columns = (dayMode) => [
	{
		name: "adminEmail",
		header: "Admin email",
		defaultFlex: 2,
		textAlign: "center",
		headerProps: {
			style: {
				border: "none"
			}
		},
		visible: !dayMode,
		render: ({ value }) => {
			return value;
		}
	},
    {
		name: "userEmail",
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
			return value;
		}
	},
	{
		name: "createdTime",
		header: "Upload Time",
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
		name: "errorMsg",
		header: "Error Msg",
		defaultFlex: 2.5,
		textAlign: "center",
		headerProps: {
			style: {
				border: "none"
			}
		},
		render: ({ value }) => {
			return value;
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

const ErrorTable = ({ fetchData, shouldRefresh, dayMode = false }) => {
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

	const defaultSortInfo = { name: "createdTime", dir: -1, type: "number" };

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

ErrorTable.propTypes = {
	fetchData: PropTypes.func,
	shouldRefresh: PropTypes.bool,
	dayMode: PropTypes.bool
};

export default ErrorTable;
