


function streamgraph(csvpath, color, flow, divToAttach) {

var datearray = [];
var colorrange = [];

if (color == "blue") {
  // colorrange = ["#045A8D", "#2B8CBE", "#74A9CF", "#A6BDDB", "#D0D1E6", "#F1EEF6"];
  colorrange = ["#bd0026", "#f03b20", "#fd8d3c", "#feb24c", "#fed976", "#ffffb2"];
}
else if (color == "pink") {
  colorrange = ["#980043", "#DD1C77", "#DF65B0", "#C994C7", "#D4B9DA", "#F1EEF6"];
}
else if (color == "orange") {
  colorrange = ["#B30000", "#E34A33", "#FC8D59", "#FDBB84", "#FDD49E", "#FEF0D9"];
}
strokecolor = colorrange[0];

var format = d3.time.format("%Y");
var valueFormat = d3.format(",d");

var margin = {top: 20, right: 40, bottom: 30, left: 60};
var width = d3.select(divToAttach).node().clientWidth - margin.left - margin.right;
var height = 400 - margin.top - margin.bottom;

var tooltip = d3.select("body")
    .append("div")
		.attr("class", "remove"+divToAttach)
    .style("position", "absolute")
    .style("z-index", "20")
		.style("visibility", "hidden")
		// .style("background-color", "rgba(255, 255, 255, 0.6)")
		.style("padding", "5px")
    // .style("top", "230px")
    .style("left", "155px");

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height-10, 0]);

var z = d3.scale.ordinal()
    .range(colorrange.reverse());

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(d3.time.years);

function yAxisFormatter(d) {
  d = d/1000000000;
  return "USD " + d3.format(",")(d) + " Bn";
}

var yAxis = d3.svg.axis().tickFormat(yAxisFormatter)
    .scale(y);

var yAxisr = d3.svg.axis()
    .scale(y);

var stack = d3.layout.stack()
    .offset("silhouette")
    .values(function(d) { return d.values; })
    .x(function(d) { return d.date; })
		.y(function(d) { return d.value; });

var nest = d3.nest()
    .key(function(d) { return d.key; });

var area = d3.svg.area()
    .interpolate("cardinal")
    .x(function(d) { return x(d.date); })
    .y0(function(d) { return y(d.y0); })
    .y1(function(d) { return y(d.y0 + d.y); });

var svg = d3.select(divToAttach).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var graph = d3.csv(csvpath, function(originalData) {
	// originalData = originalData.filter(function(d) { 
	// 	return d["Trade Flow"] == flow && d["Trade Flow"] == "Non-Extractives";
	// })
	var years = originalData.map(function(d){return d["Year"]});

  var data = originalData.map(function(d) {
		// console.log(d);
		// console.log(+d["Value_USD|"+flow+"|Extractives"]);
		var returnVal = {};
		var non_extractive_value = +d["Value_USD|"+flow+"|Non Extractives"] 
			? +d["Value_USD|"+flow+"|Non Extractives"] : 0
		var extractive_value = +d["Value_USD|"+flow+"|Extractives"] 
			? +d["Value_USD|"+flow+"|Extractives"] : 0

    returnVal.date = format.parse(d["Year"]);
		returnVal.value = non_extractive_value + extractive_value;
		returnVal.key = d["Top_Country_or_Other"];
		return returnVal;
	});
	

	console.log(data);
	


	// var nestedData = nest.entries(data);
	// console.log(nestedData);
  var layers = stack(nest.entries(data));

  x.domain(d3.extent(data, function(d) { return d.date; }));
  // y.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);
  y.domain([0, 22000000000]);

  svg.selectAll(".layer")
      .data(layers)
    .enter().append("path")
      .attr("class", "layer")
      .attr("d", function(d) { return area(d.values); })
      .style("fill", function(d, i) { return z(i); });


  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

//   svg.append("g")
//       .attr("class", "y axis")
//       .attr("transform", "translate(" + width + ", 0)")
//       .call(yAxis.orient("right"));

  getTooltip = function(d,year,pro) {
    if (flow === "Export") 
      return  "<p>Exports from Myanmar <br>to <span class='tooltiphighlight'>" 
        + d.key + "</span><br>in <span class='tooltiphighlight'>" 
        + year + "</span>:<br><span class='tooltiphighlight'>USD " 
        + valueFormat(pro) + "</span></p>"
    else 
      return  "<p>Imports to <span class='tooltiphighlight'>" 
        + d.key + "</span><br> from Myanmar<br>in <span class='tooltiphighlight'>" 
        + year + "</span>:<br><span class='tooltiphighlight'>USD " 
        + valueFormat(pro) + "</span></p>";
  }

  svg.append("g")
			.attr("class", "y axis")
      .call(yAxis.orient("left"));

  svg.selectAll(".layer")
    .attr("opacity", 1)
    .on("mouseover", function(d, i) {
      svg.selectAll(".layer").transition()
      .duration(250)
      .attr("opacity", function(d, j) {
        return j != i ? 0.6 : 1;
    })})

    .on("mousemove", function(d, i) {
			var bodyRect = document.body.getBoundingClientRect(),
			streamElemRect = this.getBoundingClientRect(),
			tooltipOffset   = streamElemRect.top - bodyRect.top;
			
			// console.log(d);
			mouse = d3.mouse(this);
			// console.log(mouse);			
      mousex = mouse[0];
			var invertedx = x.invert(mousex);
      // invertedx = invertedx.getMonth() + invertedx.getDate();
      invertedx = invertedx.getYear();
      var selected = (d.values);
      for (var k = 0; k < selected.length; k++) {
        datearray[k] = selected[k].date
        // datearray[k] = datearray[k].getMonth() + datearray[k].getDate();
        datearray[k] = datearray[k].getYear();
      }

			mousedate = datearray.indexOf(invertedx);
			var pro = d.values[mousedate] ? d.values[mousedate].value : 0;
			year = d.values[mousedate] ? d.values[mousedate].date.getYear() + 1900: 0;
			;

      d3.select(this)
      .classed("hover", true)
      .attr("stroke", strokecolor)
      .attr("stroke-width", "0.5px"), 
			// tooltip.html(  "<p>" + d.key + "<br>" + year + "<br>USD " + valueFormat(pro) + "</p>" )
			tooltip.html( getTooltip(d,year,pro) )
				.style("visibility", "visible")
				.style("top",tooltipOffset+"px");
      
    })
    .on("mouseout", function(d, i) {
     svg.selectAll(".layer")
      .transition()
      .duration(250)
      .attr("opacity", "1");
      d3.select(this)
      .classed("hover", false)
			// .attr("stroke-width", "0px"), tooltip.html( "<p>" + d.key + "<br>" + year + "<br>" + pro + "</p>" )
			.attr("stroke-width", "0px"), tooltip.html( getTooltip(d,year,pro) )
				.style("visibility", "hidden");
	})
	var bodyRect = document.body.getBoundingClientRect(),
			verticalBarElemRect = d3.select(divToAttach).node().getBoundingClientRect(),
			verticalBarOffset   = verticalBarElemRect.top - bodyRect.top;

	console.log(verticalBarOffset);
    
  var vertical = d3.select(divToAttach)
        .append("div")
        .attr("class", "remove"+divToAttach)
        .style("position", "absolute")
        .style("z-index", "19")
        .style("width", "1px")
        .style("height", "380px")
        .style("top", verticalBarOffset+"px")
        .style("bottom", "30px")
        .style("left", "0px")
        .style("background", "#fff");

  d3.select(divToAttach)
      .on("mousemove", function(){  
         mousex = d3.mouse(this);
         mousex = mousex[0] + 5;
         vertical.style("left", mousex + "px" )})
      .on("mouseover", function(){  
         mousex = d3.mouse(this);
         mousex = mousex[0] + 5;
         vertical.style("left", mousex + "px")});
});
}