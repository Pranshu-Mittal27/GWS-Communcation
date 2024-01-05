import Modal from "@mui/material/Modal";
import PropTypes from "prop-types";
import { memo, useRef } from "react";
import { AuthConsumer, ModalConsumer } from "../../hooks";
import "./index.css";
import confirmationImg from "../../assets/img/icons/unicons/confirmation.png";

const ConfirmationModal = () => {
	const { state, dispatch } = ModalConsumer();
	return (
		<Modal
			open={state.isOpen}
			onClose={() => {
				dispatch({
					type: "close"
				});
			}}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
			className="flex flex-col justify-center items-center"
		>
			<div
				className="flex flex-col justify-center items-center bg-white px-10 py-5 rounded-md"
				style={{
					gap: "1.3rem",
					width: "30rem"
				}}
			>
				<img src={confirmationImg} className="w-20" />
				<h2 className="text-center font-medium">
					{state.title}
				</h2>
				<p className="text-center text-gray-100">
					{state.content}
				</p>
				<div
					className="flex justify-center"
					style={{
						gap: "1rem"
					}}
				>
					<button
						type="button"
						className="bg-gray-100 text-gray-500 px-10 py-2 rounded-md"
						data-bs-dismiss="modal"
						onClick={(e) => {
							e.preventDefault();
							dispatch({
								type: "close"
							});
						}}
					>
						Close
					</button>
					<button
						type="button"
						className="bg-blue-100 text-blue-500 px-10 py-2 rounded-md"
						onClick={(e) => {
							e.preventDefault();
							dispatch({
								type: "success"
							});
						}}
					>
						Confirm
					</button>
				</div>
			</div>
		</Modal >
	);
};

export {
	ConfirmationModal
};

const FilterModal = ({ open, handleClose, searchForQuery }) => {
	const recieverMailRef = useRef(null);
	const { userData } = AuthConsumer();
	return (
		<Modal
			open={open}
			onClose={handleClose}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<div className="modal-dialog" role="document">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title" id="exampleModalLabel1">Search Filter</h5>
						<button
							type="button"
							className="btn-close"
							data-bs-dismiss="modal"
							aria-label="Close"
							onClick={handleClose}
						></button>
					</div>
					<div className="modal-body">
						<div className="row">
							<div className="col mb-3">
								<label htmlFor="nameBasic" className="form-label">From</label>
								<input type="text" id="nameBasic" className="form-control" placeholder="Enter Name" value={userData.email} disabled={true} />
							</div>
							<div className="col mb-3">
								<label htmlFor="nameBasic" className="form-label">To</label>
								<input type="text" ref={recieverMailRef} id="nameBasic" className="form-control" placeholder="user.name@domain.com" />
							</div>
						</div>
						<div className="row">
							<div className="col mb-0">
								<label htmlFor="emailBasic" className="form-label">Subject</label>
								<input type="text" id="emailBasic" className="form-control" placeholder="Enter Subject" />
							</div>
							<div className="col mb-0">
								<label htmlFor="dobBasic" className="form-label">DOB</label>
								<input type="text" id="dobBasic" className="form-control" placeholder="DD / MM / YY" />
							</div>
						</div>
					</div>
					<div className="modal-footer">
						<button type="button" className="btn btn-primary" data-bs-dismiss="modal"
							onClick={handleClose}
						>
							Close
						</button>
						<button
							type="button"
							className="btn btn-primary"
							onClick={(e) => {
								e.preventDefault();
								searchForQuery(recieverMailRef.current.value);
							}}
						>
							Filter
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
};

FilterModal.propTypes = {
	open: PropTypes.any.isRequired,
	handleClose: PropTypes.func.isRequired,
	searchForQuery: PropTypes.func.isRequired
};

export default memo(FilterModal);
