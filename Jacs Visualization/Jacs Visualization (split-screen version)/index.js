function _1(md) {
    return md`<div style="color: grey; font: 13px/25.5px var(--sans-serif); text-transform: uppercase;"><h1 style="display: none;">Radial cluster tree</h1><a href="https://d3js.org/"></a>  <a href="/@d3/gallery"></a></div>

[](https://d3js.org/d3-hierarchy/cluster)[](/@d3/radial-tree/2?intent=fork)[](/@d3/tree-of-life?intent=fork)[](/@d3/cluster/2?intent=fork)`;
}

function _chart(d3, data) {
    const totalWidth = window.innerWidth;
    const height = window.innerHeight;
    const initialLeftWidth = totalWidth * 0.7;
    let leftWidth = initialLeftWidth;
    const initialScale = 1;
    let currentScale = initialScale;
    let rightData = null;

    // 创建容器
    const container = d3.create("div")
        .style("display", "flex")
        .style("width", "100%")
        .style("height", "100vh");

    // 左侧栏
    const leftPane = container.append("div")
        .style("width", `${leftWidth}px`)
        .style("height", "100%")
        .style("overflow", "hidden");

    // 分隔线
    const divider = container.append("div")
        .style("width", "10px")
        .style("height", "100%")
        .style("background-color", "#ccc")
        .style("cursor", "col-resize");

    // 右侧栏
    const rightPane = container.append("div")
        .style("width", `${totalWidth - leftWidth - 10}px`)
        .style("height", "100%")
        .style("display", "flex")
        .style("flex-direction", "column");

    // 右侧上方图表区域
    const rightChartArea = rightPane.append("div")
        .style("height", "85%")
        .style("overflow", "hidden")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center");

    // 添加初始文字
    const initialText = rightChartArea.append("p")
        .text("Click to view details")
        .style("font-size", "18px")
        .style("color", "#888");

    // 右侧下方详情区域
    const detailArea = rightPane.append("div")
        .style("height", "15%")
        .style("background-color", "#f0f0f0")
        .style("padding", "10px")
        .style("overflow", "auto");

    // 初始化详情区域文本
    const detailText = detailArea.append("p")
        .text("Hover to view details")
        .style("margin", "0");

    // 分隔线拖动功能
    divider.call(d3.drag().on("drag", (event) => {
        leftWidth = Math.max(0, Math.min(totalWidth - 10, leftWidth + event.dx));
        leftPane.style("width", `${leftWidth}px`);
        rightPane.style("width", `${totalWidth - leftWidth - 10}px`);
        updateCharts();
    }));

    function createChart(container, data, width, height, isLeftPane = true) {
        const cx = width * 0.5;
        const cy = height * 0.5;
        const radius = Math.min(width, height) / 2 - 100;

        // 定义颜色函数
        const colorByDepth = d => {
            const colors = [
                "rgb(63, 45, 107)",   // 第一层（根节点）
                "rgb(83, 51, 140)",  // 第二层
                "rgb(174, 78, 137)", // 第三层
                "rgb(234, 141, 158)", // 第四层
                "rgb(236, 204, 183)"   // 第五层（叶子节点）

            ];
            return colors[Math.min(d.depth, colors.length - 1)];
        };

        const tree = d3.cluster()
            .size([2 * Math.PI, radius])
            .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

        const root = tree(d3.hierarchy(data)
            .sort((a, b) => d3.ascending(a.data.name, b.data.name)));

        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-cx, -cy, width, height])
            .attr("style", `width: 100%; height: 100%; font: 10px sans-serif; ${isLeftPane ? `transform: scale(${currentScale}); transform-origin: center center;` : ''}`);

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
            .on("mouseout", handleMouseOut)
            .on("click", handleClick);

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
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", handleClick);

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
                .style("font-size", n => highlightNodes.includes(n) ? "12px" : getTextSize(n));

            // 更新详情区域
            detailText.html(`${d.data.code}: ${d.data.name}<br>${d.data.definition || ""}`);
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

            // 重置详情区域
            detailText.text("Hover to view details");
        }

        function handleClick(event, d) {
            if (d.children && isLeftPane) {
                rightData = d.data;
                updateRightPane();
            }
        }

        return svg.node();
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

    function getTextSize(d) {
        if (currentScale <= 10.0) return "10px";
        const scaleFactor = (currentScale - 10.0) / 0.1;
        if (d.depth === 1) return `${10 * Math.pow(1.02, scaleFactor)}px`;
        if (d.depth === 2) return `${10 * Math.pow(0.99, scaleFactor)}px`;
        if (d.depth === 3) return `${10 * Math.pow(0.96, scaleFactor)}px`;
        if (d.depth >= 4) return `${10 * Math.pow(0.93, scaleFactor)}px`;
        return "10px";
    }

    function updateCharts() {
        leftPane.html("");
        createChart(leftPane, data, leftWidth, height);
        updateRightPane();
    }

    function updateRightPane() {
        rightChartArea.html("");
        if (rightData) {
            createChart(rightChartArea, rightData, totalWidth - leftWidth - 10, height * 0.85, false);
        } else {
            // 如果没有右侧数据，显示初始文字
            rightChartArea.append("p")
                .text("Click to view details")
                .style("font-size", "18px")
                .style("color", "#888");
        }
    }

    // 缩放按钮
    const zoomContainer = container.append("div")
        .style("position", "fixed")
        .style("top", "10px")
        .style("left", "10px")
        .style("z-index", "10");

    const zoomInButton = zoomContainer.append("button")
        .text("+")
        .style("margin-right", "5px")
        .style("color", "#3d33ff")
        .on("click", () => {
            currentScale += 0.1;
            updateCharts();
            updateScaleDisplay();
        });

    const zoomOutButton = zoomContainer.append("button")
        .text("-")
        .style("color", "#3d33ff")
        .on("click", () => {
            currentScale -= 0.1;
            updateCharts();
            updateScaleDisplay();
        });

    const scaleDisplay = zoomContainer.append("span")
        .style("margin-left", "10px")
        .style("color", "#3d33ff")
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "14px");

    function updateScaleDisplay() {
        scaleDisplay.text(`Scale: ${currentScale.toFixed(1)}x`);
    }

    updateScaleDisplay();
    createChart(leftPane, data, leftWidth, height);

    return container.node();
}

function _data(FileAttachment) {
    return FileAttachment("flare-2.json").json();
}

export default function define(runtime, observer) {
    const main = runtime.module();
    function toString() { return this.url; }
    const fileAttachments = new Map([
        ["flare-2.json", {url: new URL("./files/jacs-beta.json", import.meta.url), mimeType: "application/json", toString}]
    ]);
    main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
    main.variable(observer()).define(["md"], _1);
    main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
    main.variable(observer("data")).define("data", ["FileAttachment"], _data);
    return main;
}
