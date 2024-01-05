import { Link, useNavigate } from "react-router-dom";
import unauthorizedImg from "../../assets/img/illustrations/unauthorized-access.png";

const Unauthorized = () => {
	const navigate = useNavigate();
	return (
		<div className="w-full h-screen flex items-center justify-center">
			<div className="flex flex-col items-center" style={{ gap: "1rem" }}>
				<h2 className="mx-2">Unauthorized Access</h2>
				<p className="mx-2">Inufficient rights to access the requested URL.</p>
				<div className="mb-3">
					<img
						src={unauthorizedImg}
						alt="page-misc-error-light"
						style={{
							maxWidth: "25rem"
						}}
						data-app-dark-img="illustrations/page-misc-error-dark.png"
						data-app-light-img="illustrations/page-misc-error-light.png"
					/>
				</div>
				<Link className="bg-blue-100 text-blue-500 px-5 py-2 rounded-md" to={navigate("/")}>Back to home</Link>
			</div>
		</div>
	);
};

export default Unauthorized;
