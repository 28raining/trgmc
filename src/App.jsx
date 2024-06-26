import { useState } from "react";
import "./App.css";
// import { PlusCircle } from "react-bootstrap-icons";
import LoanForm from "./LoanForm.jsx";
import { loanMaths, isNumber } from "./loanMaths.js";
// import  from "./loanMaths.js";
import LoanPlot from "./LoanPlot.jsx";
import LoanStats from "./LoanStats.jsx";
import EventsForm from "./EventsForm.jsx";
import { Comments } from "@hyvor/hyvor-talk-react";
import { BoxArrowUp, Trash, Bank, CCircle, Github } from "react-bootstrap-icons";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { Modal } from "react-bootstrap";

// import MonthlyPayment from "./MonthlyPayment.jsx";

function runCalculations(userInput, loanEvent, chosenInput, userSetDownPercent) {
  var monthlyExtraPercent = 0;
  var monthlyExtraFee = 0;
  var displayState = {};
  for (const x of [
    { num: userInput["propertyTax"], unit: userInput["propertyTaxUnit"] },
    { num: userInput["hoa"], unit: userInput["hoaUnit"] },
    { num: userInput["insurance"], unit: userInput["insuranceUnit"] },
  ]) {
    if (x.unit == 0) monthlyExtraFee = monthlyExtraFee + parseFloat(x.num) / 12;
    else if (x.unit == 1) monthlyExtraFee = monthlyExtraFee + parseFloat(x.num);
    else if (x.unit == 2) monthlyExtraPercent = monthlyExtraPercent + parseFloat(x.num) / 12;
    else if (x.unit == 3) monthlyExtraPercent = monthlyExtraPercent + parseFloat(x.num);
  }

  const loanAmount = userSetDownPercent
    ? userInput["homeVal"] * (1 - 0.01 * parseFloat(userInput["downPayPercent"]))
    : parseFloat(userInput["homeVal"]) - parseFloat(userInput["downPayCash"]);
  const downPay = userSetDownPercent ? parseFloat(userInput.downPayPercent) * 0.01 : parseFloat(userInput.downPayCash);

  // console.log("loanAmount_1", loanAmount)

  var loanRes = loanMaths(
    parseFloat(loanAmount),
    parseFloat(userInput["loanLength"]),
    parseFloat(userInput["interestRate"]),
    loanEvent,
    chosenInput,
    parseFloat(userInput["monthlyPayment"]),
    parseFloat(downPay),
    userSetDownPercent,
    parseFloat(monthlyExtraPercent),
    parseFloat(monthlyExtraFee),
    userInput["startDate"]
  );

  const homeVal = parseFloat(loanRes["homeVal"]);

  if (chosenInput == "monthlyPayment") {
    displayState["monthlyPayment"] = parseInt(userInput["monthlyPayment"]).toString();
  } else {
    displayState["monthlyPayment"] = parseInt(loanRes["monthlyPayment"][0]).toString();
  }
  displayState["monthlyPaymentToLoan"] = parseFloat(loanRes["monthlyInterest"][0]) + parseFloat(loanRes["monthlyPrincipal"][0]);
  // console.log("homeVal",homeVal)
  if (userSetDownPercent) {
    displayState["downPayPercent"] = userInput["downPayPercent"];
    displayState["downPayCash"] = homeVal * parseFloat(userInput["downPayPercent"]) * 0.01;
  } else {
    displayState["downPayPercent"] = ((100 * parseFloat(userInput.downPayCash)) / homeVal).toFixed(2);
    displayState["downPayCash"] = parseFloat(userInput.downPayCash);
  }

  if (chosenInput == "homeVal") {
    displayState["homeVal"] = userInput.homeVal;
  } else {
    displayState["homeVal"] = homeVal;
    // displayState["homeVal"] = parseFloat(loanRes["loanAmount"]) + parseFloat(userInput.downPayCash);
  }
  displayState["interestRate"] = userInput["interestRate"];
  displayState["loanLength"] = userInput["loanLength"];
  displayState["loanAmount"] = loanRes["loanAmount"];
  // console.log("loanAmount_2", loanRes["loanAmount"])

  displayState["propertyTax"] = userInput["propertyTax"];
  displayState["hoa"] = userInput["hoa"];
  displayState["insurance"] = userInput["insurance"];
  displayState["propertyTaxUnit"] = userInput["propertyTaxUnit"];
  displayState["hoaUnit"] = userInput["hoaUnit"];
  displayState["insuranceUnit"] = userInput["insuranceUnit"];
  displayState["startDate"] = userInput["startDate"];

  displayState["lock"] = [];
  displayState["lock"].push(chosenInput);

  return [displayState, loanRes];
}

function loanEventEncoder(loanEvent) {
  var str = `${loanEvent["event"]}_${loanEvent["date"].replace(" ", "")}_${loanEvent["cost"]}_${loanEvent["change"]}`;
  if ("newLength" in loanEvent) str += `_${loanEvent["newLength"]}`;
  return str;
}

function loanEventDecoder(e) {
  var newEvent = {};
  var items = e.split("_");
  newEvent["event"] = items[0];
  newEvent["date"] = `${items[1].substring(0, 3)} ${items[1].substring(3, 7)}`;
  newEvent["cost"] = parseInt(items[2]);
  newEvent["change"] = parseInt(items[3]);
  if (items.length > 4) newEvent["newLength"] = parseInt(items[4]);
  // console.log(newEvent, items);
  return newEvent;
}

var accurateDate = new Date();
// const dateLu = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
// var dStr = `${accurateDate.getFullYear()}-${dateLu[accurateDate.getMonth()]}-05`;
var dStr = `${accurateDate.getFullYear()}-01-05`; //Always defaultstarting at month 01 so graph looks symetrical
var coarseDate = Date.parse(dStr); //only care about month - don't want minor date changes going in URL
// console.log("coarseDate", dStr, coarseDate);
const initialState = {
  homeVal: "500000",
  monthlyPayment: "0",
  downPayCash: "0",
  downPayPercent: "20",
  interestRate: "5.00",
  loanLength: "30",
  propertyTax: "0.00",
  hoa: "0",
  insurance: "0",
  propertyTaxUnit: 2,
  hoaUnit: 1,
  insuranceUnit: 0,
  startDate: coarseDate,
};
const searchParams = new URLSearchParams(window.location.search);
const initialOverride = {};
var initialEvents = [];
for (const [key, value] of searchParams.entries()) {
  if (key == "events") initialEvents.push(loanEventDecoder(value));
  else initialOverride[key] = value;
}

// console.log(initialEvents)

function App() {
  const [loanEvent, setLoanEvent] = useState(initialEvents);
  const [chosenInput, setChosenInput] = useState("homeVal");
  const [userSetDownPercent, setUserSetDownPercent] = useState(true);

  const [userInput, setUserInput] = useState({ ...initialState, ...initialOverride });
  const [flash, setFlash] = useState({
    loanAmount: false,
    monthlyPayment: false,
    homeVal: false,
    downPayCash: false,
    downPayPercent: false,
    interestRate: false,
    loanLength: false,
    propertyTax: false,
    hoa: false,
    insurance: false,
  });
  const [valid, setValid] = useState({
    homeVal: null,
    monthlyPayment: null,
    downPayCash: null,
    downPayPercent: null,
    loanAmount: null,
    interestRate: null,
    loanLength: null,
    propertyTax: null,
    hoa: null,
    insurance: null,
  });
  var newDisplayState, newLoanRes;
  [newDisplayState, newLoanRes] = runCalculations(userInput, loanEvent, chosenInput, userSetDownPercent);
  const [displayState, setDisplayState] = useState(newDisplayState);
  const [loanRes, setLoanRes] = useState(newLoanRes);
  const [showShareModal, setShowShareModal] = useState(false);

  var newUserInput = { ...userInput };

  function updateUserInput(field, value) {
    var newFlash = { ...flash };
    var newChosenInput = chosenInput;
    var newValid = { ...valid };
    var newUserSetDownPercent = userSetDownPercent;
    var newDisplayState = { ...displayState };
    var newLoanEvent = loanEvent;

    // if (userSetDownPercent) {
    //   var downPayCash = (loanRes["loanAmount"] * userInput["downPayPercent"]) / 100;
    // } else {
    //   var downPayCash = parseFloat(userInput.downPayCash);
    // }

    newDisplayState[field] = value; //FIXME - can do the same thing with user input?

    if (field == "homeVal") {
      newChosenInput = "homeVal";
      // newFlash["loanAmount"] = !flash["loanAmount"];
      if (userSetDownPercent) newFlash["downPayCash"] = !flash["downPayCash"];
      else newFlash["downPayPercent"] = !flash["downPayPercent"];
      newUserInput.homeVal = value;
    } else if (field == "loanAmount") {
      newChosenInput = "homeVal";
      newUserInput.homeVal = userSetDownPercent
        ? parseFloat(value) / (1 - 0.01 * userInput["downPayPercent"])
        : parseFloat(value) + parseFloat(userInput["downPayCash"]);
      newFlash["homeVal"] = !flash["homeVal"];
      if (userSetDownPercent) newFlash["downPayCash"] = !flash["downPayCash"];
      else newFlash["downPayPercent"] = !flash["downPayPercent"];
    } else if (field == "monthlyPayment") {
      newChosenInput = "monthlyPayment";
      // newFlash["loanAmount"] = !flash["loanAmount"];
      if (userSetDownPercent) newFlash["downPayCash"] = !flash["downPayCash"];
      else newFlash["downPayPercent"] = !flash["downPayPercent"];
      newUserInput["monthlyPayment"] = value;
    } else if (field == "interestRate") {
      newUserInput.interestRate = value;
    } else if (field == "loanLength") {
      newUserInput.loanLength = value;
    } else if (field == "downPayCash") {
      newUserSetDownPercent = false;
      newUserInput.downPayCash = value;
      if (newChosenInput != "homeVal") newFlash["loanAmount"] = !flash["loanAmount"]; //stop it flashing
    } else if (field == "downPayPercent") {
      newUserSetDownPercent = true;
      newUserInput.downPayPercent = value;
      if (newChosenInput != "homeVal") newFlash["loanAmount"] = !flash["loanAmount"]; //stop it flashing

      // newFlash["loanAmount"] = !flash["loanAmount"];
    } else if (field == "insurance") {
      newUserInput.insurance = value;
      if (newChosenInput == "homeVal") newFlash["loanAmount"] = !newFlash["loanAmount"];
    } else if (field == "insuranceUnit") {
      newUserInput.insuranceUnit = value;
      if (newChosenInput == "homeVal") newFlash["loanAmount"] = !newFlash["loanAmount"];
    } else if (field == "hoa") {
      newUserInput.hoa = value;
      if (newChosenInput == "homeVal") newFlash["loanAmount"] = !newFlash["loanAmount"];
    } else if (field == "hoaUnit") {
      newUserInput.hoaUnit = value;
      if (newChosenInput == "homeVal") newFlash["loanAmount"] = !newFlash["loanAmount"];
    } else if (field == "propertyTax") {
      newUserInput.propertyTax = value;
      if (newChosenInput == "homeVal") newFlash["loanAmount"] = !newFlash["loanAmount"];
    } else if (field == "propertyTaxUnit") {
      newUserInput.propertyTaxUnit = value;
      if (newChosenInput == "homeVal") newFlash["loanAmount"] = !newFlash["loanAmount"];
    } else if (field == "startDate") {
      newUserInput.startDate = value;
    } else if (field == "reset") {
      newChosenInput = "homeVal";
      newUserInput = initialState;
      newUserSetDownPercent = true;
      newLoanEvent = [];
    }

    if (newChosenInput == "homeVal") {
      newFlash["monthlyPayment"] = !newFlash["monthlyPayment"];
      newFlash["loanAmount"] = !newFlash["loanAmount"];
    } else {
      newFlash["homeVal"] = !newFlash["homeVal"];
      newFlash["loanAmount"] = !newFlash["loanAmount"];
    }

    // console.log("newUserInput", newUserInput)
    for (const i in newUserInput) {
      newValid[i] = null;
      if (!isNumber(newUserInput[i])) {
        newValid[i] = "Must be a valid number";
      } else {
        var inputNumber = parseInt(newUserInput[i]);
        if (i == "homeVal" || i == "loanAmount" || i == "monthlyPayment") {
          if (inputNumber <= 0) {
            newValid[i] = "Must be a greater than 0";
          }
        }
        if (i == "homeVal" && !newUserSetDownPercent) {
          // var newDownPay = field == "downPayCash" ? newUserInput.downPayCash : downPayCash;
          if (inputNumber <= newUserInput.downPayCash) {
            newValid[i] = "Must be a greater than down payment";
          }
        }
        if (
          (i == "downPayPercent" && newUserSetDownPercent) ||
          (i == "insurance" && newUserInput.insuranceUnit > 1) ||
          (i == "hoa" && newUserInput.hoaUnit > 1) ||
          (i == "propertyTax" && newUserInput.propertyTaxUnit > 1)
        ) {
          // var newDownPay = field == "downPayCash" ? newUserInput.downPayCash : downPayCash;
          if (inputNumber > 100) {
            newValid[i] = "Must be <100%";
          }
        }
        if ((i == "propertyTax" || i == "hoa" || i == "insurance") && newChosenInput == "monthlyPayment") {
          // var newDownPay = field == "downPayCash" ? newUserInput.downPayCash : downPayCash;
          if (inputNumber > newUserInput.monthlyPayment) {
            newValid[i] = "Must be < than monthly payment";
          }
        }
      }
    }
    if (newChosenInput == "monthlyPayment") newValid["homeVal"] = null;
    else newValid["monthlyPayment"] = null;

    var allValid = true;
    for (const i in newValid) if (newValid[i] !== null) allValid = false;
    // console.log("valid", allValid, newValid);

    if (allValid) {
      var newLoanRes;
      [newDisplayState, newLoanRes] = runCalculations(newUserInput, newLoanEvent, newChosenInput, newUserSetDownPercent);
      setLoanRes(newLoanRes);
      setFlash(newFlash);
    }

    setDisplayState(newDisplayState);

    setUserInput(newUserInput);
    setChosenInput(newChosenInput);
    setUserSetDownPercent(newUserSetDownPercent);
    setValid(newValid);
    setLoanEvent(newLoanEvent);
  }

  function unitScaler(u) {
    return u == 0 ? 1 / 12 : u == 1 ? 1 : u == 2 ? (displayState["homeVal"] * 0.01) / 12 : u == 3 ? displayState["homeVal"] * 0.01 : 0;
  }

  // //Save any user inputs to the URL
  const urlParams = new URLSearchParams(window.location.search);

  for (const i in newUserInput) {
    if (newUserInput[i] != initialState[i]) {
      urlParams.set(i, newUserInput[i]);
    } else urlParams.delete(i);
  }
  urlParams.delete("events");
  if (loanEvent.length > 0) {
    for (const o in loanEvent) {
      urlParams.append("events", loanEventEncoder(loanEvent[o]));
    }
  }
  window.history.replaceState(null, null, "?" + urlParams.toString());

  return (
    <>
      <nav className="navbar bg-body-tertiary mb-3">
        <div className="container-xxl">
          <span className="navbar-brand titleSize">
            <Bank height="24" className="hideLogo me-2 align-text-bottom " />
            <span style={{ whiteSpace: "normal" }}>
              the <b>R</b>eally <b>G</b>ood <b>M</b>ortgage <b>C</b>alculator
            </span>
          </span>
          <span className="justify-content-end">
            <OverlayTrigger overlay={<Tooltip>{"share"}</Tooltip>} placement="bottom">
              <BoxArrowUp
                key="BoxArrowUp"
                onClick={() => {
                  setShowShareModal(true);
                  navigator.clipboard.writeText(window.location.href);
                }}
                className="me-2"
                style={{ cursor: "pointer" }}
                size={20}
              />
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip>{"reset"}</Tooltip>} placement="bottom">
              <Trash key="Trash" onClick={() => updateUserInput("reset")} style={{ cursor: "pointer" }} size={20} className="me-3" />
            </OverlayTrigger>
          </span>
        </div>

        <Modal show={showShareModal} onHide={() => setShowShareModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Shareable link copied to your clipboard</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <code>{window.location.href}</code>
          </Modal.Body>
        </Modal>
      </nav>
      <div className="container-xxl">
        <div className="row">
          <div className="col-12">
            <div className="row shadow-sm border rounded mx-0 mb-3">
              <div className="col">
                <p className="my-2">
                  An easy to use mortgage calculator to find out exactly how much it will cost to buy a house. Or, enter a monthly budget and see how much you
                  can afford
                </p>
                <p className="mb-2">This tool is unique because it supports unlimited overpayment, re-finance and recast events</p>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-5 col-12">
            <LoanForm displayState={displayState} valid={valid} flash={flash} updateUserInput={(f, v) => updateUserInput(f, v)} />
            <EventsForm
              loanMonths={loanRes["loanMonths"]}
              loanEvent={loanEvent}
              loanRes={loanRes}
              setLoanEvent={(e) => {
                setLoanEvent(e);
                var newDisplayState, newLoanRes;
                [newDisplayState, newLoanRes] = runCalculations(userInput, e, chosenInput, userSetDownPercent);
                setDisplayState(newDisplayState);
                setLoanRes(newLoanRes);
              }}
              monthlyPaymentPerEvent={loanRes["monthlyPaymentPerEvent"]}
            />

            <LoanStats loanRes={loanRes} userInput={userInput} />
          </div>
          <div className="col-md-7 col-12">
            <LoanPlot
              maxMonthly={Math.max(loanRes["monthlyPayment"])}
              loanRes={loanRes}
              loanMonths={loanRes["loanMonths"]}
              propertyTax={userInput["propertyTax"] * unitScaler(userInput["propertyTaxUnit"])}
              hoa={userInput["hoa"] * unitScaler(userInput["hoaUnit"])}
              insurance={userInput["insurance"] * unitScaler(userInput["insuranceUnit"])}
              startDate={new Date(Number(userInput["startDate"]))}
            />
          </div>
        </div>
      </div>
      <footer className="bg-body-tertiary mt-4">
        <div className="container-xxl">
          <div className="row pt-3">
            <p>It would be great to hear your feedback!</p>
          </div>
          <div className="row">
            <Comments website-id={11189} page-id="" />
          </div>
          <div className="row pt-3 px-3 ">
            <div className="col-6 text-start">
              <a href="https://github.com/28raining/trgmc" style={{ color: "black" }}>
                <Github className="me-2" />
                github pages
              </a>
            </div>
            <div className="col-6 pb-3 text-end">
              <a href="https://www.will-kelsey.com" style={{ color: "black" }}>
                <CCircle className="me-1" />
                Will Kelsey
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
