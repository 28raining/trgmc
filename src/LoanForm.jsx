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

function FbComp({ x }) {
  if (x === null) return null;
  else {
    return (
      <div className="valid-feedback" style={{ display: "initial" }}>
        {x}
      </div>
    );
  }
}

function LoanForm({ displayState, flash, updateUserInput, valid }) {
  const [show, setShow] = useState(false);
  const feeOptions = ["$ / year", "$ / month", "% / year", "% / month"];

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
    "maintenance",
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

    if (displayState["lock"].includes(i)) inputClass[i] += " lock lockBG";
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

  return (
    <div>
      <div className="row shadow-sm border rounded pb-2 mb-3 mx-0" style={{ backgroundColor: "white" }}>
        <div className="col-12 text-center py-1">
          <small>
            <i>Mortgage Details</i>
          </small>
        </div>
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
        <div className="col-xl-4 col-12">
          <label>Interest Rate</label>
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
          <label>Loan Length</label>
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
        <div className="col-12">
          <div className="form-check mt-2">
            <input
              className="form-check-input"
              type="checkbox"
              checked={displayState["interestOnly"]}
              onChange={(e) => {
                updateUserInput("interestOnly", e.target.checked);
              }}
            />
            <label className="form-check-label">Interest-Only Loan</label>
          </div>
        </div>
      </div>

      <div className="row shadow-sm border rounded pb-2 mx-0" style={{ backgroundColor: "white" }}>
        <div className="col-12 py-1">
          <div className="d-flex align-items-center justify-content-between flex-wrap">
            <div className="order-2 order-md-1 flex-grow-1 d-md-block d-none"></div>
            <div className="order-1 order-md-2 text-center flex-grow-1">
              <small>
                <i>Household expenses</i>
              </small>
            </div>
            <div className="order-3 order-md-3 text-end">
              <button
                type="button"
                className="btn btn-link py-0"
                onClick={() => {
                  updateUserInput("propertyTaxUnit", 2);
                  updateUserInput("hoaUnit", 1);
                  updateUserInput("pmiUnit", 4);
                  updateUserInput("utilitiesUnit", 1);
                  updateUserInput("maintenanceUnit", 1);
                  updateUserInput("insuranceUnit", 0);

                  updateUserInput("propertyTax", "1.00");
                  updateUserInput("hoa", "300");
                  if (displayState["downPayPercent"] < 20) updateUserInput("pmi", "1.5");
                  else updateUserInput("pmi", "0");
                  updateUserInput("utilities", "120");
                  updateUserInput("maintenance", "300");
                  updateUserInput("insurance", "1000");
                }}
              >
                Populate with estimates
              </button>
            </div>
          </div>
        </div>
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
              className="form-select ps-2 grayBackground"
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
              className="form-select ps-2 grayBackground"
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
              className="form-select ps-2 grayBackground"
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
              className="form-select ps-2 grayBackground"
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
              className="form-select ps-2 grayBackground"
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
        <div className="col-xxl-4 col-sm-6 col-12">
          <label>Maintenance</label>
          <div className="input-group mb-1">
            <input
              type="text"
              className={inputClass["maintenance"]}
              value={
                displayState["maintenanceUnit"] == 0 || displayState["maintenanceUnit"] == 1
                  ? cashFormat(displayState["maintenance"])
                  : displayState["maintenance"]
              }
              onChange={(e) => {
                updateIfChanged(displayState["maintenance"], e.target.value, "maintenance");
              }}
            />

            <select
              className="form-select ps-2 grayBackground"
              value={displayState["maintenanceUnit"]}
              onChange={(e) => {
                updateUserInput("maintenanceUnit", e.target.value);
              }}
            >
              {feeOptions.map((x, i) => (
                <option value={i} key={i}>
                  {x}
                </option>
              ))}
            </select>
            <ValidFbComp x={valid["maintenance"]} />
          </div>
        </div>
        {displayState["pmi"] != 0 && (
          <div className="col-xxl-8 col-sm-6 col-12">
            <label>Appraisal Value </label>
            <div className="input-group mb-1">
              <input
                type="text"
                inputMode="numeric"
                className="form-control"
                value={displayState["appraisal"] == 0 ? "" : cashFormat(displayState["appraisal"])}
                placeholder="Defaults to Home Value"
                onChange={(e) => {
                  updateIfChanged(displayState["appraisal"], e.target.value, "appraisal");
                }}
              />
              <FbComp x={"PMI will cease when equity reaches 20% of appraisal"} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoanForm;
