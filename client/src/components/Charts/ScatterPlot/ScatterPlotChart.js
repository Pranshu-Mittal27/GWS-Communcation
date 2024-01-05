import {
	max,
	select,
	scaleLinear,
	axisLeft,
	axisTop,
	axisBottom,
	range,
	scaleOrdinal
} from "d3";
import moment from "moment";
import "moment-duration-format";
import { useEffect, useRef, useState } from "react";
import "./ScatterPlotChart.css";
import PropTypes from "prop-types";

const ScatterPlotChart = (props) => {
	const [data, setData] = useState([{}]);
	const [containerWidth, setWidth] = useState(800);
	const [containerHeight, setHeight] = useState(500);

	const svgRef = useRef();
	const svgContainer = useRef();
	const tooltipRef = useRef();

	// This function calculates width and height of the container
	const getSvgContainerSize = () => {
		const newWidth = svgContainer.current.clientWidth;
		setWidth(newWidth);
		const newHeight = svgContainer.current.clientHeight;
		setHeight(newHeight);
	};

	useEffect(() => {
		setData([...props.data]);
	}, [props.data]);

	useEffect(() => {
		// detect 'width' and 'height' on render
		getSvgContainerSize();
		// listen for resize changes, and detect dimensions again when they change
		window.addEventListener("resize", getSvgContainerSize);
		// cleanup event listener
		return () => window.removeEventListener("resize", getSvgContainerSize);
	}, []);

	useEffect(() => {
		drawChart();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, containerWidth, containerHeight]);

	const drawChart = () => {
		const { options } = props;
		const axes = options.axes;
		const quadrantLabels = options.quadrantLabels;
		let xUpperBound, yUpperBound, xAxisLabel, yAxisLabel;
		const labelText = options.labels || [];
		const colorScale = options.colorScale;
		const margin = { top: 40, right: 12, bottom: 60, left: 90 };
		const width = containerWidth - margin.left - margin.right;
		const height = containerHeight - margin.top - margin.bottom;

		if (axes.x === "visitors") {
			xUpperBound = Math.ceil(max(data, (d) => d.x) / 1000) * 1000;
			xAxisLabel = "Total Visitors";
		}
		if (axes.x === "frequency") {
			xUpperBound = Math.ceil(max(data, (d) => d.x) / 2) * 2;
			xAxisLabel = "Visit Frequency / Visitor";
		}
		if (axes.y === "duration") {
			yUpperBound = Math.ceil(max(data, (d) => d.y) / 3600) * 3600;
			yAxisLabel = "AVG Duration / Visit";
		}
		if (axes.y === "frequency") {
			yUpperBound = Math.ceil(max(data, (d) => d.y) / 2) * 2;
			yAxisLabel = "Visit Frequency / Visitor";
		}
		const yTickStep = yUpperBound / 2;
		const xTickStep = xUpperBound / 2;

		// update the svg object
		const svg = select(svgRef.current)
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.classed("scatter-plot-svg", true);

		// clear all existing elements
		const everything = svg.selectAll("*");
		everything.remove();

		// Add the container g element to the svg
		const container = svg
			.append("g")
			.classed("container", true)
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// Add tooltip
		const tooltip = select(tooltipRef.current)
			.attr("class", "tooltip")
			.style("opacity", 0)
			.style("position", "absolute")
			.style("background-color", "rgba(0,0,0,0.8)")
			.style("color", "white")
			.style("border-radius", "5px")
			.style("padding", "1em")
			.style("pointer-events", "none");

		// Add X axis
		const x = scaleLinear().domain([0, xUpperBound]).range([0, width]);
		container
			.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(
				axisBottom(x)
					.tickSize(0)
					.tickValues(range(0, xUpperBound + xTickStep, xTickStep))
					.tickFormat((d) => {
						if (axes.x === "frequency") {
							return d + " times";
						}
						return d;
					})
					.tickPadding(7)
			)
			.selectAll("text")
			.style("font-size", "11")
			.attr("text-anchor", (d) => {
				if (d === 0) {
					return "start";
				}
				if (d === xUpperBound) {
					return "end";
				}
				return "middle";
			});

		// Add Y axis
		const y = scaleLinear().domain([0, yUpperBound]).range([height, 0]);
		container
			.append("g")
			.call(
				axisLeft(y)
					.tickSize(0)
					.tickValues(range(0, yUpperBound + yTickStep, yTickStep))
					.tickFormat((d) => {
						if (axes.y === "duration") {
							// convert seconds to H:M:S format
							const result = moment.duration(d, "seconds");
							return result.format("hh:mm:ss", { trim: false });
						}
						if (axes.y === "frequency") {
							return d + " times";
						}
					})
					.tickPadding(7)
			)
			.selectAll("text")
			.style("font-size", "11")
			.attr("alignment-baseline", (d) => {
				if (d === 0) {
					return "after-edge";
				}
				return "center";
			});

		// Add grid lines
		const xAxisGrid = axisBottom(x)
			.tickValues(range(0, xUpperBound + xTickStep, xTickStep))
			.tickSize(-height)
			.tickFormat("");
		const yAxisGrid = axisLeft(y)
			.tickValues(range(0, yUpperBound + yTickStep, yTickStep))
			.tickSize(-width)
			.tickFormat("");

		container
			.append("g")
			.attr("class", "x-axis-grid")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxisGrid);
		container.append("g").attr("class", "y-axis-grid").call(yAxisGrid);

		// quadrant label axes
		const lowerXAxisLabels = axisBottom(x)
			.tickSize(0)
			.tickFormat((d) => {
				if (d === 0.25 * xUpperBound) {
					return quadrantLabels.bottomLeft;
				}
				if (d === 0.75 * xUpperBound) {
					return quadrantLabels.bottomRight;
				}
				return "";
			})
			.tickPadding(10);

		const upperXAxisLabels = axisTop(x)
			.tickSize(0)
			.tickFormat((d) => {
				if (d === 0.25 * xUpperBound) {
					return quadrantLabels.topLeft;
				}
				if (d === 0.75 * xUpperBound) {
					return quadrantLabels.topRight;
				}
				return "";
			})
			.tickPadding(10);

		container
			.append("g")
			.attr("class", "x-quadrant-labels")
			.attr("transform", "translate(0,0)")
			.call(upperXAxisLabels)
			.selectAll("text")
			.style("font-size", "13")
			.style("text-anchor", "middle");

		container
			.append("g")
			.attr("class", "x-quadrant-labels")
			.attr("transform", "translate(0," + height + ")")
			.call(lowerXAxisLabels)
			.selectAll("text")
			.style("font-size", "13")
			.style("text-anchor", "middle");

		// Color scale: give me a specie name, I return a color
		const color = scaleOrdinal().domain(labelText).range(colorScale);

		// Add dots
		container
			.append("g")
			.selectAll("dot")
			.data(data)
			.enter()
			.append("circle")
			.attr("cx", function () {
				return x(0) || 0;
			})
			.attr("cy", function () {
				return y(0) || 0;
			})
			.attr("r", 8)
			.style("fill", function (d) {
				return color(d.name);
			});

		// add transition
		container
			.selectAll("circle")
			.transition()
			.duration(1000)
			.attr("cx", function (d) {
				return x(d.x) || 0;
			})
			.attr("cy", function (d) {
				return y(d.y) || 0;
			});

		// Text label for the x axis
		container
			.append("text")
			.attr(
				"transform",
				"translate(" +
					width / 2 +
					" ," +
					(height + margin.top + 20) +
					")"
			)
			.style("text-anchor", "middle")
			.text(xAxisLabel)
			.style("font-size", "15")
			.style("font-weight", "bold");

		// text label for the y axis
		container
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x", 0 - height / 2)
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text(yAxisLabel)
			.style("font-size", "15")
			.style("font-weight", "bold");

		// Show tooltip on mouseover and hide on mouseout
		container
			.selectAll("circle")
			.on("mouseover", (event, d) => {
				const circleColor = color(d.name);
				tooltip.transition().duration(200).style("opacity", 1);
				tooltip
					.style("left", event.pageX + "px")
					.style("top", event.pageY - 28 + "px");
				if (axes.x === "visitors" && axes.y === "duration") {
					const durationAsHours = moment
						.duration(d.y, "seconds")
						.asHours()
						.toPrecision(2);
					tooltip.html(
						`<div style='display:flex;align-items:center;'>
							<div
							style='background-color: ${circleColor};width: 15px;height: 15px;border-radius: 50%;margin-right: 0.5rem;display:inline-block;'
												> </div>
												<div style='display:inline-block;'><b>${d.name}</b></div>
						</div>
						<div style='font-size:0.75rem'>AVG Duration / Visit: <b>${durationAsHours} Hrs</b></div>
						<div style='font-size:0.75rem'>Total Visitors: <b>${d.x}</b></div>
						`
					);
				}
				if (axes.x === "visitors" && axes.y === "frequency") {
					tooltip.html(
						`<div style='display:flex;align-items:center;'>
							<div
							style='background-color: ${circleColor};width: 15px;height: 15px;border-radius: 50%;margin-right: 0.5rem;display:inline-block;'
												> </div>
												<div style='display:inline-block;'><b>${d.name}</b></div>
						</div>
						<div style='font-size:0.75rem'>Visit Frequency / Visitor: <b>${d.y} times</b></div>
						<div style='font-size:0.75rem'>Total Visitors: <b>${d.x}</b></div>
						`
					);
				}
				if (axes.x === "frequency" && axes.y === "duration") {
					const durationAsHours = moment
						.duration(d.y, "seconds")
						.asHours()
						.toPrecision(2);
					tooltip.html(
						`<div style='display:flex;align-items:center;'>
							<div
							style='background-color: ${circleColor};width: 15px;height: 15px;border-radius: 50%;margin-right: 0.5rem;display:inline-block;'
												> </div>
												<div style='display:inline-block;'><b>${d.name}</b></div>
						</div>
						<div style='font-size:0.75rem'>AVG Duration / Visit: <b>${durationAsHours} Hrs</b></div>
						<div style='font-size:0.75rem'>Visit Frequency / Visitor: <b>${d.x} times</b></div>
						`
					);
				}
			})
			.on("mouseout", () => {
				tooltip.transition().duration(500).style("opacity", 0);
			});
	};

	return (
		<div
			ref={svgContainer}
			style={{ height: "525px", width: "100%", margin: "0.5em 0" }}
			className="scatter-plot"
		>
			<svg ref={svgRef} />
			<div ref={tooltipRef} />
		</div>
	);
};

ScatterPlotChart.propTypes = {
	data: PropTypes.array.isRequired,
	options: PropTypes.object.isRequired
};

export default ScatterPlotChart;
