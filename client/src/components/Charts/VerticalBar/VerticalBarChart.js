/* eslint-disable no-tabs */
import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import "./VerticalBarChart.css";
import PropTypes from "prop-types";

const VerticalBarChart = (props) => {
	const [data, setData] = useState([{}]);
	const [containerWidth, setWidth] = useState();
	const [containerHeight, setHeight] = useState();

	const svgRef = useRef();
	const svgContainer = useRef();
	const tooltipRef = useRef();

	const onClick = (d) => {
		props.options.onClick(d);
	};

	// This function calculates width and height of the container
	const getSvgContainerSize = () => {
		const newWidth = svgContainer.current.clientWidth;
		setWidth(newWidth);
		const newHeight = svgContainer.current.clientHeight;
		setHeight(newHeight);
	};

	const margin = { top: 15, right: 30, bottom: 90, left: 30 };

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
		// const tickStep = props.options.tickStep;
		// console.log("data max: ", Math.ceil(Math.max(...data.map(o => o.value)) / 1000) * 1000);
		// const tickStep = Math.ceil(Math.max(...data.map(o => o.value)) / 1000) * 1000 / 10;
		const tickStep = 50;
		const labelText = props.options.labelText || "";
		const colorScale = props.options.colorScale || "";
		const width = (containerWidth || 1000) - margin.left - margin.right;
		const height = (containerHeight || 400) - margin.top - margin.bottom;
		const ellipsis = function () {
			const self = d3.select(this);
			let textLength = self.node().getComputedTextLength();
			let text = self.text();
			if (textLength > 15 && text.length > 15) {
				text = text.slice(0, 14);
				self.text(text + "...");
				textLength = self.node().getComputedTextLength();
			}
		};
		// update the svg object
		const svg = d3
			.select(svgRef.current)
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.classed("bar-chart-svg", true);

		// clear all existing elements
		const everything = svg.selectAll("*");
		everything.remove();

		// Add the container g element to the svg
		const container = svg
			.append("g")
			.classed("container", true)
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// Tooltip
		const tooltip = d3
			.select(tooltipRef.current)
			.attr("class", "tooltip")
			.style("opacity", 0)
			.style("position", "absolute")
			.style("background-color", "rgba(0,0,0,0.8)")
			.style("color", "white")
			.style("border-radius", "5px")
			.style("padding", "0.75em")
			.style("pointer-events", "none");

		if (Object.keys(data[0]).length === 2) {
			// Add X axis
			const x = d3
				.scaleBand()
				.rangeRound([0, width])
				.domain(data.map((d) => d.name))
				.padding(0.85);
			container
				.append("g")
				.attr("transform", `translate(0, ${height})`)
				.call(d3.axisBottom(x).tickSize(0))
				.selectAll("text")
				.attr("transform", "translate(0,10)")
				.style("text-anchor", "end")
				.style("font-size", "12px")
				// .attr("dx", "1em")
				// .attr("dy", ".15em")
				.attr("transform", "rotate(-30)")
				// .each(ellipsis)
			;

			// Add Y axis
			// const y = d3
			// 	.scaleLinear()
			// 	.domain([
			// 		0,
			// 		Math.ceil(d3.max(data, (d) => d.value) / tickStep) *
			// 			tickStep + tickStep
			// 	])
			// 	.rangeRound([height, 0]);

			const y = d3
				.scaleLog()
				.domain([
					0.1,
					10000])
				.range([height, 0]);

			container.append("g").call(
				d3
					.axisLeft(y)
					.tickValues(
						d3.range(
							0,
							d3.max(data, (d) => d.value),
							1000
						)
					)
					.tickSize(0)
					// .tickFormat((d) => d + labelText)
			);

			// Add grid lines
			const xAxisGrid = d3
				.axisBottom(x)
				.tickValues(x.domain().slice(0, data.length))
				.tickSize(-height)
				.tickFormat("");
			const yAxisGrid = d3
				.axisLeft(y)
				// .tickValues(d3.range(0, y.domain()[1] + 1, tickStep))
				.tickSize(-width)
				.tickFormat("")
				;

			container
				.append("g")
				.attr("class", "x axis-grid")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxisGrid);
			container.append("g").attr("class", "y axis-grid").call(yAxisGrid);

			// Add bars - initially zero - animation effect
			container
				.selectAll("mybar")
				.data(data)
				.join("rect")
				.attr("x", (d) => x(d.name))
				.attr("width", x.bandwidth())
				.attr("fill", "#959595")
				// .attr("height", (d) => height) // always equal to 0
				.attr("y", (d) => y(d.value));

			// Update bar values with animation
			container
				.selectAll("rect")
				.transition()
				.duration(800)
				.attr("y", (d) => y(d.value))
				.attr("height", (d) => height - y(d.value));

			// show tooltip
			container
				.selectAll("rect")
				.on("click", (event, d) => {
					onClick(d);
				})
				.on("mouseover", (event) => {
					// highlight bar
					d3.select(event.target).attr("fill", "#7a67ee");
				})
				.on("mouseout", (event) => {
					// unhighlight bar
					d3.select(event.target).attr("fill", "#959595");
					// hide tooltip
					tooltip.style("opacity", 0);
				})
				.on("mousemove", (event, d) => {
					// show tooltip on top of bar
					tooltip
						.style("opacity", 1)
						.style("left", event.pageX + "px")
						.style("top", event.pageY + "px")
						.html(` ${d.value} users`);
				});
		} else {
			// Generate keys for grouped bar chart
			const keys = Object.keys(data[0]).slice(1);

			// Color scale for grouped bar chart
			const z = d3.scaleOrdinal().range(colorScale);

			// Add X axis
			const x = d3
				.scaleBand()
				.rangeRound([0, width])
				.domain(
					data.map(function (d) {
						return d.name;
					})
				)
				.paddingOuter(0.5)
				.paddingInner(0.4); // Rotate the text element

			// Add X1 axis
			const x1 = d3
				.scaleBand()
				.paddingInner(0)
				.paddingOuter(0.8)
				.domain(keys)
				.rangeRound([0, x.bandwidth()]);

			container
				.append("g")
				.attr("class", "bG")
				.attr("transform", `translate(0, ${height})`)
				.call(d3.axisBottom(x).tickSize(0))
				.selectAll("text")
				.attr("transform", "translate(0,10)")
				.style("text-anchor", "center")
				.style("font-size", "12px")
				.each(ellipsis);

			// Add Y axis
			const y = d3
				.scaleLinear()
				.domain([
					0,
					Math.ceil(
						d3.max(data, function (d) {
							return d3.max(keys, function (key) {
								return d[key];
							});
						}) / tickStep
					) * tickStep
				])
				.rangeRound([height, 0]);

			container.append("g").call(
				d3
					.axisLeft(y)
					.tickValues(d3.range(0, y.domain()[1] + 1, tickStep))
					.tickSize(0)
					.tickFormat((d) => d + labelText)
			);

			// Add grid lines
			const xAxisGrid = d3
				.axisBottom(x)
				.tickValues(x.domain().slice(0, -1))
				.tickSize(-height)
				.tickFormat("");
			const yAxisGrid = d3
				.axisLeft(y)
				.tickValues(d3.range(0, y.domain()[1] + tickStep, tickStep))
				.tickSize(-width)
				.tickFormat("");

			container
				.append("g")
				.attr("class", "x axis-grid")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxisGrid);
			container.append("g").attr("class", "y axis-grid").call(yAxisGrid);

			// Add bars - initially zero - animation effect
			container
				.append("g")
				.selectAll("g")
				.data(data)
				.enter()
				.append("g")
				.attr("class", "group")
				.attr("transform", function (d) {
					return "translate(" + x(d.name) + ",0)";
				})
				.selectAll("mybar")
				.data((data) =>
					keys.map((key) => {
						return { key, value: data[key] };
					})
				)
				.join("rect")
				.attr("x", (d) => x1(d.key))
				.attr("width", x1.bandwidth())
				.attr("fill", function (d) {
					return z(d.key);
				})
				.attr("height", (d) => height - y(d.value * 0)) // always equal to 0
				.attr("y", (d) => y(d.value * 0));

			// Update bar values with animation
			container
				.selectAll("rect")
				.transition()
				.duration(800)
				.attr("y", (d) => y(d.value))
				.attr("height", (d) => height - y(d.value));

			// Show tooltip on top of bar
			container
				.selectAll(".group")
				.on("mouseover", (event, d) => {
					// show group tooltip
					tooltip
						.style("opacity", 1)
						.style("left", event.pageX + "px")
						.style("top", event.pageY + "px")
						.html(
							`${keys
								.map(
									(key, index) =>
										`<div class='values' style='border-left: 3px solid ${colorScale[index]};margin:0.2em;padding-left:0.5em'>` +
										d[key] +
										"</div>"
								)
								.join("")}`
						);
				})
				.on("mouseout", () => {
					// hide tooltip
					tooltip.style("opacity", 0);
				});
		}
	};

	return (
		<div
			ref={svgContainer}
			style={{ height: "300px", width: "100%", margin: "0.5em 0" }}
			className="line-chart"
		>
			<svg ref={svgRef} />
			<div ref={tooltipRef} className="tooltip" />
		</div>
	);
};

VerticalBarChart.propTypes = {
	data: PropTypes.array.isRequired,
	colorScale: PropTypes.array,
	tickStep: PropTypes.number,
	labelText: PropTypes.string,
	options: PropTypes.object
};

export default VerticalBarChart;
