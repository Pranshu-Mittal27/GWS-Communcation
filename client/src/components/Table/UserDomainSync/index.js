import ReactDataGrid from "@inovua/reactdatagrid-community";
import "@inovua/reactdatagrid-community/base.css";
import "@inovua/reactdatagrid-community/theme/default-light.css";
import PropTypes from "prop-types";
import { Button, Container, Stack, Box, IconButton } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import SelectFilter from "@inovua/reactdatagrid-community/SelectFilter";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { MdSync } from "react-icons/md";

import "./index.css";
import { useState } from "react";

const filterValue = [
	{
		name: "name",
		operator: "contains",
		type: "string",
		value: ""
	},
	{
		name: "mailStatus",
		operator: "eq",
		type: "boolean",
		value: null
	},
	{
		name: "contactStatus",
		operator: "eq",
		type: "boolean",
		value: null
	}
];

const columns = [
	{ name: "name", header: "Name", defaultFlex: 1, filter: true },
	{ name: "description", header: "Description", defaultFlex: 1 },
	{
		name: "mailStatus",
		header: "Mail Status",
		defaultFlex: 1,
		render: ({ value }) => {
			return value
				? (
					<Box display={"flex"} alignItems="center" justifyContent={"space-between"} width="25%">
						<Box display={"flex"} alignItems="center">
							<CheckCircleOutlineIcon fontSize="small" sx={{ color: "green", marginRight: "5px" }} />
							{/* <Typography variant="body2" >Synced</Typography> */}
						</Box>
						{/* <IconButton sx={{
							color: "#3c82f6",
							boxShadow: "0px 0px 1px 0px #0e0e0e",
							padding: "0px",
							margin: "2px"
						}}>
							<MdSyncDisabled size={20} />
						</IconButton> */}
					</Box>
				)
				: (
					<Box display={"flex"} alignItems="center" justifyContent={"space-between"} width="25%">
						{/* <Box display={"flex"} alignItems="center">
							<ErrorOutlineIcon fontSize="small" sx={{ color: "#f65f0a", marginRight: "5px" }} />
							<Typography variant="body2" >Not Synced</Typography>
						</Box> */}
						<IconButton sx={{
							color: "#3c82f6",
							boxShadow: "0px 0px 1px 0px #0e0e0e",
							padding: "0px",
							margin: "2px"
						}}>
							<MdSync size={20} />
						</IconButton>
					</Box>
				);
		},
		filterEditor: SelectFilter,
		filterEditorProps: {
			placeholder: "Select",
			dataSource: [
				{ id: true, label: "Synced" },
				{ id: false, label: "Not Synced" }
			]
		}
	},
	{
		name: "contactStatus",
		header: "Contact Status",
		defaultFlex: 1,
		render: ({ value }) => {
			return value
				? (
					<Box display={"flex"} alignItems="center" justifyContent={"space-between"} width="25%">
						<Box display={"flex"} alignItems="center">
							<CheckCircleOutlineIcon fontSize="small" sx={{ color: "green", marginRight: "5px" }} />
							{/* <Typography variant="body2" >Synced</Typography> */}
						</Box>
						{/* <IconButton sx={{
							color: "#3c82f6",
							boxShadow: "0px 0px 1px 0px #0e0e0e",
							padding: "0px",
							margin: "2px"
						}}>
							<MdSyncDisabled size={20} />
						</IconButton> */}
					</Box>
				)
				: (
					<Box display={"flex"} alignItems="center" justifyContent={"space-between"} width="25%">
						{/* <Box display={"flex"} alignItems="center">
							<ErrorOutlineIcon fontSize="small" sx={{ color: "#f65f0a", marginRight: "5px" }} />
							<Typography variant="body2" >Not Synced</Typography>
						</Box> */}
						<IconButton sx={{
							color: "#3c82f6",
							boxShadow: "0px 0px 1px 0px #0e0e0e",
							padding: "0px",
							margin: "2px"
						}}>
							<MdSync size={20} />
						</IconButton>
					</Box>
				);
		},
		filterEditor: SelectFilter,
		filterEditorProps: {
			placeholder: "Select",
			dataSource: [
				{ id: true, label: "Synced" },
				{ id: false, label: "Not Synced" }
			]
		}
	}
];

const UserDomainSyncTable = ({ tableData }) => {
	const [toggleFilters, setToggleFilters] = useState(false);
	return (
		<Stack spacing={2}>
			<Container sx={{
				display: "flex",
				justifyContent: "flex-end",
				alignItems: "center",
				padding: "1rem 0",
				paddingBottom: "0"
			}}>
				<Button
					className="mui-toggle-filter-button"
					onClick={() => setToggleFilters(!toggleFilters)}
				>
					{toggleFilters ? <FilterListOffIcon /> : <FilterListIcon />} Toggle Filters
				</Button>
			</Container>
			<ReactDataGrid
				theme="default-light"
				columns={columns}
				dataSource={tableData}
				defaultLimit={10}
				defaultSkip={0}
				defaultSortInfo={{ name: "domain", dir: "asc" }}
				style={{ minHeight: 350 }}
				defaultFilterValue={filterValue}
				enableColumnAutosize
				showCellBorders={"horizontal"}
				showColumnMenuTool={false}
				enableColumnFilterContextMenu={false}
				resizable={false}
				pageSizes={[10, 20, 50, 100]}
				pagination
				enableFiltering={toggleFilters}
			/>
		</Stack>
	);
};

UserDomainSyncTable.propTypes = {
	tableData: PropTypes.array.isRequired,
	columns: PropTypes.array.isRequired,
	filterValue: PropTypes.array.isRequired
};

export default UserDomainSyncTable;
