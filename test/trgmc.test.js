import { expect, test } from "bun:test";
import { loanMaths } from "../src/loanMaths.js";
import { res1, res2, res3, res4, res5 , res6, res7} from "./exampleResults.js";
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
  appraisal: 410000
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
    o.appraisal
  );
}

function testScenario(name, stimulus, expectedResult) {
  test(name, () => {
    var measuredResult = runLoanMaths(stimulus);
    //USE THIS TO CREATE THE TEST PATTERNS
    if (name == "loanMaths: 3") {
      // writeFileSync("stimulus.json", JSON.stringify(stimulus, null, 2), "utf8");
      // writeFileSync("measuredResult.json", JSON.stringify(measuredResult, null, 2), "utf8");
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
//had trouble testing xlsx generation because the sheets contain formulas, which get corrupted in sheet read

