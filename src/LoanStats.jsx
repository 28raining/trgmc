import { cashFormat } from "./loanMaths.js";

function scaleMonthlyWUnit(v, unit, homeVal, length, loanAmount) {
  if (unit == 0) return (parseFloat(v) * length) / 12;
  else if (unit == 1) return parseFloat(v) * length;
  else if (unit == 2) return (parseFloat(v) * homeVal * length) / 1200;
  else if (unit == 3) return (parseFloat(v) * homeVal * length) / 100;
  else if (unit == 4) return (parseFloat(v) * loanAmount * length) / 1200;
  else if (unit == 5) return (parseFloat(v) * loanAmount * length) / 100;
}

function sumArray(arr) {
  let sum = 0;
  arr.forEach((number) => {
    sum += number;
  });
  return sum;
}

function LoanStats({ loanRes, userInput }) {
  const lastMonth = loanRes["loanMonths"][loanRes["loanMonths"].length - 1];
  const lengthWithInflation = sumArray(loanRes["inflation"]);

  var totalPrincipal = 0;
  var totalInterest = 0;
  for (const i of loanRes["monthlyPrincipal"]) totalPrincipal = totalPrincipal + i;
  for (const i of loanRes["monthlyInterest"]) totalInterest = totalInterest + i;
  var totalTax = scaleMonthlyWUnit(userInput["propertyTax"], userInput["propertyTaxUnit"], loanRes["homeVal"], lengthWithInflation, loanRes["loanAmount"]);
  var totalHoA = scaleMonthlyWUnit(userInput["hoa"], userInput["hoaUnit"], loanRes["homeVal"], lengthWithInflation, loanRes["loanAmount"]);
  var totalpmi = 0;
  var pmiPayments = 0;
  const totalFeesSum = loanRes["totalFees"].reduce((a, b) => a + b, 0);

  for (var ii = 0; ii < loanRes["monthlyPMI"].length; ii++) {
    totalpmi += loanRes["monthlyPMI"][ii];
    if (loanRes["monthlyPMI"][ii] > 0) pmiPayments += 1;
  }
  // }
  var totalutilities = scaleMonthlyWUnit(userInput["utilities"], userInput["utilitiesUnit"], loanRes["homeVal"], lengthWithInflation, loanRes["loanAmount"]);
  var totalmaintenance = scaleMonthlyWUnit(
    userInput["maintenance"],
    userInput["maintenanceUnit"],
    loanRes["homeVal"],
    lengthWithInflation,
    loanRes["loanAmount"]
  );
  var totalInsurance = scaleMonthlyWUnit(userInput["insurance"], userInput["insuranceUnit"], loanRes["homeVal"], lengthWithInflation, loanRes["loanAmount"]);
  const thereWereExtraPayments =
    totalTax > 0 ||
    totalHoA > 0 ||
    totalpmi > 0 ||
    totalutilities > 0 ||
    totalmaintenance > 0 ||
    totalInsurance > 0 ||
    loanRes["extraPayments"] > 0 ||
    totalFeesSum > 0;

  return (
    <div className="row shadow-sm border rounded pb-2 mx-0" style={{ backgroundColor: "white" }}>
      <div className="col-12 text-center py-1">
        <small>
          <i>Cost breakdown over life of the mortgage</i>
        </small>
      </div>
      <div className="col-12">
        <div className="input-group pb-2">
          <span className="input-group-text outputLabelWidth">Last Payment Date</span>
          <output type="text" className="form-control bg-warning-subtle">
            {lastMonth}
          </output>
        </div>

        <div className="input-group pb-2">
          <span className="input-group-text outputLabelWidth">Total Loan Re-Payment</span>
          <output type="text" className="form-control bg-warning-subtle">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(
              totalPrincipal + totalInterest + loanRes["extraPayments"]
            )}
          </output>
        </div>
        {!thereWereExtraPayments ? null : (
          <div className="input-group pb-2">
            <span className="input-group-text outputLabelWidth">
              Total Costs<small>&nbsp;(to {lastMonth})</small>
            </span>
            <output type="text" className="form-control bg-warning-subtle">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(
                totalPrincipal +
                  totalInterest +
                  loanRes["extraPayments"] +
                  totalTax +
                  totalHoA +
                  totalpmi +
                  totalutilities +
                  totalmaintenance +
                  totalInsurance +
                  totalFeesSum
              )}
            </output>
          </div>
        )}
        <div className="row">
          <div className="col-xxl-6 col-sm-12">
            <li>Principal: {cashFormat(totalPrincipal)}</li>
          </div>
          <div className="col-xxl-6 col-sm-12">
            <li>Interest: {cashFormat(totalInterest)}</li>
          </div>
          {loanRes["extraPayments"] > 0 ? (
            <div className="col-xxl-6 col-sm-12">
              <li>Overpayments: {cashFormat(loanRes["extraPayments"])}</li>
            </div>
          ) : null}
          {totalFeesSum > 0 ? (
            <div className="col-xxl-6 col-sm-12">
              <li>Fees & Expenses: {cashFormat(totalFeesSum)}</li>
            </div>
          ) : null}
          {userInput["propertyTax"] > 0 ? (
            <div className="col-xxl-6 col-sm-12">
              <li>Tax: {cashFormat(totalTax)}</li>
            </div>
          ) : null}
          {userInput["hoa"] > 0 ? (
            <div className="col-xxl-6 col-sm-12">
              <li>HoA: {cashFormat(totalHoA)}</li>
            </div>
          ) : null}
          {userInput["pmi"] > 0 ? (
            <div className="col-xxl-6 col-sm-12">
              <li>
                PMI: {cashFormat(totalpmi)}{" "}
                <small>
                  <em>({pmiPayments} payments)</em>
                </small>
              </li>
            </div>
          ) : null}
          {userInput["utilities"] > 0 ? (
            <div className="col-xxl-6 col-sm-12">
              <li>Utilities: {cashFormat(totalutilities)}</li>
            </div>
          ) : null}
          {userInput["maintenance"] > 0 ? (
            <div className="col-xxl-6 col-sm-12">
              <li>Maintenance: {cashFormat(totalmaintenance)}</li>
            </div>
          ) : null}
          {userInput["insurance"] > 0 ? (
            <div className="col-xxl-6 col-sm-12">
              <li>Insurance: {cashFormat(totalInsurance)}</li>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default LoanStats;
