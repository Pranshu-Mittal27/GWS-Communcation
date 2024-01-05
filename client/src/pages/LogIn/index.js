import { AuthConsumer } from "../../hooks";
import { BsGoogle } from "react-icons/bs";

import {
	Container,
	Divider,
	IconButton,
	Stack
} from "@mui/material";
import { useState } from "react";

const LogIn = () => {
	const { logIn } = AuthConsumer();
	const [disableButton, setDisableButton] = useState(false);

	const handleGoogleLogin = () => {
		setDisableButton(true);
		setTimeout(() => setDisableButton(false), 4000);
		logIn();
	};

	return (
		<Stack
			direction="row"
			sx={{
				height: "100vh",
				backgroundColor: "#f5f5f9"
			}}
		>
			<Container
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center"
				}}
			>
				<Stack
					sx={{
						width: "50%",
						backgroundColor: "#fefefe",
						padding: "2rem",
						borderRadius: "0.5rem",
						boxShadow: "0 2px 6px 0 rgb(67 89 113 / 12%)"
					}}
				>
					<Container
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center"
						}}
					>
						<img
							width={"50%"}
							src={require("../../assets/img/illustrations/78126-secure-login.gif")}
							alt=""
						/>
					</Container>
					<Divider />
					<Container
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							padding: "1.5rem"
						}}
					>
						<h3 style={{ fontSize: "1.5rem" }}>Login with Google SSO</h3>
					</Container>
					<Container
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center"
						}}
					>
						<IconButton
							variant="contained"
							disabled={disableButton}

							sx={{
								// width: "30%",
								padding: "0.5rem",
								backgroundColor: "#000",
								color: "#fff",
								borderRadius: "5px",
								"&:hover": {
									backgroundColor: "#000"
								}

							}}
							onClick={handleGoogleLogin}
						>
							<BsGoogle />
						</IconButton>
					</Container>
				</Stack>
			</Container>
		</Stack>
	);
};

export default LogIn;
