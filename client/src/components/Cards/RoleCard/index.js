import PropTypes from "prop-types";

const RoleCard = ({ title, content, avatar, onClick, assigned }) => {
	return (
		<div
			className="flex flex-col flex-grow flex-basis items-center justify-between h-full w-full text-center bg-blue-100 rounded-md"
			style={{
				padding: "3em"
			}}
		>
			{avatar}
			<div className="m-0 my-8">
				<h2 className="font-bold text-2xl">{title}</h2>
			</div>
			<div className="m-0 my-8">
				<ul className="text-md p-0" style={{ listStyle: "none" }}>
					{
						content.map((item, key) => <li key={key}>{item}</li>)
					}
				</ul>
			</div>
			<button
				className={`outline-none inline-block font-bold text-md rounded-md px-10 py-3 text-white ${(assigned) ? "bg-gray-500 cursor-default" : "bg-blue-500 cursor-pointer"}`}
				onClick={onClick}
				disabled={assigned}
				style={{
					transition: "all 250ms ease-in-out"
				}}
			>
				{assigned ? "Assigned" : "Assign"}
			</button>
		</div >
	);
};

RoleCard.propTypes = {
	title: PropTypes.string.isRequired,
	content: PropTypes.array.isRequired,
	avatar: PropTypes.element.isRequired,
	onClick: PropTypes.func.isRequired,
	assigned: PropTypes.bool.isRequired
};

export default RoleCard;
