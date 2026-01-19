import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  PointElement,
  LineElement,
  Legend,
} from "chart.js"; //Legend
ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, PointElement, LineElement, LineController, Legend); //Legend
import { useState } from "react";
import { DEFAULT_PLOTLY_COLORS } from "./common.js";
import { cashFormat } from "./loanMaths.js";

function LoanPlot({ maxMonthly, loanRes, loanMonths, propertyTax, hoa, pmi, utilities, maintenance, insurance, startDate, inflation }) {
  const [monthsPerYearToPlot, setMonthsPerYearToPlot] = useState("Yearly Breakdown");
  const yTitle = monthsPerYearToPlot == "Monthly Breakdown" ? "Monthly Payment" : "Yearly Payment";
  const startMonth = startDate.getMonth();

  // console.log('rem',loanRes)
  var monthlyPrincipalFiltered;
  var monthlyInterestFiltered;
  var loanMonthsFiltered = [];
  var remainingFiltered = [];
  var equityFiltered = [];
  var taxPlot = [];
  var hoaPlot = [];
  var pmiPlot = [];
  var utilitiesPlot = [];
  var maintenancePlot = [];
  var insPlot = [];
  const equityString = loanRes["equity"].map((i) => `${Math.round((1000 * i) / 10)}%`);

  if (monthsPerYearToPlot == "Monthly Breakdown") {
    loanMonthsFiltered = loanMonths;
    monthlyPrincipalFiltered = loanRes["monthlyPrincipal"];
    monthlyInterestFiltered = loanRes["monthlyInterest"];
    remainingFiltered = loanRes["remaining"];
    equityFiltered = equityString;
    pmiPlot = loanRes["monthlyPMI"];
    for (var i = 0; i < loanMonthsFiltered.length; i++) {
      // if (pmiUnit < 2) pmiPlot[i] = pmi;
      taxPlot[i] = propertyTax * inflation[i];
      hoaPlot[i] = hoa * inflation[i];
      utilitiesPlot[i] = utilities * inflation[i];
      maintenancePlot[i] = maintenance * inflation[i];
      insPlot[i] = insurance * inflation[i];
    }
  } else {
    //User wants to plot yearly - it's easier to read
    monthlyPrincipalFiltered = [0];
    monthlyInterestFiltered = [0];
    taxPlot = [0];
    hoaPlot = [0];
    pmiPlot = [0];
    utilitiesPlot = [0];
    maintenancePlot = [0];
    insPlot = [0];

    var prev_year;
    for (i = 0; i < loanMonths.length; i++) {
      var yearIndex = Math.floor((startMonth + i) / 12);

      var year = loanMonths[i].substring(4, 8);
      if (prev_year != year) {
        prev_year = year;
        loanMonthsFiltered[yearIndex] = loanMonths[i].substring(4, 8);
        remainingFiltered[yearIndex] = loanRes["remaining"][i];
        equityFiltered[yearIndex] = equityString[i];
      }
      // console.log(yearIndex)
      // if ((yearIndex==0) || (i==0)) {
      //   monthlyPrincipalFiltered.push(0);// = 0
      //   monthlyInterestFiltered[yearIndex] = 0
      // }
      if (yearIndex >= monthlyPrincipalFiltered.length) monthlyPrincipalFiltered.push(0);
      if (yearIndex >= monthlyInterestFiltered.length) monthlyInterestFiltered.push(0);
      if (yearIndex >= taxPlot.length) taxPlot.push(0);
      if (yearIndex >= hoaPlot.length) hoaPlot.push(0);
      if (yearIndex >= pmiPlot.length) pmiPlot.push(0);
      if (yearIndex >= utilitiesPlot.length) utilitiesPlot.push(0);
      if (yearIndex >= maintenancePlot.length) maintenancePlot.push(0);
      if (yearIndex >= insPlot.length) insPlot.push(0);
      monthlyPrincipalFiltered[yearIndex] = monthlyPrincipalFiltered[yearIndex] + loanRes["monthlyPrincipal"][i];
      monthlyInterestFiltered[yearIndex] = monthlyInterestFiltered[yearIndex] + loanRes["monthlyInterest"][i];
      pmiPlot[yearIndex] = pmiPlot[yearIndex] + loanRes["monthlyPMI"][i];
      // else pmiPlot[yearIndex] = pmiPlot[yearIndex] + pmi;
      taxPlot[yearIndex] = taxPlot[yearIndex] + propertyTax * inflation[i];
      hoaPlot[yearIndex] = hoaPlot[yearIndex] + hoa * inflation[i];
      utilitiesPlot[yearIndex] = utilitiesPlot[yearIndex] + utilities * inflation[i];
      maintenancePlot[yearIndex] = maintenancePlot[yearIndex] + maintenance * inflation[i];
      insPlot[yearIndex] = insPlot[yearIndex] + insurance * inflation[i];
    }
  }

  var data = {
    labels: loanMonthsFiltered,
    datasets: [
      {
        type: "bar",
        label: "Interest",
        data: monthlyInterestFiltered,
        backgroundColor: DEFAULT_PLOTLY_COLORS[0],
        hoverBackgroundColor: "rgba(0, 0, 0, 1.0)",
        barPercentage: 1.0,
        categoryPercentage: 1.0,
        borderWidth: 0,
        order: 3,
        yAxisID: "y",
      },
      {
        type: "bar",
        label: "Principal",
        data: monthlyPrincipalFiltered,
        backgroundColor: DEFAULT_PLOTLY_COLORS[1],
        hoverBackgroundColor: "rgba(0, 0, 0, 1.0)",
        barPercentage: 1.0,
        categoryPercentage: 1.0,
        borderWidth: 0,
        order: 2,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Remaining Balance",
        data: remainingFiltered,
        order: 1,
        yAxisID: "y1",
      },
    ],
  };

  var title = ["Tax", "HoA", "Insurance", "PMI", "Utilities", "Maintenance"];
  var pl = [taxPlot, hoaPlot, insPlot, pmiPlot, utilitiesPlot, maintenancePlot];
  [propertyTax, hoa, insurance, pmi, utilities, maintenance].forEach((x, i) => {
    if (x > 0) {
      data.datasets.push({
        type: "bar",
        label: title[i],
        data: pl[i],
        backgroundColor: DEFAULT_PLOTLY_COLORS[2 + i],
        hoverBackgroundColor: "rgba(0, 0, 0, 1.0)",
        barPercentage: 1.0,
        categoryPercentage: 1.0,
        borderWidth: 0,
        order: 4 + i,
        yAxisID: "y",
      });
    }
  });

  var options = {
    indexAxis: "x",
    maintainAspectRatio: false,
    scales: {
      y: {
        max: Math.round(maxMonthly),
        position: "left",
        stacked: true,
        grid: { display: false },
        ticks: {
          // minRotation: 20,
          // Include a dollar sign in the ticks
          callback: function (value) {
            return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(value);

            // return '$' + value;
          },
        },
        title: {
          text: yTitle,
          display: true,
          font: {
            size: 16,
          },
        },
      },
      y1: {
        position: "right",
        ticks: {
          // minRotation: 20,
          // Include a dollar sign in the ticks
          callback: function (value) {
            return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(value);

            // return '$' + value;
          },
        },
        title: {
          text: "Remaining Balance",
          display: true,
          font: {
            size: 16,
          },
        },
      },

      x: {
        stacked: true,
        grid: { display: false },
      },
    },
    interaction: {
      mode: "index",
    },
    plugins: {
      legend: {
        display: false,
        position: "bottom",
      },
      tooltip: {
        titleFont: {
          size: 16,
        },
        bodyFont: {
          size: 16,
        },
        callbacks: {
          title: function (context) {
            var sum = 0;
            context.forEach((c) => {
              if (c.dataset.label != "Remaining Balance") sum = sum + c.raw;
            });
            return `${context[0].label} - ${cashFormat(sum)}`;
          },
          label: function (context) {
            let label = context.dataset.label || "";

            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(context.parsed.y);
            }
            return label;
          },
          footer: function (context) {
            // Add an extra row in the tooltip
            return `Equity: ${equityFiltered[context[0].dataIndex]}`;
          },
        },
      },
    },
  };

  return (
    <div className="row shadow-sm border rounded pb-1 mb-3 mx-2 px-1" style={{ backgroundColor: "white" }}>
      <div className="col-12 text-center py-1">
        <small>
          <i>Graph showing payment breakdown over time</i>
        </small>
      </div>
      <div className="col-12 px-0">
        <div className="plotHeight">
          <Chart type="bar" data={data} options={options} />
        </div>

        <div className="row mx-0">
          <div className="col-12 ps-4">
            {["Monthly Breakdown", "Yearly Breakdown"].map((x) => (
              <div className="form-check form-check-inline" key={x}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="numMonPlot"
                  checked={monthsPerYearToPlot == x}
                  value={x}
                  onChange={() => setMonthsPerYearToPlot(x)}
                />
                <label className="form-check-label">{x}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoanPlot;
