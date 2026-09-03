import { expect, test } from "bun:test";
import { loanMaths } from "../src/loanMaths.js";
import { res1, res2, res3, res4, res5, res6, res7, res8 } from "./exampleResults.js";
import { xlsx_1 } from "./xlsxGenInput.js";
import { writeFileSync, unlinkSync } from "fs";
import { utils, writeFile, readFile } from "xlsx-js-style"; // Importing xlsx-style for styling support
import { createXlsx } from "../src/createXlsx.js";

//case 1 - the default site after clicking "populate with estimates"
var in_1 = {
  PMI: 0.015,
  PMI_fixed: 0,
  chosenInput: "homeVal",
  downPay: 0.1,
  interestRate: 5,
  loanAmount: 450000,
  loanEvent: [],
  monthlyExtraFee: 503.3333333333333,
  monthlyExtraPercent: 0.08333333333333333,
  monthlyPaymentInput: 0,
  numYears: 30,
  startDate: 1736035200000,
  userSetDownPercent: true,
};

//case 2 - PMI is in $/m instead of %/m
var in_2 = {
  PMI: 0,
  PMI_fixed: 233,
  chosenInput: "homeVal",
  downPay: 0.1,
  interestRate: 5,
  loanAmount: 450000,
  loanEvent: [],
  monthlyExtraFee: 0,
  monthlyExtraPercent: 0,
  monthlyPaymentInput: 0,
  numYears: 30,
  startDate: 1736035200000,
  userSetDownPercent: true,
};

//case 3 - Inflation @2% per year
var in_3 = {
  loanAmount: 400000,
  numYears: 30,
  interestRate: 5,
  loanEvent: [{ event: "Inflation", date: "Feb 2027", cost: 0, change: 2, newLength: "-", repeats: 6 }],
  chosenInput: "homeVal",
  monthlyPaymentInput: 0,
  downPay: 0.2,
  userSetDownPercent: true,
  monthlyExtraPercent: 0.08333333333333333,
  monthlyExtraFee: 503.3333333333333,
  startDate: 1736035200000,
  PMI: 0,
  PMI_fixed: 0,
};

//case 4 - Refinance makes the loan longer
var in_4 = {
  loanAmount: 400000,
  numYears: 30,
  interestRate: 5,
  loanEvent: [{ event: "Refinance", date: "Feb 2047", cost: 0, change: 2, newLength: 30, repeats: 0 }],
  chosenInput: "homeVal",
  monthlyPaymentInput: 0,
  downPay: 0.2,
  userSetDownPercent: true,
  monthlyExtraPercent: 0.08333333333333333,
  monthlyExtraFee: 503.3333333333333,
  startDate: 1736035200000,
  PMI: 0,
  PMI_fixed: 0,
};

//case 4 - Refinance makes the loan shorter
var in_5 = {
  loanAmount: 400000,
  numYears: 30,
  interestRate: 5,
  loanEvent: [{ event: "Refinance", date: "Feb 2047", cost: 0, change: 1, newLength: 2, repeats: 0 }],
  chosenInput: "homeVal",
  monthlyPaymentInput: 0,
  downPay: 0.2,
  userSetDownPercent: true,
  monthlyExtraPercent: 0.08333333333333333,
  monthlyExtraFee: 503.3333333333333,
  startDate: 1736035200000,
  PMI: 0,
  PMI_fixed: 0,
};

//case 5 - Add an initial expece
var in_6 = {
  loanAmount: 400000,
  numYears: 2,
  interestRate: 5,
  loanEvent: [{ event: "Expense", date: "Jan 2025", cost: 0, change: 3000, newLength: 0, repeats: 0 }],
  chosenInput: "homeVal",
  monthlyPaymentInput: 0,
  downPay: 0.2,
  userSetDownPercent: true,
  monthlyExtraPercent: 0.08333333333333333,
  monthlyExtraFee: 503.3333333333333,
  startDate: 1736035200000,
  PMI: 0,
  PMI_fixed: 0,
};

//case 7 - adding appraisal value
var in_7 = {
  PMI: 0,
  PMI_fixed: 200,
  chosenInput: "homeVal",
  downPay: 0.1,
  interestRate: 5,
  loanAmount: 450000,
  loanEvent: [],
  monthlyExtraFee: 0,
  monthlyExtraPercent: 0,
  monthlyPaymentInput: 0,
  numYears: 3,
  startDate: 1736035200000,
  userSetDownPercent: true,
  appraisal: 410000,
};

//case 8 - interest only
var in_8 = {
  PMI: 0,
  PMI_fixed: 0,
  chosenInput: "homeVal",
  downPay: 0.3,
  interestRate: 5,
  loanAmount: 450000,
  loanEvent: [],
  monthlyExtraFee: 0,
  monthlyExtraPercent: 0,
  monthlyPaymentInput: 0,
  numYears: 4,
  startDate: 1736035200000,
  userSetDownPercent: true,
  appraisal: null,
  interestOnly: true,
};

//convert from object input to ordered input
function runLoanMaths(o) {
  return loanMaths(
    o.loanAmount,
    o.numYears,
    o.interestRate,
    o.loanEvent,
    o.chosenInput,
    o.monthlyPaymentInput,
    o.downPay,
    o.userSetDownPercent,
    o.monthlyExtraPercent,
    o.monthlyExtraFee,
    o.startDate,
    o.PMI,
    o.PMI_fixed,
    o.appraisal,
    o.interestOnly,
    o.buydownOpts
  );
}

function testScenario(name, stimulus, expectedResult) {
  test(name, () => {
    var measuredResult = runLoanMaths(stimulus);
    //USE THIS TO CREATE THE TEST PATTERNS
    if (name == "loanMaths: 1") {
      // writeFileSync("stimulus.json", JSON.stringify(stimulus, null, 2), "utf8");
      writeFileSync("measuredResult.json", JSON.stringify(measuredResult, null, 2), "utf8");
    }
    expect(measuredResult.loanAmount).toEqual(expectedResult.loanAmount);
    expect(measuredResult.endMonth).toEqual(expectedResult.endMonth);
    expect(measuredResult.loanMonths).toEqual(expectedResult.loanMonths);
    expect(measuredResult.monthlyInterest).toEqual(expectedResult.monthlyInterest);
    expect(measuredResult.monthlyPayment).toEqual(expectedResult.monthlyPayment);
    expect(measuredResult.monthlyPrincipal).toEqual(expectedResult.monthlyPrincipal);
    expect(measuredResult.numMonths).toEqual(expectedResult.numMonths);
    expect(measuredResult.remaining).toEqual(expectedResult.remaining);
    expect(measuredResult.interestPlusPrincipal).toEqual(expectedResult.interestPlusPrincipal);
    expect(measuredResult.homeVal).toEqual(expectedResult.homeVal);
    expect(measuredResult.extraPayments).toEqual(expectedResult.extraPayments);
    expect(measuredResult.monthlyPaymentPerEvent).toEqual(expectedResult.monthlyPaymentPerEvent);
    expect(measuredResult.totalPrincipal).toEqual(expectedResult.totalPrincipal);
    expect(measuredResult.totalInterest).toEqual(expectedResult.totalInterest);
    expect(measuredResult.monthlyPMI).toEqual(expectedResult.monthlyPMI);
    expect(measuredResult.equity).toEqual(expectedResult.equity);
    if (name != "loanMaths: 1" && name != "loanMaths: 2") {
      expect(measuredResult.inflation).toEqual(expectedResult.inflation);
    }
    if (name != "loanMaths: 1" && name != "loanMaths: 2" && name != "loanMaths: 3" && name != "loanMaths: 4" && name != "loanMaths: 5") {
      expect(measuredResult.totalFees).toEqual(expectedResult.totalFees);
    }

    // expect(runLoanMaths(in_1)).toEqual(res1)
  });
}

//run the test scenarioes one by one
testScenario("loanMaths: 1", in_1, res1);
testScenario("loanMaths: 2", in_2, res2);
testScenario("loanMaths: 3", in_3, res3);
testScenario("loanMaths: 4", in_4, res4);
testScenario("loanMaths: 5", in_5, res5);
testScenario("loanMaths: 6", in_6, res6);
testScenario("loanMaths: 7", in_7, res7);
testScenario("loanMaths: 8", in_8, res8);

const buydownBase = {
  loanAmount: 400000,
  numYears: 30,
  interestRate: 6.5,
  loanEvent: [],
  chosenInput: "homeVal",
  monthlyPaymentInput: 0,
  downPay: 0,
  userSetDownPercent: false,
  monthlyExtraPercent: 0,
  monthlyExtraFee: 0,
  startDate: 1736035200000,
  PMI: 0,
  PMI_fixed: 0,
};

test("2-1 buydown matches golden PMT fixtures and does not change amortization", () => {
  const none = runLoanMaths(buydownBase);
  const with21 = runLoanMaths({ ...buydownBase, buydownOpts: { buydown: "2-1", buydownPayer: "seller" } });

  expect(with21.monthlyPayment[0]).toBeCloseTo(2026.74, 2);
  expect(with21.monthlyPayment[11]).toBeCloseTo(2026.74, 2);
  expect(with21.monthlyPayment[12]).toBeCloseTo(2271.16, 2);
  expect(with21.monthlyPayment[23]).toBeCloseTo(2271.16, 2);
  expect(with21.monthlyPayment[24]).toBeCloseTo(2528.27, 2);
  expect(with21.buydownInfo.tempCost).toBeCloseTo(9103.76, 2);
  expect(with21.remaining).toEqual(none.remaining);
  expect(with21.monthlyPrincipal).toEqual(none.monthlyPrincipal);
  expect(with21.monthlyInterest).toEqual(none.monthlyInterest);
  expect(with21.totalFees.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 5);
});

test("3-2-1 buydown matches golden PMT fixtures", () => {
  const with321 = runLoanMaths({ ...buydownBase, buydownOpts: { buydown: "3-2-1", buydownPayer: "seller" } });
  expect(with321.monthlyPayment[0]).toBeCloseTo(1796.18, 2);
  expect(with321.monthlyPayment[12]).toBeCloseTo(2026.74, 2);
  expect(with321.monthlyPayment[24]).toBeCloseTo(2271.16, 2);
  expect(with321.monthlyPayment[36]).toBeCloseTo(2528.27, 2);
  expect(with321.buydownInfo.tempCost).toBeCloseTo(17888.88, 2);
});

test("buyer-paid 2-1 adds escrow cost to fees; seller-paid does not", () => {
  const seller = runLoanMaths({ ...buydownBase, buydownOpts: { buydown: "2-1", buydownPayer: "seller" } });
  const buyer = runLoanMaths({ ...buydownBase, buydownOpts: { buydown: "2-1", buydownPayer: "buyer" } });
  expect(seller.totalFees.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 5);
  expect(buyer.totalFees[0]).toBeCloseTo(9103.76, 2);
});

test("permanent 1 point on $400k at 6.75% to 6.50%", () => {
  const none = runLoanMaths({ ...buydownBase, interestRate: 6.75 });
  const withPoints = runLoanMaths({
    ...buydownBase,
    interestRate: 6.75,
    buydownOpts: { buydown: "points", points: 1, rateCut: 0.25, buydownPayer: "seller" },
  });
  expect(withPoints.totalFees[0]).toBeCloseTo(4000, 5);
  expect(none.monthlyPayment[0]).toBeCloseTo(2594.39, 2);
  expect(withPoints.monthlyPayment[0]).toBeCloseTo(2528.27, 2);
  expect(withPoints.buydownInfo.monthlySavings).toBeCloseTo(66.12, 2);
  expect(withPoints.buydownInfo.breakEvenMonths).toBeCloseTo(60.5, 1);
  expect(withPoints.remaining).not.toEqual(none.remaining);
});

test("points from the form (string inputs) change P&I even when rate cut is omitted", () => {
  const none = runLoanMaths({ ...buydownBase, interestRate: 6.75 });
  const withStrings = runLoanMaths({
    ...buydownBase,
    interestRate: 6.75,
    buydownOpts: { buydown: "points", points: "1", rateCut: "0.25" },
  });
  const omittedCut = runLoanMaths({
    ...buydownBase,
    interestRate: 6.75,
    buydownOpts: { buydown: "points", points: "1" },
  });
  expect(withStrings.monthlyPayment[0]).toBeCloseTo(2528.27, 2);
  expect(omittedCut.monthlyPayment[0]).toBeCloseTo(2528.27, 2);
  expect(none.monthlyPayment[0]).toBeCloseTo(2594.39, 2);
});

test("refinance during year 1 ends the temporary subsidy", () => {
  const with21 = runLoanMaths({ ...buydownBase, buydownOpts: { buydown: "2-1", buydownPayer: "seller" } });
  const refiDate = with21.loanMonths[5];
  const withRefi = runLoanMaths({
    ...buydownBase,
    loanEvent: [{ event: "Refinance", date: refiDate, cost: 0, change: 6.5, newLength: 30, repeats: 0 }],
    buydownOpts: { buydown: "2-1", buydownPayer: "seller" },
  });
  expect(withRefi.monthlyPayment[0]).toBeCloseTo(2026.74, 2);
  expect(withRefi.buydownSubsidy[4]).toBeGreaterThan(1);
  expect(withRefi.buydownSubsidy[5]).toBeCloseTo(0, 5);
  expect(withRefi.monthlyPayment[5]).toBeCloseTo(withRefi.monthlyInterest[5] + withRefi.monthlyPrincipal[5], 2);
});

test("points and a temporary 2-1 are exclusive", () => {
  const with21 = runLoanMaths({
    ...buydownBase,
    buydownOpts: { buydown: "2-1", points: 1, rateCut: 0.25, buydownPayer: "seller" },
  });
  expect(with21.totalFees[0] || 0).toBeCloseTo(0, 5);
  expect(with21.monthlyPayment[0]).toBeCloseTo(2026.74, 2);
  expect(with21.buydownInfo.pointsCost).toBeCloseTo(0, 5);

  const withPoints = runLoanMaths({
    ...buydownBase,
    interestRate: 6.75,
    buydownOpts: { buydown: "points", points: 1, rateCut: 0.25 },
  });
  expect(withPoints.monthlyPayment[0]).toBeCloseTo(2528.27, 2);
  expect(withPoints.buydownInfo.structure).toBe("");
});
//had trouble testing xlsx generation because the sheets contain formulas, which get corrupted in sheet read
