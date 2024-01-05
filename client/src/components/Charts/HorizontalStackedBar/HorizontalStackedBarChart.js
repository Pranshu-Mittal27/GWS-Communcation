import { useState, useEffect, useRef, memo } from "react";
import * as d3 from "d3";
const PropTypes = require("prop-types");

const HorizontalStackedBarChart = (props) => {
	const [data, setData] = useState({
		"< 1 hr": { Approved: 0, On_Hold: 0, Pending: 0, Rejected: 0 },
		"> 1 hr": { Approved: 0, On_Hold: 0, Pending: 0, Rejected: 0 },
		"> 2 hr": { Approved: 0, On_Hold: 0, Pending: 0, Rejected: 0 },
		"> 3 hr": { Approved: 0, On_Hold: 0, Pending: 0, Rejected: 0 },
		"> 4 hr": { Approved: 0, On_Hold: 0, Pending: 0, Rejected: 0 },
		"> 5 hr": { Approved: 0, On_Hold: 0, Pending: 0, Rejected: 0 },
		"> 8 hr": { Approved: 0, On_Hold: 0, Pending: 1, Rejected: 0 }
	});
	const [containerWidth, setWidth] = useState();
	const [containerHeight, setHeight] = useState();

	const svgRef = useRef();
	const svgContainer = useRef();
	const tooltipRef = useRef();

	const getSvgContainerSize = () => {
		const newWidth = svgContainer.current.clientWidth;
		setWidth(newWidth);
		const newHeight = svgContainer.current.clientHeight;
		setHeight(newHeight);
	};

	const margin = { top: 15, right: 40, bottom: 70, left: 40 };

	useEffect(() => {
		if (!props.data) return;
		setData({ ...props.data });
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

	const getTickStep = (data) => {
		// get the  array of sum of values per object in the arrays
		// and find the maximum sum
		const sums = Object.values(data).map((d) =>
			Object.values(d).reduce((a, b) => a + b, 0)
		);

		const maxSum = Math.max(...sums);

		// get the tick step based on the maximum sum
		// in order to get 10 ticks on the x axis
		// in case of data with large values, the tick step should be 100
		// in case of data with small values, the tick step should be 10
		const tickStep = Math.ceil(maxSum / 10) * 10;
		return tickStep;
	};

	const drawChart = () => {
		// get an appropriate tick step based on the values received
		const tickStep = getTickStep(data);
		// const labelText = props.options.labelText || "";
		const colorScale = props.colorScale || "";
		const width = (containerWidth || 1000) - margin.left - margin.right;
		const height = (containerHeight || 300) - margin.top - margin.bottom;

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

		const groups = Object.keys(data).reverse();
		let subgroups, subgroupData;
		if (groups.length !== 0) {
			subgroups = Object.keys(data[groups[0]]);
			subgroupData = Object.values(data).reverse();
			subgroupData = subgroupData.map((d, i) => {
				return { ...d, group: groups[i] };
			});
			// Add X axis
			// const x = d3.scaleLinear().domain([0, 1000]).range([0, width]);
			// use tickstep value to set domain
			const x = d3.scaleLinear().domain([0, tickStep]).range([0, width]);
			container
				.append("g")
				.attr("transform", `translate(0, ${height})`)
				.call(d3.axisBottom(x).tickSizeOuter(0));

			// Add Y axis
			const y = d3.scaleBand().domain(groups).range([0, height]).padding([0.2]);
			container.append("g").call(d3.axisLeft(y));

			// color palette = one color per subgroup
			const color = d3.scaleOrdinal().domain(subgroups).range(colorScale);

			// stack the data? --> stack per subgroup
			const stackedData = d3.stack().keys(subgroups)(subgroupData);

			container
				.append("g")
				.selectAll("g")
			// Enter in the stack data = loop key per key = group per group
				.data(stackedData)
				.join("g")
				.attr("fill", (d) => color(d.key))
				.attr("class", (d) => d.key)
				.selectAll("rect")
			// enter a second time = loop subgroup per subgroup to add all rectangles
				.data((d) => {
					const key = d.key;
					d.map((d) => {
						if (Array.isArray(d)) {
							d.data.key = key;
							return d;
						}
						return d;
					});

					return d;
				})
				.join("rect", (d) => {
					return d;
				})
				.attr("x", (d) => x(d[0]))
				.attr("y", (d) => y(d.data.group))
				.attr("width", (d) => x(d[1]) - x(d[0]))
				.attr("height", y.bandwidth())
				.on("mouseover", (event, d) => {
					tooltip
						.style("opacity", 1)
						.html(
							`<div style="font-weight: bold; font-size: 1.1em;">${
								d.data.group
							}</div>
							<div>${d3.select(event.target.parentNode).attr("class")}:${d[1] - d[0]}</div>`
						)
						.style("left", `${event.pageX / 1.25}px`)
						.style("top", `${event.pageY / 1.25}px`);
				})
				.on("mousemove", (event, d) => {
					tooltip
						.style("opacity", 1)
						.html(
							`<div style="font-weight: bold; font-size: 1.1em;">${
								d.data.group
							}</div>
							<div>${d3.select(event.target.parentNode).attr("class")}:${d[1] - d[0]}</div>`
						)
						.style("left", `${event.pageX / 1.25}px`)
						.style("top", `${event.pageY / 1.25}px`);
				})
				.on("mouseleave", (event, d) => {
					tooltip.style("opacity", 0);
				});
		}
	};

	return (
		<div
			ref={svgContainer}
			style={{ height: "60vh", width: "100%", margin: "0.5em 0" }}
			className="bar-chart"
		>
			<svg ref={svgRef} />
			<div ref={tooltipRef} className="tooltip" />
		</div>
	);
};

HorizontalStackedBarChart.propTypes = {
	data: PropTypes.object.isRequired,
	colorScale: PropTypes.array
};

export default memo(HorizontalStackedBarChart);
