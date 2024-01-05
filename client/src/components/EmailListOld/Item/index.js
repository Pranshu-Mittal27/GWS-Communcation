import { memo } from "react";
import { splitSeconds, truncateString } from "../../../helpers";
import PropTypes from "prop-types";

import "./index.css";

const EmailListItem = ({ email, openEmail, selected, addDeleteEmail, removeDeleteEmail }) => {
	const toggleDelete = (e) => {
		if (e.target.checked) {
			addDeleteEmail(email?.id);
		} else {
			removeDeleteEmail(email?.id);
		}
	};

	return (
		<div className={"email-item" + (selected ? " active" : "")}>
			<div>
				<input type={"checkbox"} className="form-check-input" onChange={toggleDelete} />
			</div>
			<div
				onClick={() => openEmail(email?.id)}
			>
				<div className="email-item__name">
					{`  ${email?.From}`}
				</div>
				<div className="email-item__subject">
					<strong>{email?.Subject}</strong>
				</div>
				{/* <div className="email-item__read" data-read={email.read}></div> */}
				<div className="email-item__time">{splitSeconds(email?.Date)}</div>

				<div className="email-item__message"><p>{truncateString(email?.body, 85)}</p></div>
			</div>
		</div>
	);
};

EmailListItem.propTypes = {
	email: PropTypes.object.isRequired,
	openEmail: PropTypes.func.isRequired,
	selected: PropTypes.any.isRequired,
	addDeleteEmail: PropTypes.func.isRequired,
	removeDeleteEmail: PropTypes.func.isRequired
};

export default memo(EmailListItem);
