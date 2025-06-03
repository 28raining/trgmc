import { useState } from "react";
import { DashCircle, Pen } from "react-bootstrap-icons";
// import Modal from "react-bootstrap/Modal";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import { cashFormat } from "./loanMaths.js";
import { isNumber } from "./loanMaths.js";

function EventsForm({ loanMonths, loanRes, loanEvent, setLoanEvent, monthlyPaymentPerEvent }) {
  const [chosenEvent, setChosenEvent] = useState("Over-pay");
  const [newChange, setNewChange] = useState(1000);
  const [chosenDate, setChosenDate] = useState(loanMonths[1]);
  const [repeats, setRepeats] = useState(0);
  const [newLength, setNewLength] = useState(0);
  const [cost, setCost] = useState(0);

  const [showEventToast, setShowEventToast] = useState(false);

  var timeSaved = loanRes["numMonths"] - loanRes["endMonth"];
  var yearsSaved = Math.floor(timeSaved / 12);
  var monthSaved = timeSaved % 12;

  var showTimeReduced = false;
  for (var i = 0; i < loanEvent.length; i++) {
    if (loanEvent[i]["event"] == "Over-pay") showTimeReduced = true;
  }

  var interestSaved = loanRes["interestPlusPrincipal"] - loanRes["totalPrincipal"] - loanRes["totalInterest"] - loanRes["extraPayments"];

  //prevent hanging when url params set up illegal state
  if (loanMonths.length < 2) return null;
  if (monthlyPaymentPerEvent.length < 0) return null;

  const eventList = ["Over-pay", "Recast", "Refinance", "Inflation"];
  const description = {
    "Over-pay": "Pay extra money into the loan",
    Recast: "Reduce the monthly payments after over-paying",
    Refinance: "Change the interest rate",
    Inflation: "Increase Tax, HoA, Insurance & Utilities",
  };

  const repeatOptions = ["doesn't repeat", "weekly", "bi-weekly", "monthly", "bi-monthly", "every 6 months", "annually", "bi-annually"];

  function dateIsOlder(a, b) {
    return loanMonths.indexOf(a) > loanMonths.indexOf(b);
  }

  function sortEvents(a, b) {
    return loanMonths.indexOf(a["date"]) - loanMonths.indexOf(b["date"]);
  }

  function validRecastDate() {
    if (chosenEvent == "Recast") {
      var overPayFirst = false;
      for (const e of loanEvent) {
        if (dateIsOlder(e["date"], chosenDate)) {
          break;
        } else if (e["event"] == "Over-pay") {
          overPayFirst = true;
          break;
        }
      }
      return overPayFirst;
    } else {
      return true;
    }
  }

  function noOtherEvents() {
    if (chosenEvent != "Refinance") return true;
    for (const e of loanEvent) {
      if (e["date"] == chosenDate) return false;
    }
    return true;
  }

  const indexOfChosenDate = loanMonths.indexOf(chosenDate);

  if (indexOfChosenDate < 0) setChosenDate(loanMonths[1]);
  const remainingBalance = loanRes["remaining"][indexOfChosenDate];
  const OverPayNotTooMuch = parseFloat(newChange) < parseFloat(remainingBalance);
  const validDate = indexOfChosenDate >= 0;
  const validRecast = validRecastDate();
  const validOverpay = chosenEvent != "Over-pay" || (newChange > 0 && OverPayNotTooMuch);
  const canRefi = noOtherEvents();
  const canAdd = validDate & validRecast & validOverpay & canRefi;
  const canAddText = "Correct the form";
  const overPayText = !isNumber(newChange) || newChange == 0 ? "Overpay must be > 0" : "Overpay must be less than remaining balance";

  function addEvent() {
    var newEvent = {};
    newEvent["event"] = chosenEvent;
    newEvent["date"] = chosenDate;
    if (isNumber(cost)) newEvent["cost"] = parseFloat(cost);
    else newEvent["cost"] = 0;

    if (chosenEvent == "Recast") newEvent["change"] = "-";
    else newEvent["change"] = newChange;

    if (chosenEvent == "Over-pay" || chosenEvent == "Inflation") newEvent["repeats"] = repeats;
    else newEvent["repeats"] = "-";

    if (chosenEvent == "Refinance") newEvent["newLength"] = newLength;
    else newEvent["newLength"] = "-";

    var newEventObj = [...loanEvent];
    newEventObj.push(newEvent);
    newEventObj.sort(sortEvents);
    setLoanEvent(newEventObj);

    var newDate = indexOfChosenDate + 1;
    setChosenDate(loanMonths[newDate]);
    setShowEventToast(true);
  }

  return (
    <div className="row shadow-sm border rounded py-2 mx-0" key="row0" style={{ backgroundColor: "white" }}>
      <ToastContainer position="top-end" className="pt-4">
        <Toast show={showEventToast} onClose={() => setShowEventToast(false)} delay={3000} autohide bg="info">
          <Toast.Header>
            <strong className="me-auto">Event added</strong>
          </Toast.Header>
          <Toast.Body>You just added an event, check the table</Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="col-12" key="col0">
        <div className="row">
          <div className="col-12" key="col1">
            <div className="input-group ">
              {eventList.map((x, i) => (
                <OverlayTrigger overlay={<Tooltip key={`evDescTool_${i}`}>{description[x]}</Tooltip>} key={`evDesc_${i}`}>
                  <div className="form-check form-check-inline" key={x}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="chooseEvent"
                      checked={chosenEvent == x}
                      value={x}
                      onChange={(e) => {
                        if (e.target.value == "Refinance") setNewChange("5.00");
                        if (e.target.value == "Inflation") setNewChange("1.00");
                        if (e.target.value == "Inflation") setRepeats(6);
                        setChosenEvent(e.target.value);
                      }}
                    />
                    <label className="form-check-label">{x}</label>
                  </div>
                </OverlayTrigger>
              ))}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-4 col-6">
            <label>Date:</label>
            <select className="form-select mb-1" onChange={(e) => setChosenDate(e.target.value)} value={chosenDate}>
              {loanMonths.map((x) => (
                <option value={x} key={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="col-xl-3 col-6" key="col2">
            {chosenEvent == "Recast" ? null : (
              <>
                <label>{chosenEvent == "Over-pay" ? "Amount" : chosenEvent == "Inflation" ? "Increase " : "New rate"}</label>
                <div className="input-group ">
                  <input
                    type="text"
                    className="form-control px-1"
                    value={
                      chosenEvent == "Over-pay"
                        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(
                            newChange
                          )
                        : newChange
                    }
                    onChange={(e) => {
                      var stripped = e.target.value.replace(/[^0-9.-]+/g, "");
                      // console.log(stripped, e.target.value);
                      setNewChange(stripped);
                    }}
                  />
                  {chosenEvent == "Over-pay" ? null : <span className="input-group-text">%</span>}
                </div>
              </>
            )}
          </div>

          {chosenEvent == "Inflation" ? null : (
            <div className="col-xl-3 col-6">
              <label>Cost</label>
              <div className="input-group ">
                <input
                  type="text"
                  className="form-control"
                  value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(
                    cost
                  )}
                  onChange={(e) => {
                    setCost(e.target.value.replace(/[^0-9.-]+/g, ""));
                  }}
                />
              </div>
            </div>
          )}

          <div className="col-xl-2 col-6">
            <label></label>
            {canAdd ? (
              <div className="d-grid gap-2">
                <button type="button" className="btn btn-outline-success" disabled={!canAdd} onClick={addEvent} style={canAdd ? {} : { pointerEvents: "none" }}>
                  Add
                </button>
              </div>
            ) : (
              <OverlayTrigger
                key="AddHelper"
                overlay={
                  <Tooltip id="allowAdd" key={`AddHelperTt`}>
                    {canAddText}
                  </Tooltip>
                }
              >
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-success"
                    disabled={!canAdd}
                    onClick={addEvent}
                    style={canAdd ? {} : { pointerEvents: "none" }}
                  >
                    Add
                  </button>
                </div>
              </OverlayTrigger>
            )}
          </div>
        </div>

        {chosenEvent == "Refinance" ? (
          // <div className="row pb-2" key="row1a">
          <div className="row">
            <div className="col-xl-7 col-12">
              <label>New Loan Length:</label>
              <div className="input-group mb-1">
                <input
                  className="form-control"
                  placeholder="unchanged..."
                  value={newLength == 0 ? "" : newLength}
                  onChange={(e) => setNewLength(Number(e.target.value.replace(/[^0-9.-]+/g, "")))}
                />
                <span className="input-group-text">years</span>
              </div>
            </div>
          </div>
        ) : chosenEvent == "Over-pay" || chosenEvent == "Inflation" ? (
          <div className="row">
            <div className="col">
              <label>{chosenEvent == "Inflation" ? "Repeats? (typically annually)" : "Repeating Payment?"}</label>
              <select className="form-select mb-1" onChange={(e) => setRepeats(e.target.value)} value={repeats}>
                {repeatOptions.map((x, i) =>
                  chosenEvent == "Inflation" && (i == 1 || i == 2) ? null : (
                    <option value={i} key={i}>
                      {x}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        ) : null}

        {canAdd ? null : (
          <div className="row pt-2">
            <div className="col-12">
              {!validDate ? (
                <div className="invalid-feedback" style={{ display: "initial" }}>
                  Date invalid
                </div>
              ) : !validRecast ? (
                <div className="invalid-feedback" style={{ display: "initial" }}>
                  Recast only possible after overpay
                </div>
              ) : !canRefi ? (
                <div className="invalid-feedback" style={{ display: "initial" }}>
                  Cannot refinance on same date as other event
                </div>
              ) : !validOverpay ? (
                <div className="invalid-feedback" style={{ display: "initial" }}>
                  {overPayText}
                </div>
              ) : null}
            </div>
          </div>
        )}
        <div className="row pt-2">
          <div className="col-12">
            <div className="px-2 py-1 mb-1 bg-info-subtle card">
              <span>
                {chosenDate} remaining balance = <b>{cashFormat(remainingBalance)}</b>
              </span>
            </div>
          </div>
        </div>

        <div className="row" key="row3">
          <div className="col-12">
            {loanEvent.length == 0 ? null : (
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Event</th>
                    <th scope="col">Date</th>
                    <th scope="col">Cost</th>
                    <th scope="col">Change</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                {loanEvent.map(
                  (x, i) =>
                    loanMonths.includes(x.date) && (
                      <tbody key={i}>
                        <tr key={i}>
                          <th scope="row">{i + 1}</th>
                          <td>{x["event"]}</td>
                          <td>{x["date"]}</td>
                          <td>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              maximumFractionDigits: 0,
                            }).format(x["cost"])}
                          </td>
                          <td>{x["event"] == "Refinance" ? `${x["change"]}%` : x["event"] == "Over-pay" ? cashFormat(x["change"]) : x["change"]}</td>
                          <td key="pen">
                            <span
                              style={{ cursor: "pointer" }}
                              className="mx-1"
                              onClick={() => {
                                var newEventObj = [...loanEvent];
                                var oldEvent = newEventObj.splice(i, 1);
                                // console.log(oldEvent)
                                setChosenEvent(oldEvent[0]["event"]);
                                setChosenDate(oldEvent[0]["date"]);
                                setCost(oldEvent[0]["cost"]);
                                setNewChange(oldEvent[0]["change"]);
                                setRepeats(oldEvent[0]["repeats"]);
                                setLoanEvent(newEventObj);
                                setNewLength(oldEvent[0]["newLength"] == "-" ? 0 : oldEvent[0]["newLength"]);
                              }}
                            >
                              <OverlayTrigger key={`overlay_edit_${i}`} overlay={<Tooltip key={`overlay_edit_tt_${i}`}>{"Edit"}</Tooltip>}>
                                <Pen color="blue" size={16} key="iconPen" />
                              </OverlayTrigger>
                            </span>

                            <span
                              style={{ cursor: "pointer" }}
                              className="mx-1"
                              onClick={() => {
                                var newEventObj = [...loanEvent];
                                newEventObj.splice(i, 1);
                                setLoanEvent(newEventObj);
                              }}
                            >
                              <OverlayTrigger key={`overlay_rm_${i}`} overlay={<Tooltip key={`overlay_rm_tt_${i}`}>{"Remove"}</Tooltip>}>
                                <DashCircle color="blue" size={16} key="iconCircle" />
                              </OverlayTrigger>
                            </span>
                          </td>
                        </tr>
                        {x["event"] == "Refinance" ? (
                          <tr key={"refi1"}>
                            <td></td>
                            <td colSpan={5} className="py-1">
                              New loan length: {x["newLength"] == "" ? <em>unchanged</em> : `${x["newLength"]}yr`}
                            </td>
                          </tr>
                        ) : x["event"] == "Over-pay" && x["repeats"] != 0 ? (
                          <tr key={"overpayRep"}>
                            <td></td>
                            <td colSpan={5} className="py-1">
                              Payment repeats: {repeatOptions[x["repeats"]]}
                            </td>
                          </tr>
                        ) : null}
                        {x["event"] == "Refinance" || x["event"] == "Recast" ? (
                          <tr key={"refi2"}>
                            <td></td>
                            <td colSpan={5} className="py-1">
                              New monthly payment: {cashFormat(monthlyPaymentPerEvent[i + 1]["loan"] + monthlyPaymentPerEvent[i + 1]["extra"])}{" "}
                              {monthlyPaymentPerEvent[i + 1]["extra"] > 0 ? (
                                <small>
                                  <em>({cashFormat(monthlyPaymentPerEvent[i + 1]["loan"])} towards loan)</em>
                                </small>
                              ) : null}
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    )
                )}
              </table>
            )}
          </div>
        </div>
        <div className="row">
          {!showTimeReduced ? null : (
            <div>
              <div className="row">
                <div className="input-group">
                  <span className="input-group-text outputLabelWidth maxW">Interest payments saved</span>
                  <output type="text" className="form-control bg-warning-subtle">
                    {cashFormat(interestSaved)}
                  </output>
                </div>
              </div>
              <div className="row pt-2">
                <div className="input-group">
                  <span className="input-group-text outputLabelWidth maxW">Time reduced due to overpayments</span>
                  <output type="text" className="form-control bg-warning-subtle">
                    {`${yearsSaved}yr ${monthSaved}m`}
                  </output>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventsForm;
