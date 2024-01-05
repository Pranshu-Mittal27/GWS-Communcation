import { Tooltip } from "@mui/material";
import PropTypes from "prop-types";
import { useId, useState } from "react";
import "./index.css";

const ThreeStateToggle = ({ states, defaultSelection, updateFilter }) => {
	const [selected, setSelected] = useState(defaultSelection);
	const id = useId();

	return (
		<div className="flex items-center justify-center h-full w-full" style={{ transition: "background 0.4s ease-in-out", cursor: "pointer" }}>
			<div className="flex items-center justify-center mode-toggle" style={{
				height: "2.5rem",
				width: "7.5rem",
				borderRadius: "0.75rem",
				padding: "0.25rem"
			}}>
				{
					states.map((state, index) => {
						return <Tooltip title={state.label} key={index} >
							<label
								className={"mode mode-light" + (selected === index) ? " active" : ""} htmlFor={`${state.label}-${id}`} style={{
									background: (selected === index) ? "white" : "transparent",
									border: (selected === index) ? "1px solid white" : "1px solid transparent",
									padding: "0.25rem",
									borderRadius: "0.5rem",
									transition: "all 0.3s ease-in-out",
									width: "2.5rem"
								}}>

								<input
									id={`${state.label}-${id}`}
									aria-label={state.label}
									className="mode-input"
									type="radio"
									name={"mode" + id}
									value={index}
									checked={selected === index}
									onChange={() => {
										setSelected(index);
										updateFilter(index);
									}}
								/>

								<span className="mode-icon" style={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									height: "100%",
									width: "100%",
									transition: "all 0.3s ease-in-out"
								}}>
									{(selected === index) ? state.icon.enabled : state.icon.disabled}
								</span>

							</label>
						</Tooltip>;
					})
				}
			</div>
		</div>

	);
};

ThreeStateToggle.propTypes = {
	states: PropTypes.array.isRequired,
	defaultSelection: PropTypes.number.isRequired,
	updateFilter: PropTypes.func.isRequired
};

export default ThreeStateToggle;
