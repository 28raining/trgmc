import { cashFormat, isNumber } from "./loanMaths.js";

function ModeToggle({ chosenInput, displayState, valid, flash, userInput, updateUserInput }) {
  const handleHomeValClick = () => {
    if (chosenInput !== "homeVal") {
      updateUserInput("homeVal", userInput.homeVal);
    }
  };

  const handleMonthlyPaymentClick = () => {
    if (chosenInput !== "monthlyPayment") {
      const monthlyPaymentValue = userInput.monthlyPayment !== "0" ? userInput.monthlyPayment : displayState.monthlyPayment;
      updateUserInput("monthlyPayment", monthlyPaymentValue);
    }
  };

  const updateIfChanged = (oldVal, newVal, name) => {
    var parsedNewVal = newVal.replace(/[^0-9.]+/g, "");
    if (oldVal !== parsedNewVal) {
      var noLeading0 = oldVal === "0" && isNumber(parsedNewVal) ? parseFloat(parsedNewVal).toString() : parsedNewVal;
      if (newVal.slice(-1) === "." && noLeading0.slice(-1) !== ".") {
        noLeading0 = `${noLeading0}.`;
      }
      updateUserInput(name, noLeading0);
    }
  };

  const additionalPayments =
    Number(displayState["propertyTax"]) > 0 ||
    Number(displayState["hoa"]) > 0 ||
    Number(displayState["insurance"]) > 0 ||
    Number(displayState["pmi"]) ||
    Number(displayState["maintenance"]) > 0 ||
    Number(displayState["utilities"]) > 0;

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="d-flex flex-column align-items-center mb-4">
            <h6 className="mb-3 text-center fw-normal text-muted">I want to start with:</h6>

            <div className="d-flex gap-0 shadow-sm" role="group" aria-label="Mortgage calculator mode" style={{ borderRadius: "12px" }}>
              <button
                type="button"
                className={`btn px-4 py-3 mode-toggle-btn ${chosenInput === "homeVal" ? "mode-toggle-active" : "mode-toggle-inactive"}`}
                onClick={handleHomeValClick}
                style={{
                  borderRadius: "12px 0 0 12px",
                  borderRight: chosenInput === "homeVal" ? "none" : "1px solid #0dcaf0",
                  transition: "all 0.2s ease",
                  minWidth: "160px",
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <div className="mb-1">
                    <span className="me-2" style={{ fontSize: "1.2em" }}>🏠</span>
                    <span className="fw-semibold">Home Price</span>
                  </div>
                  <small className={chosenInput === "homeVal" ? "text-white" : "text-body"} style={{ fontSize: "0.75rem" }}>
                    Enter the price of the home
                  </small>
                </div>
              </button>

              <button
                type="button"
                className={`btn px-4 py-3 mode-toggle-btn ${chosenInput === "monthlyPayment" ? "mode-toggle-active" : "mode-toggle-inactive"}`}
                onClick={handleMonthlyPaymentClick}
                style={{
                  borderRadius: "0 12px 12px 0",
                  borderLeft: chosenInput === "monthlyPayment" ? "none" : "1px solid #0dcaf0",
                  transition: "all 0.2s ease",
                  minWidth: "160px",
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <div className="mb-1">
                    <span className="me-2" style={{ fontSize: "1.2em" }}>💵</span>
                    <span className="fw-semibold">Monthly Budget</span>
                  </div>
                  <small className={chosenInput === "monthlyPayment" ? "text-white" : "text-body"} style={{ fontSize: "0.75rem" }}>
                    Enter how much you can pay each month
                  </small>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      {chosenInput && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-center">
              <div className="row shadow-sm border rounded py-3 px-4" style={{ backgroundColor: "white", maxWidth: "800px", width: "100%" }}>
                {chosenInput === "homeVal" ? (
                  <>
                    <div className="col-md-5 pe-md-2">
                      <label className="form-label mb-1">Home Value</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`form-control ${valid["homeVal"] !== null ? "is-invalid" : ""} ${flash["homeVal"] ? "anim1" : "anim2"} ${displayState["lock"]?.includes("homeVal") ? "lock lockBG" : ""}`}
                        value={cashFormat(displayState["homeVal"])}
                        onChange={(e) => updateIfChanged(displayState["homeVal"], e.target.value, "homeVal")}
                      />
                      {valid["homeVal"] !== null && (
                        <div className="invalid-feedback" style={{ display: "initial" }}>
                          {valid["homeVal"]}
                        </div>
                      )}
                    </div>
                    <div className="col-md-2 text-center align-self-center my-2 my-md-0">
                      <span style={{ fontSize: "1.5em" }}>→</span>
                    </div>
                    <div className="col-md-5 ps-md-2">
                      <label className="form-label mb-1">Monthly Payment</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`form-control ${flash["monthlyPayment"] ? "anim1" : "anim2"}`}
                        value={cashFormat(displayState["monthlyPayment"])}
                        readOnly
                        style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                      />
                      {additionalPayments && (
                        <label>
                          <small className="text-muted">{cashFormat(displayState["monthlyPaymentToLoan"])} towards loan</small>
                        </label>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-md-5 pe-md-2">
                      <label className="form-label mb-1">Monthly Payment</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`form-control ${valid["monthlyPayment"] !== null ? "is-invalid" : ""} ${flash["monthlyPayment"] ? "anim1" : "anim2"} ${displayState["lock"]?.includes("monthlyPayment") ? "lock lockBG" : ""}`}
                        value={cashFormat(displayState["monthlyPayment"])}
                        onChange={(e) => updateIfChanged(displayState["monthlyPayment"], e.target.value, "monthlyPayment")}
                      />
                      {valid["monthlyPayment"] !== null && (
                        <div className="invalid-feedback" style={{ display: "initial" }}>
                          {valid["monthlyPayment"]}
                        </div>
                      )}
                      {additionalPayments && (
                        <label>
                          <small className="text-muted">{cashFormat(displayState["monthlyPaymentToLoan"])} towards loan</small>
                        </label>
                      )}
                    </div>
                    <div className="col-md-2 text-center align-self-center my-2 my-md-0">
                      <span style={{ fontSize: "1.5em" }}>→</span>
                    </div>
                    <div className="col-md-5 ps-md-2">
                      <label className="form-label mb-1">Home Value</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`form-control ${flash["homeVal"] ? "anim1" : "anim2"}`}
                        value={cashFormat(displayState["homeVal"])}
                        readOnly
                        style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ModeToggle;

