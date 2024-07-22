import { isNumber } from "./loanMaths.js";
import { Calendar } from "react-calendar";
import { Modal } from "react-bootstrap";
import { useState } from "react";
import { cashFormat } from "./loanMaths.js";

function ValidFbComp({ x }) {
  if (x === null) return null;
  else {
    return (
      <div className="invalid-feedback" style={{ display: "initial" }}>
        {x}
      </div>
    );
  }
}

function LoanForm({ displayState, flash, updateUserInput, valid }) {
  const [show, setShow] = useState(false);
  const feeOptions = ["$ / year", "$ / month", "% / year", "% / month"];
  const extraPayments =
    displayState["propertyTax"] > 0 || displayState["hoa"] > 0 || displayState["insurance"] > 0 || displayState["pmi"] || displayState["utilities"] > 0;

  //builds class for each input based on flash (whether it changed and should flash) and valid (if user input is valid)
  const startDateOptions = { month: "short", year: "numeric" };
  var inputClass = {};
  for (const i of [
    "homeVal",
    "monthlyPayment",
    "downPayCash",
    "downPayPercent",
    "loanAmount",
    "interestRate",
    "loanLength",
    "propertyTax",
    "hoa",
    "pmi",
    "utilities",
    "insurance",
  ]) {
    inputClass[i] = "form-control";

    if (i in valid) {
      inputClass[i] += valid[i] === null ? "" : " is-invalid";
      // validFb = valid[i] === null ? null :
      //   <div className="invalid-feedback" style={{ display: "initial" }}>
      //     {valid[i]}
      //   </div>
    } else console.log(`${i} missing from valid`);

    if (i in flash) inputClass[i] += flash[i] ? " anim1" : " anim2";
    else console.log(`${i} missing from flash`);

    if (displayState["lock"].includes(i)) inputClass[i] += " lock";
  }
  // console.log('inputClass', inputClass)

  function updateIfChanged(oldVal, newVal, name) {
    var parsedNewVal = newVal.replace(/[^0-9.]+/g, "");
    if (oldVal !== parsedNewVal) {
      if (oldVal === "0" && isNumber(parsedNewVal)) {
        var noLeading0 = parseFloat(parsedNewVal).toString();
      } else noLeading0 = parsedNewVal;

      if (newVal.slice(-1) === "." && noLeading0.slice(-1) !== ".") {
        noLeading0 = `${noLeading0}.`;
      }

      updateUserInput(name, noLeading0);
    }
  }

  function calToMonth(v) {
    var newDate = new Date(v);
    // console.log(newDate.getMonth())}

    setShow(false);
    updateUserInput("startDate", newDate.getTime());
  }

  // console.log("displayState", displayState["monthlyPayment"], cashFormat(displayState["monthlyPayment"]));
  return (
    <div>
      <div className="row shadow-sm border rounded mb-3 py-2 mx-0">
        <div className="col-12">
          <div className="row">
            <div className="col-5 pe-0">
              <label>Home Value</label>
              <input
                // key={homeVal}
                type="text"
                inputMode="numeric"
                className={inputClass["homeVal"]}
                value={cashFormat(displayState["homeVal"])}
                onChange={(e) => updateIfChanged(displayState["homeVal"], e.target.value, "homeVal")}
              />
              <ValidFbComp x={valid["homeVal"]} />
              {extraPayments ? (
                <label>
                  <small></small>
                </label>
              ) : null}
            </div>
            <div className="col-2 text-center align-self-center">or</div>
            <div className="col-5 ps-0">
              <label>Monthly Payment</label>
              <input
                type="text"
                inputMode="numeric"
                className={inputClass["monthlyPayment"]}
                onChange={(e) => updateIfChanged(displayState["monthlyPayment"], e.target.value, "monthlyPayment")}
                value={cashFormat(displayState["monthlyPayment"])}
              />

              <ValidFbComp x={valid["monthlyPayment"]} />
              {extraPayments ? (
                <label>
                  <small>{cashFormat(displayState["monthlyPaymentToLoan"])} towards loan</small>
                </label>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="row shadow-sm border rounded mb-3 py-2 mx-0">
        <div className="col-12">
          <div className="row">
            <div className="col-12">
              <label>Down Payment</label>

              <div className="input-group mb-1">
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputClass["downPayCash"]}
                  // className={userSetDownPercent ? (flash["downPay"] ? "form-control anim1" : "form-control anim2") : "form-control"}
                  style={{ width: "70px" }}
                  value={cashFormat(displayState["downPayCash"])}
                  onChange={(e) => {
                    updateIfChanged(displayState["downPayCash"], e.target.value, "downPayCash");

                    // updateUserInput("downPayCash", e.target.value.replace(/[^0-9.]+/g, ""))
                    // updateDownPayCash(e.target.value.replace(/[^0-9.]+/g, ""));
                  }}
                />
                <span className="input-group-text">or</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputClass["downPayPercent"]}
                  // className={userSetDownPercent ? "form-control" : flash["downPay"] ? "form-control anim1" : "form-control anim2"}
                  value={displayState["downPayPercent"]}
                  onChange={(e) => {
                    updateIfChanged(displayState["downPayPercent"], e.target.value, "downPayPercent");
                    // updateUserInput("downPayPercent", e.target.value)

                    // updateDownPayPercent(e.target.value);
                  }}
                />
                <span className="input-group-text">%</span>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-4 col-12">
              <label>Interest rate</label>
              <div className="input-group mb-1">
                <input
                  type="text"
                  // className="form-control"
                  className={inputClass["interestRate"]}
                  value={displayState["interestRate"]}
                  onChange={(e) => updateIfChanged(displayState["interestRate"], e.target.value, "interestRate")}
                />
                <span className="input-group-text">%</span>
              </div>
            </div>
            <div className="col-xl-4 col-12">
              <label>Loan length</label>
              <div className="input-group mb-1">
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputClass["loanLength"]}
                  value={displayState["loanLength"]}
                  onChange={(e) => {
                    updateIfChanged(displayState["loanLength"], e.target.value, "loanLength");
                    // updateUserInput("loanLength", e.target.value.replace(/[^0-9.]+/g, ""));
                  }}
                />
                <span className="input-group-text">years</span>
              </div>
              <ValidFbComp x={valid["loanLength"]} />
            </div>

            <div className="col-xl-4 col-12">
              <label>Start Date</label>
              <output type="text" className="form-control" value="may" onClick={() => setShow(true)}>
                {new Intl.DateTimeFormat("en-US", startDateOptions).format(displayState["startDate"])}
              </output>

              <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton>
                  <Modal.Title>Chose the starting month</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Calendar maxDetail="year" onClickMonth={(v) => calToMonth(v)} />
                </Modal.Body>
              </Modal>
            </div>
            {/* <div className="col-xl-6 col-12">
              <label>Loan Amount</label>

              <input
                type="text"
                inputMode="numeric"
                className={inputClass["loanAmount"]}
                // className={flash["loanAmount"] ? "form-control anim1" : "form-control anim2"}
                value={cashFormat(displayState["loanAmount"])}
                onChange={
                  (e) =>
                    // console.log("triggered loanAmount Change");
                    updateIfChanged(displayState["loanAmount"], e.target.value, "loanAmount")
                  // updateUserInput("loanAmount", e.target.value.replace(/[^0-9.]+/g, ""))

                  // setLoanAmount(e.target.value.replace(/[^0-9.]+/g, ""));
                }
              />
            </div> */}
          </div>
        </div>
      </div>

      <div className="row shadow-sm border rounded py-2 mx-0">
        <div className="col-12 px-0">
          <div className="row mx-0">
            <div className="col-xxl-4 col-sm-6 col-12">
              <label>Property Tax</label>
              <div className="input-group mb-1">
                <input
                  type="text"
                  className={inputClass["propertyTax"]}
                  value={
                    displayState["propertyTaxUnit"] == 0 || displayState["propertyTaxUnit"] == 1
                      ? cashFormat(displayState["propertyTax"])
                      : displayState["propertyTax"]
                  }
                  onChange={(e) => {
                    updateIfChanged(displayState["propertyTax"], e.target.value, "propertyTax");
                  }}
                />

                <select
                  className="form-select ps-2 input-group-text"
                  value={displayState["propertyTaxUnit"]}
                  onChange={(e) => {
                    updateUserInput("propertyTaxUnit", e.target.value);
                  }}
                >
                  {feeOptions.map((x, i) => (
                    <option value={i} key={i}>
                      {x}
                    </option>
                  ))}
                </select>
                <ValidFbComp x={valid["propertyTax"]} />
              </div>
            </div>

            <div className="col-xxl-4 col-sm-6 col-12">
              <label>
                HOA{" "}
                <small>
                  <em>Homeowners Association</em>
                </small>
              </label>
              <div className="input-group mb-1">
                <input
                  type="text"
                  className={inputClass["hoa"]}
                  value={displayState["hoaUnit"] == 0 || displayState["hoaUnit"] == 1 ? cashFormat(displayState["hoa"]) : displayState["hoa"]}
                  onChange={(e) => {
                    updateIfChanged(displayState["hoa"], e.target.value, "hoa");
                  }}
                />

                <select
                  className="form-select ps-2 input-group-text"
                  value={displayState["hoaUnit"]}
                  onChange={(e) => {
                    updateUserInput("hoaUnit", e.target.value);
                  }}
                >
                  {feeOptions.map((x, i) => (
                    <option value={i} key={i}>
                      {x}
                    </option>
                  ))}
                </select>
                <ValidFbComp x={valid["hoa"]} />
              </div>
            </div>

            <div className="col-xxl-4 col-sm-6 col-12">
              <label>Insurance</label>
              <div className="input-group mb-1">
                <input
                  type="text"
                  className={inputClass["insurance"]}
                  value={
                    displayState["insuranceUnit"] == 0 || displayState["insuranceUnit"] == 1 ? cashFormat(displayState["insurance"]) : displayState["insurance"]
                  }
                  onChange={(e) => updateIfChanged(displayState["insurance"], e.target.value, "insurance")}
                />

                <select
                  className="form-select ps-2 input-group-text"
                  value={displayState["insuranceUnit"]}
                  onChange={(e) => {
                    updateUserInput("insuranceUnit", e.target.value);
                  }}
                >
                  {feeOptions.map((x, i) => (
                    <option value={i} key={i}>
                      {x}
                    </option>
                  ))}
                </select>
                <ValidFbComp x={valid["insurance"]} />
              </div>
            </div>

            <div className="col-xxl-4 col-sm-6 col-12">
              <label>
                PMI{" "}
                <small>
                  <em>Private Mortgage Insurance</em>
                </small>
              </label>
              <div className="input-group mb-1">
                <input
                  type="text"
                  className={inputClass["pmi"]}
                  value={displayState["pmiUnit"] == 0 || displayState["pmiUnit"] == 1 ? cashFormat(displayState["pmi"]) : displayState["pmi"]}
                  onChange={(e) => {
                    updateIfChanged(displayState["pmi"], e.target.value, "pmi");
                  }}
                />

                {/* Special treatiment for PMI because it's a % of loan amount, not of home value */}
                <select
                  className="form-select ps-2 input-group-text"
                  value={displayState["pmiUnit"] == 4 ? 2 : displayState["pmiUnit"] == 5 ? 3 : displayState["pmiUnit"]}
                  onChange={(e) => {
                    var pmiHack;
                    if (e.target.value == 2) pmiHack = 4;
                    else if (e.target.value == 3) pmiHack = 5;
                    else pmiHack = e.target.value;
                    updateUserInput("pmiUnit", pmiHack);
                  }}
                >
                  {feeOptions.map((x, i) => (
                    <option value={i} key={i}>
                      {x}
                    </option>
                  ))}
                </select>
                <ValidFbComp x={valid["pmi"]} />
              </div>
            </div>

            <div className="col-xxl-4 col-sm-6 col-12">
              <label>
                Utilities{" "}
                <small>
                  <a href="https://www.forbes.com/home-improvement/living/monthly-utility-costs-by-state/" target="_blank" rel="noopener noreferrer">
                    how much?
                  </a>
                </small>
              </label>
              <div className="input-group mb-1">
                <input
                  type="text"
                  className={inputClass["utilities"]}
                  value={
                    displayState["utilitiesUnit"] == 0 || displayState["utilitiesUnit"] == 1 ? cashFormat(displayState["utilities"]) : displayState["utilities"]
                  }
                  onChange={(e) => {
                    updateIfChanged(displayState["utilities"], e.target.value, "utilities");
                  }}
                />

                <select
                  className="form-select ps-2 input-group-text"
                  value={displayState["utilitiesUnit"]}
                  onChange={(e) => {
                    updateUserInput("utilitiesUnit", e.target.value);
                  }}
                >
                  {feeOptions.map((x, i) => (
                    <option value={i} key={i}>
                      {x}
                    </option>
                  ))}
                </select>
                <ValidFbComp x={valid["utilities"]} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoanForm;
