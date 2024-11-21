function _1(md) {
    return md`<div style="color: grey; font: 13px/25.5px var(--sans-serif); text-transform: uppercase;"><h1 style="display: none;">Radial cluster tree</h1><a href="https://d3js.org/"></a>  <a href="/@d3/gallery"></a></div>

[](https://d3js.org/d3-hierarchy/cluster)[](/@d3/radial-tree/2?intent=fork)[](/@d3/tree-of-life?intent=fork)[](/@d3/cluster/2?intent=fork)`;
}

function _chart(d3, data) {
    const width = 1200;
    const height = width;
    const initialScale = 1;
    let currentScale = initialScale;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const radius = Math.min(width, height) / 2 - 100;
    let currentLevel = 0;

    const colorByDepth = d => {
        const colors = [
            "rgb(0,0,0)",   // 第一层（根节点）
            "rgb(60,22,175)",   // 第4层
            "rgb(110,79,168)",  // 第3层
            "#5B84AD", // 第二层
            "#000000" //5
        ];
        return colors[Math.min(d.depth, colors.length - 1)];
    };

    const tree = d3.cluster()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-cx, -cy, width*1, height*1.2])
        .attr("style", `width: 100%; height: auto; font: 10px sans-serif; transform: scale(${initialScale}); transform-origin: center center;`)
        .call(zoom);

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "fixed")
        .style("left", "10px")
        .style("bottom", "10px")
        .style("padding", "8px")
        .style("background", "#f8f8f8")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("visibility", "hidden")
        .style("z-index", "10");

    const selectContainers = d3.select("body")
        .append("div")
        .style("position", "fixed")
        .style("top", "10px")
        .style("left", "10px")
        .style("z-index", "10")
        .style("display", "flex")
        .style("flex-direction", "column");

    const selects = [];
    for (let i = 0; i < 5; i++) {
        selects.push(selectContainers.append("select")
            .style("margin-bottom", "10px")
            .style("width", "200px")
            .on("change", (event, d) => updateChart(i, event.target.value)));
    }

    updateSelect(0, [data]);

    function updateSelect(level, nodes) {
        const select = selects[level];
        select.selectAll("option").remove();
        select.append("option").text("Select a node").attr("value", "");

        nodes.forEach(node => {
            select.append("option")
                .text(`${node.code}: ${node.name}`)
                .attr("value", node.code);
        });

        // Clear subsequent dropdowns
        for (let i = level + 1; i < 5; i++) {
            selects[i].selectAll("option").remove();
            selects[i].append("option").text("Select a node").attr("value", "");
        }
    }

    function updateChart(level, code) {
        currentLevel = level;
        let selectedNode = findNodeByCode(data, code);
        if (selectedNode) {
            renderChart(selectedNode);
            if (selectedNode.children) {
                updateSelect(level + 1, selectedNode.children);
            }
            // Reset all dropdowns below the current one
            for (let i = level + 1; i < 5; i++) {
                selects[i].property("value", "");
            }
        }
    }

    function findNodeByCode(node, code) {
        if (node.code === code) return node;
        if (node.children) {
            for (let child of node.children) {
                const found = findNodeByCode(child, code);
                if (found) return found;
            }
        }
        return null;
    }

    function renderChart(rootNode) {
        const root = tree(d3.hierarchy(rootNode)
            .sort((a, b) => d3.ascending(a.data.name, b.data.name)));

        svg.selectAll("g").remove();

        const link = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5)
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("d", d3.linkRadial()
                .angle(d => d.x)
                .radius(d => d.y));

        const node = svg.append("g")
            .selectAll("circle")
            .data(root.descendants())
            .join("circle")
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
            .attr("fill", d => colorByDepth(d))
            .attr("r", 2.5)
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);

        const label = svg.append("g")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .selectAll("text")
            .data(root.descendants())
            .join("text")
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0) rotate(${d.x >= Math.PI ? 180 : 0})`)
            .attr("dy", "0.31em")
            .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
            .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
            .attr("paint-order", "stroke")
            .attr("stroke", "white")
            .attr("fill", d => colorByDepth(d))
            .text(d => d.children ? d.data.code : d.data.name)
            .style("font-size", d => getTextSize(d))
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);
    }

    function handleMouseOver(event, d) {
        const highlightNodes = [d, ...d.ancestors(), ...d.descendants()];

        svg.selectAll("circle")
            .attr("r", n => highlightNodes.includes(n) ? 6 : getNodeSize(n))
            .attr("fill", n => highlightNodes.includes(n) ? "blue" : colorByDepth(n));

        svg.selectAll("path")
            .attr("stroke-width", l => (highlightNodes.includes(l.source) && highlightNodes.includes(l.target)) ? 3 : 1.5)
            .attr("stroke", l => (highlightNodes.includes(l.source) && highlightNodes.includes(l.target)) ? "blue" : "#555");

        svg.selectAll("text")
            .attr("fill", n => highlightNodes.includes(n) ? "blue" : colorByDepth(n))
            .style("font-size", n => getTextSize(n, true));

        tooltip.style("visibility", "visible")
            .html(`${d.data.code}: ${d.data.name}<br>${d.data.definition || "No definition available"}`);
    }

    function handleMouseOut(event, d) {
        svg.selectAll("circle")
            .attr("r", d => getNodeSize(d))
            .attr("fill", d => colorByDepth(d));

        svg.selectAll("path")
            .attr("stroke-width", 1.5)
            .attr("stroke", "#555");

        svg.selectAll("text")
            .attr("fill", d => colorByDepth(d))
            .style("font-size", d => getTextSize(d));

        tooltip.style("visibility", "hidden");
    }

    function getNodeSize(d) {
        if (currentScale <= 10.0) return 2.5;
        const scaleFactor = (currentScale - 10.0) / 0.1;
        if (d.depth === 1) return 2.5 * Math.pow(1.03, scaleFactor);
        if (d.depth === 2) return 2.5 * Math.pow(1.01, scaleFactor);
        if (d.depth === 3) return 2.5 * Math.pow(0.98, scaleFactor);
        if (d.depth >= 4) return 2.5 * Math.pow(0.92, scaleFactor);
        return 2.5;
    }

    function getTextSize(d, isHovered = false) {
        let baseSize = 10;
        if (currentLevel === 1) baseSize *= 1.5;
        else if (currentLevel === 2) baseSize *= 2;
        else if (currentLevel === 3) baseSize *= 2.5;
        else if (currentLevel === 4) baseSize *= 3;

        if (currentScale <= 10.0) return `${baseSize}px`;
        const scaleFactor = (currentScale - 10.0) / 0.1;
        if (d.depth === 1) return `${baseSize * Math.pow(1.02, scaleFactor)}px`;
        if (d.depth === 2) return `${baseSize * Math.pow(0.99, scaleFactor)}px`;
        if (d.depth === 3) return `${baseSize * Math.pow(0.96, scaleFactor)}px`;
        if (d.depth >= 4) return `${baseSize * Math.pow(0.93, scaleFactor)}px`;
        return `${baseSize}px`;
    }

    function zoom(svg) {
        const zoomInButton = d3.select("body")
            .append("button")
            .text("+")
            .style("position", "fixed")
            .style("top", "10px")
            .style("right", "49px")
            .style("z-index", "10")
            .style("color", "#3d33ff")
            .on("click", () => zoomIn());

        const zoomOutButton = d3.select("body")
            .append("button")
            .text("-")
            .style("position", "fixed")
            .style("top", "10px")
            .style("right", "26px")
            .style("z-index", "10")
            .style("color", "#3d33ff")
            .on("click", () => zoomOut());

        const scaleDisplay = d3.select("body")
            .append("div")
            .style("position", "fixed")
            .style("top", "40px")
            .style("right", "20px")
            .style("z-index", "10")
            .style("color", "#3d33ff")
            .style("font-family", "Arial, sans-serif")
            .style("font-size", "14px")
            .style("background-color", "rgba(255, 255, 255, 0.8)")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .text(`Scale: ${currentScale.toFixed(1)}x`);

        function updateScaleDisplay() {
            scaleDisplay.text(`Scale: ${currentScale.toFixed(1)}x`);
        }

        function updateNodeAndTextSizes() {
            svg.selectAll("circle")
                .attr("r", d => getNodeSize(d));

            svg.selectAll("text")
                .style("font-size", d => getTextSize(d));
        }

        function zoomIn() {
            currentScale += 0.1;
            svg.attr("style", `width: 100%; height: auto; font: 10px sans-serif; transform: scale(${currentScale}); transform-origin: center center;`);
            updateScaleDisplay();
            updateNodeAndTextSizes();
        }

        function zoomOut() {
            currentScale -= 0.1;
            svg.attr("style", `width: 100%; height: auto; font: 10px sans-serif; transform: scale(${currentScale}); transform-origin: center center;`);
            updateScaleDisplay();
            updateNodeAndTextSizes();
        }
    }

    renderChart(data);
    return svg.node();
}

function _data(FileAttachment) {
    return FileAttachment("flare-2.json").json();
}

export default function define(runtime, observer) {
    const main = runtime.module();
    function toString() { return this.url; }
    const fileAttachments = new Map([
        ["flare-2.json", {url: new URL("./files/jacs.json", import.meta.url), mimeType: "application/json", toString}]
    ]);
    main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
    main.variable(observer()).define(["md"], _1);
    main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
    main.variable(observer("data")).define("data", ["FileAttachment"], _data);
    return main;
}
