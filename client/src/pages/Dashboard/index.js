import { Box, Container, Grid, Typography } from "@mui/material";
import { BasicCard, ContentHeader } from "../../components";
import { VerticalBarChart } from "../../components/Charts";
// import domainsImg from "../../assets/img/icons/unicons/domains.png";
import usersImg from "../../assets/img/icons/unicons/user.png";
import adminsImg from "../../assets/img/icons/unicons/admin.png";
import superadminsImg from "../../assets/img/icons/unicons/superadmin.png";
import { AuthConsumer } from "../../hooks";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { config } from "../../config";
import { getUserRole } from "../../helpers";

const colorScale = [
	"#5DADE2",
	"#F4D03F",
	"#F5B041",
	"#F1948A",
	"#A569BD",
	"#A3E4D7"
];

const userIcons = {
	user: usersImg,
	admin: adminsImg,
	superadmin: superadminsImg
};

const DashBoard = () => {
	const { userData } = AuthConsumer();
	const { data: userRoleData, status: userRoleStatus } = useQuery({
		queryKey: ["userStats"],
		queryFn: () => axios.get(config.urls.users.getuserRoleStats()).then(response => response.data)
	});

	const { data: userDisabledData, status: userDisabledStatus } = useQuery({
		queryKey: ["userDisabled"],
		queryFn: () => axios.get(config.urls.users.getAllUserDisabled()).then(response => response.data)
	});

	const { data: userCountData, status: userCountStatus } = useQuery({
		queryKey: ["userCount"],
		queryFn: () => axios.get(config.urls.domains.getUserCountForAllDomains()).then(response => response.data)
	});

	return (
		<Container maxWidth={false} className="h-full" style={{ overflowY: "scroll" }}>
			<div className="mt-5">
				<ContentHeader
					headerName={`Hello, ${userData.displayName}`}
					headerContent={userData.email}
					headerAvatar={userData.photoURL}
				>
					<p className="p-1 px-4 bg-green-100 border border-green-500 rolePill"><b>Role</b>: {getUserRole(userData.role)}</p>
				</ContentHeader>
			</div>
			<div className="flex mt-5" style={{ gap: "1rem" }}>
				{
					(userRoleStatus === "success") && userRoleData.map((item, index) => {
						const name = getUserRole(item.name);
						return (
							<BasicCard
								key={index}
								cardTitle={name}
								cardContent={`Total ${name}:  ${item.data}`}
								userImgUrl={userIcons[item.name]}
								isSelected={false} setSelectedUser={() => { }}>
							</BasicCard>
						);
					})
				}
			</div>
			{
				(userCountStatus === "success") &&
				<Grid container sx={{}}>
					<Grid xs={12} item>
						<Box sx={{ pt: 3, px: 3, backgroundColor: "white", my: 3, borderRadius: 2 }}>
							<Typography variant="h5" sx={{ mb: 3 }}>
								Domain - Users Count
							</Typography>
							<VerticalBarChart
								data={userCountData}
								options={{
									x: "Domains",
									y: "User count",
									color: "User count",
									// tickStep: 1000,
									colorScale
								}}
							/>
						</Box>
					</Grid>
				</Grid>
			}
			{
				(userDisabledStatus === "success") &&
				<Grid container sx={{}}>
					<Grid xs={12} item>
						<Box sx={{ pt: 3, px: 3, backgroundColor: "white", my: 3, borderRadius: 2 }}>
							<Typography variant="h5" sx={{ mb: 3 }}>
								Searched User Info
							</Typography>
							<VerticalBarChart
								data={userDisabledData}
								options={{
									x: "User Status",
									y: "User count",
									color: "User count",
									// tickStep: 500,
									colorScale
								}}
							/>
						</Box>
					</Grid>
				</Grid>
			}
		</Container>
	);
};

export default DashBoard;
