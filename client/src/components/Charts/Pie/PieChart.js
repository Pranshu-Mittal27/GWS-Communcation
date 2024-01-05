import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

const PieChart = (props) => {
	const { colorScale } = props;
	const [data, setData] = useState({});
	const [containerWidth, setWidth] = useState();
	const [containerHeight, setHeight] = useState();

	useEffect(() => {
		if (!props.data) return;
		setData(props.data);
	}, [props.data]);

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
		// set the dimensions and margins of the graph
		const width = containerWidth || 450;
		const height = containerHeight || 450;
		const margin = 40;

		// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
		const radius = Math.min(width, height) / 2 - margin;

		// append the svg object to the div called 'my_dataviz'
		const svg = d3
			.select(svgRef.current)
			.attr("width", width)
			.attr("height", height);

		// clear all existing elements
		const everything = svg.selectAll("*");
		everything.remove();

		// Append a container g element to the svg object
		const container = svg
			.append("g")
			.attr("transform", `translate(${width / 2}, ${height / 2})`);

		// Tooltip
		const tooltip = d3
			.select(tooltipRef.current)
			.attr("class", "tooltip")
			.style("opacity", 0)
			.style("position", "absolute")
			.style("background-color", "rgba(0,0,0,0.8)")
			.style("color", "white")
			.style("border-radius", "5px")
			.style("padding", "1em")
			.style("pointer-events", "none");

		// Compute the position of each group on the pie:
		const pie = d3.pie().value(function (d) {
			return d[1];
		});
		const dataReady = pie(Object.entries(data));
		const total = d3.sum(dataReady, (d) => {
			return d.data[1];
		});
		const capitalize = (s) => {
			if (typeof s !== "string") return "";
			return s.charAt(0).toUpperCase() + s.slice(1);
		};

		const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);
		// Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
		container
			.selectAll("pie_arcs")
			.data(dataReady)
			.join("path")
			.attr("d", arcGenerator)
			.attr("fill", function (d, i) {
				return colorScale[i];
			});

		container
			.selectAll("path")
			.on("mouseover", (event, d) => {
				// increase size of the hovered arc
				d3.select(event.target)
					.transition()
					.duration(300)
					.attr(
						"d",
						d3
							.arc()
							.innerRadius(0)
							.outerRadius(radius * 1.05)
					);

				// show tooltip
				tooltip.transition().duration(300).style("opacity", 1);
				tooltip
					.html(
						`<div>
					${capitalize(d.data[0])}: ${d.data[1]}
					<br/>
					${Math.round((d.data[1] / total) * 100) + "%"}
					</div>`
					)
					.style("left", event.pageX + "px")
					.style("top", event.pageY + "px");
			})
			.on("mouseout", (event) => {
				// return to original size
				d3.select(event.target)
					.transition()
					.duration(300)
					.attr("d", d3.arc().innerRadius(0).outerRadius(radius));

				// hide tooltip
				tooltip.transition().duration(300).style("opacity", 0);
			});
		const arc = d3
			.arc()
			.innerRadius(radius * 0.5)
			.outerRadius(radius * 0.8);
		const outerArcForLabelsPosition = d3
			.arc()
			.innerRadius(radius * 1)
			.outerRadius(radius * 1);
		container
			.selectAll("allPolylines")
			.data(dataReady)
			.enter()
			.append("polyline")
			.attr("stroke", "black")
			.style("fill", "none")
			.attr("stroke-width", 1)
			// @ts-ignore
			.attr("points", (d) => {
				if (d.data[1] === 0) {
					return;
				}
				// @ts-ignore
				const posA = arc.centroid(d); // line insertion in the slice
				// @ts-ignore
				const posB = outerArcForLabelsPosition.centroid(d); // line break: we use the other arc generator that has been built only for that
				// @ts-ignore
				const posC = outerArcForLabelsPosition.centroid(d); // Label position = almost the same as posB
				const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2; // we need the angle to see if the X position will be at the extreme right or extreme left
				posC[0] = radius * 1.025 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
				return [posA, posB, posC];
			});

		container
			.selectAll("allLabels")
			.data(dataReady)
			.enter()
			.append("text")
			// @ts-ignore
			.text((d) => {
				if (d.data[1] === 0) {
					return;
				}
				return d.data[1];
			})
			.attr("transform", (d) => {
				// @ts-ignore
				const pos = outerArcForLabelsPosition.centroid(d);
				const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
				pos[0] = radius * 1.075 * (midAngle < Math.PI ? 1 : -1);
				pos[1] = pos[1] + 5;
				return `translate(${pos})`;
			})
			.style("text-anchor", (d) => {
				const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
				return midAngle < Math.PI ? "start" : "end";
			})
			.style("fill", "black");
	};

	return (
		<div
			ref={svgContainer}
			style={{ height: "60vh", width: "100%", margin: "0.5em 0" }}
			className="pie-chart"
		>
			<svg ref={svgRef} />
			<div ref={tooltipRef} />
		</div>
	);
};

PieChart.propTypes = {
	data: PropTypes.object.isRequired,
	colorScale: PropTypes.array.isRequired
};

export default PieChart;
