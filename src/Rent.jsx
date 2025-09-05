import { DEFAULT_PLOTLY_COLORS } from "./common.js";
import { Chart } from "react-chartjs-2";
import { cashFormat } from "./loanMaths.js";
import infoIcon from "./assets/info.svg";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

function Rent({ loanMonths, inflation, downPayment, equity, homeVal, monthlyPayment, overPayments, totalFees, rentSim, setRentSim }) {
  const firstMonthPayment = monthlyPayment[0];

  var homeValArray = [];
  var i;

  // Calculate home value growth
  for (i = 0; i < loanMonths.length; i++) {
    homeValArray[i] = homeVal * inflation[i] * equity[i];
  }

  // Calculate stock market investment growth
  var stockArray = [];
  var stockBuyingPower = [];
  var stockValue = downPayment;
  stockArray[0] = stockValue;
  for (i = 1; i < loanMonths.length; i++) {
    stockBuyingPower[i] = monthlyPayment[i - 1] + overPayments[i - 1] + totalFees[i - 1] - rentSim.rent * inflation[i - 1];
    stockValue = stockValue * (1 + rentSim.stocks / 12) + stockBuyingPower[i];
    stockArray[i] = stockValue;
  }
  const totalCashInvested = stockBuyingPower.reduce((acc, curr) => acc + curr, 0);

  // Chart.js data
  const data = {
    labels: loanMonths,
    datasets: [
      {
        label: "Stock Market Value",
        data: stockArray,
        borderColor: DEFAULT_PLOTLY_COLORS[0],
        pointRadius: 0, // No markers
        pointHoverRadius: 5,
      },
      {
        label: "Home Equity (Inflation Adjusted)",
        data: homeValArray,
        borderColor: DEFAULT_PLOTLY_COLORS[1],
        pointRadius: 0, // No markers
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
        text: "Stock Market vs Home Value Growth",
      },
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Month",
        },
      },
      y: {
        title: {
          display: true,
          text: "Value ($)",
        },
        min: 0,
      },
    },
  };

  // Render chart with explanatory paragraph
  return (
    <div className="row px-2">
      <div className="col-12">
        <h5 className="my-2"> Instead of buying a home, what if that money was invested in the stock market?</h5>
        <ul>
          <li>Invested the down payment of {cashFormat(downPayment)}</li>
          <li>
            Rented a home for
            <div className="input-with-symbol">
              <input
                className="mx-1 ps-3"
                type="number"
                min="0"
                value={rentSim.rent}
                onChange={(e) => {
                  setRentSim({ ...rentSim, rent: parseFloat(e.target.value) });
                }}
                style={{ width: "10ch" }}
              />
            </div>
            per month
            <OverlayTrigger overlay={<Tooltip>{"Rent will increase with inflation"}</Tooltip>} placement="bottom">
              <img src={infoIcon} width="16px" className="ms-1" />
            </OverlayTrigger>
          </li>
          <li>
            Invested the monthly savings: (mortgage + expenses) - rent = {cashFormat(firstMonthPayment - rentSim.rent)}{" "}
            <OverlayTrigger
              overlay={<Tooltip>{"This number is the calculated based on the first month but the graph uses the actual monthly cost"}</Tooltip>}
              placement="bottom"
            >
              <img src={infoIcon} width="16px" className="ms-1" />
            </OverlayTrigger>
          </li>
          <li>
            The stock market grew by
            <div className="input-with-percent">
              <input
                className="mx-1 ps-1 pe-3"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={rentSim.stocks * 100}
                onChange={(e) => {
                  setRentSim({ ...rentSim, stocks: parseFloat(e.target.value) / 100 });
                }}
                style={{ width: "7ch" }}
              />
            </div>
            per year
          </li>
          {inflation[inflation.length - 1] == 1 && (
            <li style={{ color: "rgb(123 8 19)" }}>
              <b>Add inflation to make this more realistic - it will increase the home value, rent and all the expenses</b>
            </li>
          )}
        </ul>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-header">Buying a home</div>
          <div className="card-body py-1">
            <p className="card-text">You end up with a home worth {cashFormat(homeVal * inflation[inflation.length - 1])}</p>
          </div>
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-header">Investing the money</div>
          <div className="card-body py-1">
            <p className="card-text mb-0">
              You end up with {cashFormat(stockArray[stockArray.length - 1])} investment{" "}
              <small>
                <i> -- {cashFormat(stockArray[stockArray.length - 1] - totalCashInvested)} is taxable --</i>
              </small>
            </p>
          </div>
        </div>
      </div>
      <div className="col-12 mt-3">
        <div className="plotHeight">
          <Chart type="line" data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

export default Rent;
