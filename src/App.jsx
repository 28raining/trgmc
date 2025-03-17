import { useState } from "react";
import LoanForm from "./LoanForm.jsx";
import { loanMaths, isNumber } from "./loanMaths.js";
import LoanPlot from "./LoanPlot.jsx";
import LoanStats from "./LoanStats.jsx";
import EventsForm from "./EventsForm.jsx";
import { Comments } from "@hyvor/hyvor-talk-react";
import { BoxArrowUp, Trash, Bank, CCircle, Github } from "react-bootstrap-icons";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Accordion from "react-bootstrap/Accordion";
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
    { num: userInput["utilities"], unit: userInput["utilitiesUnit"] },
    { num: userInput["insurance"], unit: userInput["insuranceUnit"] },
  ]) {
    if (x.unit == 0) monthlyExtraFee = monthlyExtraFee + parseFloat(x.num) / 12;
    else if (x.unit == 1) monthlyExtraFee = monthlyExtraFee + parseFloat(x.num);
    else if (x.unit == 2) monthlyExtraPercent = monthlyExtraPercent + parseFloat(x.num) / 12;
    else if (x.unit == 3) monthlyExtraPercent = monthlyExtraPercent + parseFloat(x.num);
  }
  var PMI_percent = 0;
  var PMI_fixed = 0;
  for (const x of [{ num: userInput["pmi"], unit: userInput["pmiUnit"] }]) {
    if (x.unit == 0) {
      PMI_fixed = parseFloat(x.num) / 12;
    } else if (x.unit == 1) {
      PMI_fixed = parseFloat(x.num);
    } else if (x.unit == 4) {
      PMI_percent = parseFloat(x.num) / 100;
    } else if (x.unit == 5) {
      PMI_percent = (parseFloat(x.num) * 12) / 100;
    }
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
    userInput["startDate"],
    PMI_percent,
    PMI_fixed
  );

  const homeVal = parseFloat(loanRes["homeVal"]);

  if (chosenInput == "monthlyPayment") {
    displayState["monthlyPayment"] = Math.round(userInput["monthlyPayment"]).toString();
  } else {
    displayState["monthlyPayment"] = Math.round(loanRes["monthlyPayment"][0]).toString();
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
  displayState["pmi"] = userInput["pmi"];
  displayState["utilities"] = userInput["utilities"];
  displayState["insurance"] = userInput["insurance"];
  displayState["propertyTaxUnit"] = userInput["propertyTaxUnit"];
  displayState["hoaUnit"] = userInput["hoaUnit"];
  displayState["pmiUnit"] = userInput["pmiUnit"];
  displayState["utilitiesUnit"] = userInput["utilitiesUnit"];
  displayState["insuranceUnit"] = userInput["insuranceUnit"];
  displayState["startDate"] = userInput["startDate"];

  displayState["lock"] = [];
  displayState["lock"].push(chosenInput);
  if (userSetDownPercent) displayState["lock"].push("downPayPercent");
  else displayState["lock"].push("downPayCash");

  return [displayState, loanRes];
}

function loanEventEncoder(loanEvent) {
  var str = `${loanEvent["event"]}_${loanEvent["date"].replace(" ", "")}_${loanEvent["cost"]}_${loanEvent["change"]}_${loanEvent["newLength"]}_${loanEvent["repeats"]}`;
  // if ("newLength" in loanEvent) str += `_${loanEvent["newLength"]}`;
  // console.log(str, loanEvent)
  return str;
}

function loanEventDecoder(e, initialEvents) {
  try {
    var newEvent = {};
    var items = e.split("_");
    newEvent["event"] = items[0];
    newEvent["date"] = `${items[1].substring(0, 3)} ${items[1].substring(3, 7)}`;
    newEvent["cost"] = parseInt(items[2]);
    if (items[3] == "-") newEvent["change"] = "-";
    else newEvent["change"] = parseInt(items[3]);
    if (items[4] == "-") newEvent["newLength"] = "-";
    else newEvent["newLength"] = parseInt(items[4]);
    if (items[5] == "-") newEvent["repeats"] = "-";
    else newEvent["repeats"] = parseInt(items[5]);
    // console.log(newEvent, items);
    initialEvents.push(newEvent);
    return initialEvents;
  } catch (error) {
    console.log("error decoding the url", error);
  }
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
  pmi: "0",
  utilities: "0",
  insurance: "0",
  propertyTaxUnit: 2,
  hoaUnit: 1,
  pmiUnit: 4,
  utilitiesUnit: 1,
  insuranceUnit: 0,
  startDate: coarseDate,
};
const searchParams = new URLSearchParams(window.location.search);
const initialOverride = {};
var initialEvents = [];
for (const [key, value] of searchParams.entries()) {
  if (key == "events") initialEvents = loanEventDecoder(value, initialEvents);
  else initialOverride[key] = value;
}
var initialUserSetDownPercent = true;
if (searchParams.has("downPayCash")) initialUserSetDownPercent = false;

// console.log(initialEvents)

function App() {
  const [loanEvent, setLoanEvent] = useState(initialEvents);
  const [chosenInput, setChosenInput] = useState("homeVal");
  const [userSetDownPercent, setUserSetDownPercent] = useState(initialUserSetDownPercent);

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
    pmi: false,
    utilities: false,
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
    pmi: null,
    utilities: null,
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
      if (isNumber(value)) if (parseFloat(value) > 250) newUserInput.loanLength = 250;
    } else if (field == "downPayCash") {
      newUserSetDownPercent = false;
      newUserInput.downPayCash = value;
      newUserInput.downPayPercent = initialState.downPayPercent;
      if (newChosenInput != "homeVal") newFlash["loanAmount"] = !flash["loanAmount"]; //stop it flashing
    } else if (field == "downPayPercent") {
      newUserSetDownPercent = true;
      newUserInput.downPayPercent = value;
      newUserInput.downPayCash = initialState.downPayCash;
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
    } else if (field == "pmi") {
      newUserInput.pmi = value;
      if (newChosenInput == "homeVal") newFlash["loanAmount"] = !newFlash["loanAmount"];
    } else if (field == "pmiUnit") {
      newUserInput.pmiUnit = value;
    } else if (field == "utilities") {
      newUserInput.utilities = value;
      if (newChosenInput == "homeVal") newFlash["loanAmount"] = !newFlash["loanAmount"];
    } else if (field == "utilitiesUnit") {
      newUserInput.utilitiesUnit = value;
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
        var inputNumber = parseFloat(newUserInput[i]);
        if (i == "homeVal" || i == "loanAmount" || i == "monthlyPayment") {
          if (inputNumber <= 0) {
            newValid[i] = "Must be a greater than 0";
          }
        }
        if (i == "loanLength") {
          if (inputNumber >= 250) {
            newValid[i] = "Must be less than 250";
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
          (i == "pmi" && newUserInput.pmiUnit > 1) ||
          (i == "utilities" && newUserInput.utilitiesUnit > 1) ||
          (i == "propertyTax" && newUserInput.propertyTaxUnit > 1)
        ) {
          // var newDownPay = field == "downPayCash" ? newUserInput.downPayCash : downPayCash;
          if (inputNumber > 100) {
            newValid[i] = "Must be <100%";
          }
        }
        if ((i == "propertyTax" || i == "hoa" || i == "pmi" || i == "utilities" || i == "insurance") && newChosenInput == "monthlyPayment") {
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

    //check if PMI is valid (has to go post-math)
    if (parseFloat(newDisplayState["downPayPercent"]) >= 20 && parseFloat(newDisplayState["pmi"]) > 0) {
      newValid["pmi"] = "PMI is required while the loan amount is greater than 80% of the property value. Reduce down payment?";
    }

    setDisplayState(newDisplayState);

    setUserInput(newUserInput);
    setChosenInput(newChosenInput);
    setUserSetDownPercent(newUserSetDownPercent);
    setValid(newValid);
    setLoanEvent(newLoanEvent);
  }

  function unitScaler(u) {
    return u == 0
      ? 1 / 12
      : u == 1
        ? 1
        : u == 2
          ? (displayState["homeVal"] * 0.01) / 12
          : u == 3
            ? displayState["homeVal"] * 0.01
            : u == 4
              ? (displayState["loanAmount"] * 0.01) / 12
              : u == 5
                ? displayState["loanAmount"] * 0.01
                : 0.0;
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
            <span className="me-3 align-middle" style={{ fontSize: "16px" }}>
              🇺🇸
            </span>
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
          <div className="col-lg-7 col-12 mb-3">
            <LoanForm displayState={displayState} valid={valid} flash={flash} updateUserInput={(f, v) => updateUserInput(f, v)} />
          </div>
          <div className="col-lg-5 col-12">
            <div className="row">
              <div className="col-12 mb-3">
                <LoanStats loanRes={loanRes} userInput={userInput} />
              </div>
              <div className="col-12 mb-3">
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
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <LoanPlot
              maxMonthly={Math.max(loanRes["monthlyPayment"])}
              loanRes={loanRes}
              loanMonths={loanRes["loanMonths"]}
              propertyTax={userInput["propertyTax"] * unitScaler(userInput["propertyTaxUnit"])}
              hoa={userInput["hoa"] * unitScaler(userInput["hoaUnit"])}
              pmi={userInput["pmi"] * unitScaler(userInput["pmiUnit"])}
              utilities={userInput["utilities"] * unitScaler(userInput["utilitiesUnit"])}
              insurance={userInput["insurance"] * unitScaler(userInput["insuranceUnit"])}
              startDate={new Date(Number(userInput["startDate"]))}
              inflation={loanRes["inflation"]}
            />
          </div>
        </div>
        <div className="row shadow-sm border rounded my-3 mx-0 text-secondary">
          <div className="col-12">
            <Accordion flush>
              <Accordion.Item eventKey="0">
                <Accordion.Header>Click to see notes on PMI...</Accordion.Header>
                <Accordion.Body>
                  <p>
                    PMI payments will vary depending how the compny implements it. Some companies adjust PMI payments once per year, others adjust it monthly.
                    Some companies will keep monthly payments fixed (mortgage + pmi), some will add pmi on top (payment changes every month)
                  </p>
                  <p>
                    This tool assumes that the PMI payment reduces every month, that monthly payments are fixed, and that PMI payments stop when the loan
                    balance falls below 80% of home value
                  </p>
                  <p>
                    Why does adding PMI change the amount of interest being paid? PMI is the same as increasing the interest rate. Higher interest rate means
                    more of the monthly payment goes to interest, and therefore less goes to principal. The next month has larger remaining balance, then more
                    interest is charged. It is not intuitive!
                  </p>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>
        </div>
      </div>
      <footer className="bg-body-tertiary mt-5">
        <div className="container-xxl">
          <div className="row pt-5 pb-3">
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
