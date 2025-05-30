// const XLSX = require('xlsx');
// import { utils, writeFile } from "xlsx-js-style"; // Importing xlsx-style for styling support
// import * as XLSX from 'xlsx-js-style';

// uses sheetjs to create an xlsx file with the mortgage calculator data
// the spreadsheet contains formulas, so the user can change the values and see the results immediately
export async function createXlsx({
  XLSX,
  homeVal,
  downPayCash,
  loanMonths,
  interestRate,
  loanLength,
  propertyTax,
  hoa,
  pmi,
  utilities,
  insurance,
  overPayments,
  refinanceEvents,
}) {
  const utils = XLSX.utils;
  const writeFile = XLSX.writeFile;
  var col = "A";
  var row = 1;
  var maxCol = 0;
  var newCode;
  var r;
  const nextCol = () => {
    newCode = col.charCodeAt(0) + 1;
    col = String.fromCharCode(newCode);
    if (newCode > maxCol) {
      maxCol = newCode;
    }
  };
  const nextRow = () => {
    row += 1;
    col = "A";
  };
  const colOffset = (col, offset) => {
    newCode = col.charCodeAt(0) + offset;
    return String.fromCharCode(newCode);
  };

  var cellOverpayments,
    cellInterest,
    cellRemainingBalance,
    nextCellRemainingBalance,
    prevCellInterest,
    cellMonthlyPayment,
    prevCellMonthlyPayment,
    prevCellOverpayments;

  const ws = {};
  ws[`${col}${row}`] = {
    v: "TRGMC - User Inputs",
    s: {
      font: { bold: true, sz: 14 },
      fill: { fgColor: { rgb: "D9E1F2" } },
    },
  };
  nextRow();
  ws[`${col}${row}`] = { v: "House Value" };
  nextCol();
  nextCol();
  var cellHouseValue = `${col}${row}`;
  ws[cellHouseValue] = { f: homeVal };
  ws[`${col}${row}`].z = "$#,##0.00";
  nextRow();
  ws[`${col}${row}`] = { v: "Down Payment" };
  nextCol();
  nextCol();
  var cellDownPay = `${col}${row}`;

  ws[cellDownPay] = { f: `${downPayCash}` };
  ws[cellDownPay].z = "$#,##0.00";
  nextRow();
  ws[`${col}${row}`] = { v: "Interest Rate" };
  nextCol();
  nextCol();
  var cellInterestRate = `${col}${row}`;
  ws[cellInterestRate] = { f: `${interestRate / 100}` };
  ws[cellInterestRate].z = "0.00%";

  nextRow();
  ws[`${col}${row}`] = { v: "Loan Length (Y)" };
  nextCol();
  nextCol();
  var cellLoanLength = `${col}${row}`;
  ws[cellLoanLength] = { f: `${loanLength}` };
  nextRow();
  ws[`${col}${row}`] = {
    v: "TRGMC - Intermediate calculations",
    s: {
      font: { bold: true, sz: 14 },
      fill: { fgColor: { rgb: "D9E1F2" } },
    },
  };
  nextRow();
  ws[`${col}${row}`] = { v: "Loan Amount" };
  nextCol();
  nextCol();
  var cellLoanAmount = `${col}${row}`;
  ws[cellLoanAmount] = { f: `${cellHouseValue} - ${cellDownPay}` }; // Formula for Loan Amount
  ws[`${col}${row}`].z = "$#,##0.00";

  nextRow();
  ws[`${col}${row}`] = { v: "Monthly Interest" };
  nextCol();
  nextCol();
  var cellMonthlyInterestRate = `${col}${row}`;
  ws[cellMonthlyInterestRate] = { f: `${cellInterestRate} / 12` }; // Formula for Monthly Interest Rate
  ws[cellMonthlyInterestRate].z = "0.00%";
  nextRow();
  ws[`${col}${row}`] = { v: "# of Payments" };
  nextCol();
  nextCol();
  var cellLoanLengthMonths = `${col}${row}`;
  ws[cellLoanLengthMonths] = { f: `${cellLoanLength} * 12` }; // Formula for Number of Payments
  nextRow();
  ws[`${col}${row}`] = { v: "Monthly Pay" };
  nextCol();
  nextCol();
  var cellMonthlyPaymentInitial = `${col}${row}`;
  ws[cellMonthlyPaymentInitial] = { f: `PMT(${cellMonthlyInterestRate}, ${cellLoanLengthMonths}, -${cellLoanAmount})` }; // Formula for Monthly Payment
  ws[`${col}${row}`].z = "$#,##0.00";

  nextRow();
  ws[`${col}${row}`] = { v: "#" };
  nextCol();
  ws[`${col}${row}`] = { v: "Date" };
  nextCol();
  ws[`${col}${row}`] = { v: "Monthly Payment" };
  nextCol();
  ws[`${col}${row}`] = { v: "Loan" };
  nextCol();
  ws[`${col}${row}`] = { v: "Tax" };
  nextCol();
  ws[`${col}${row}`] = { v: "HOA" };
  nextCol();
  ws[`${col}${row}`] = { v: "PMI" };
  nextCol();
  ws[`${col}${row}`] = { v: "Utilities" };
  nextCol();
  ws[`${col}${row}`] = { v: "Insurance" };
  nextCol();
  ws[`${col}${row}`] = { v: "Remaining Balance" };
  nextCol();
  ws[`${col}${row}`] = { v: "Interest" };
  nextCol();
  ws[`${col}${row}`] = { v: "Overpayments" };
  nextCol();
  ws[`${col}${row}`] = { v: "Monthly Interest" };
  for (var i = 0; i < loanMonths.length; i++) {
    if (!loanMonths[i]) break; // If the month is not defined, break the loop (overpayments or some event has caused loan to finish early)
    nextRow();
    ws[`${col}${row}`] = { v: i }; // Row number
    nextCol();
    ws[`${col}${row}`] = { v: `${loanMonths[i]}` }; // Date formula
    nextCol();
    ws[`${col}${row}`] = { f: `SUM(${colOffset(col, 1)}${row}:${colOffset(col, 6)}${row})` }; // Monthly Payment formula
    ws[`${col}${row}`].z = "$#,##0.00";
    nextCol();
    cellMonthlyPayment = `${col}${row}`;
    prevCellMonthlyPayment = `${col}${row - 1}`;
    if (i == 0)
      ws[cellMonthlyPayment] = { f: `${cellMonthlyPaymentInitial}` }; // Loan payment formula
    else if (refinanceEvents[i] !== null)
      ws[cellMonthlyPayment] = { f: `PMT(${refinanceEvents[i].interestRate / 12}, ${refinanceEvents[i].newLength * 12}, -${nextCellRemainingBalance})` }; // Formula for Monthly Payment { v: `${refinanceEvents[i].interestRate/12}` };
    else ws[cellMonthlyPayment] = { f: `${col}${row - 1}` };
    ws[`${col}${row}`].z = "$#,##0.00";
    nextCol();
    ws[`${col}${row}`] = { f: `${propertyTax}` }; // Tax formula
    ws[`${col}${row}`].z = "$#,##0.00";
    nextCol();
    ws[`${col}${row}`] = { f: `${hoa}` }; // HOA formula
    ws[`${col}${row}`].z = "$#,##0.00";
    nextCol();
    ws[`${col}${row}`] = { f: `${pmi[i]}` }; // PMI formula
    ws[`${col}${row}`].z = "$#,##0.00";

    nextCol();
    ws[`${col}${row}`] = { f: `${utilities}` }; // Utilities formula
    ws[`${col}${row}`].z = "$#,##0.00";

    nextCol();
    ws[`${col}${row}`] = { f: `${insurance}` }; // Insurance formula
    ws[`${col}${row}`].z = "$#,##0.00";

    nextCol();
    prevCellOverpayments = `${colOffset(col, 2)}${row - 1}`;
    cellOverpayments = `${colOffset(col, 2)}${row}`;
    prevCellInterest = `${colOffset(col, 3)}${row - 1}`;
    cellInterest = `${colOffset(col, 3)}${row}`;
    cellRemainingBalance = `${col}${row}`;
    nextCellRemainingBalance = `${col}${row + 1}`;
    if (i == 0)
      ws[cellRemainingBalance] = { f: `${cellLoanAmount}` }; // Remaining balance
    else ws[cellRemainingBalance] = { f: `${col}${row - 1} * (1 + ${prevCellInterest}) - ${prevCellMonthlyPayment} - ${prevCellOverpayments}` }; // Remaining balance formula
    ws[cellRemainingBalance].z = "$#,##0.00";
    //an alternative formula for remaining balance could be (proposed by copilot)
    // if (i==0) ws[`${col}${row}`] = { f: `${cellLoanAmount}` }; // Remaining balance
    // else ws[`${col}${row}`] = { f: `${col}${row-1} - PPMT(${cellMonthlyInterestRate}/100, ${i}, ${cellLoanLengthMonths}, -${cellLoanAmount})` }; // Remaining balance formula

    nextCol();
    ws[`${col}${row}`] = { f: `${colOffset(col, -1)}${row} * ${cellInterest}` }; // Remaining balance
    ws[`${col}${row}`].z = "$#,##0.00";
    nextCol();
    ws[cellOverpayments] = { f: `${overPayments[i]}` }; // Date formula
    ws[cellOverpayments].z = "$#,##0.00";

    nextCol();

    if (i == 0)
      ws[cellInterest] = { f: `${cellMonthlyInterestRate}` }; // Remaining balance
    else if (refinanceEvents[i] !== null) ws[cellInterest] = { f: `${refinanceEvents[i].interestRate / 12}` };
    else ws[cellInterest] = { f: `${col}${row - 1}` }; // Remaining balance formula
    ws[cellInterest].z = "0.00%";
  }

  // Do all the styling
  ws["!ref"] = `A1:${String.fromCharCode(maxCol)}${row}`; // Sheet range
  //Make title nice & bold
  ws["!merges"] = ws["!merges"] || [];
  ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // merge Ar:Cr
  ws["!merges"].push({ s: { r: 5, c: 0 }, e: { r: 5, c: 3 } }); // merge Ar:Cr

  for (r = 1; r < 5; r++) {
    ws["!merges"].push({ s: { r: r, c: 0 }, e: { r: r, c: 1 } }); // merge Ar:Cr
  }
  for (r = 6; r < 10; r++) {
    ws["!merges"].push({ s: { r: r, c: 0 }, e: { r: r, c: 1 } }); // merge Ar:Cr
  }

  //workbook settings and download it
  ws["!cols"] = [
    { wch: 4 }, // Column A width (wch = "characters")
    { wch: 9 }, // Column B width
    { wch: 15 }, // Column B width
    { wch: 10 }, // Column B width
    { wch: 10 }, // Column B width
    { wch: 10 }, // Column B width
    { wch: 10 }, // Column B width
    { wch: 10 }, // Column B width
    { wch: 10 }, // Column B width
    { wch: 18 }, // Column B width Remaining Balance
    { wch: 12 }, // Column B width Remaining Balance
    { wch: 18 }, // Column B width Remaining Balance
    { wch: 18 }, // Column B width Remaining Balance
  ];

  const headerRow = 11;
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"].forEach((col) => {
    const cell = ws[`${col}${headerRow}`];
    if (cell) {
      cell.s = cell.s || {};
      cell.s.font = { bold: true };
      cell.s.alignment = { horizontal: "center" };
      cell.s.fill = { fgColor: { rgb: "FCE4D6" } };
      // Optionally add borders
      cell.s.border = {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } },
      };
    }
  });

  // Center align all values in the main data table
  for (let i = 12; i <= row; ++i) {
    ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"].forEach((col) => {
      const cell = ws[`${col}${i}`];
      if (cell) {
        cell.s = cell.s || {};
        cell.s.alignment = { horizontal: "center" };
      }
    });
  }

  // Make the cost columns a tan background
  for (let i = 12; i <= row; ++i) {
    ["D", "E", "F", "G", "H", "I"].forEach((col) => {
      const cell = ws[`${col}${i}`];
      if (cell) {
        cell.s = cell.s || {};
        cell.s.fill = { fgColor: { rgb: "EEECE1" } }; // Tan background
      }
    });
  }
  // Whenever there's a refinance event, highlight the row
  for (let i = 12; i <= row; ++i) {
    if (refinanceEvents[i - 12] !== null || overPayments[i - 12] > 0) {
      // Adjust index for the refinanceEvents array
      ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"].forEach((col) => {
        const cell = ws[`${col}${i}`];
        if (cell) {
          cell.s = cell.s || {};
          cell.s.fill = { fgColor: { rgb: "FFCCCC" } }; // Light red background for refinance events
        }
      });
    }
  }

  // console.log(ws, 'ws')
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Sheet1");
  //save the file as trgmc_date_time.xlsx
  const date = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const formattedDate =
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    "-" +
    pad(date.getMinutes()) +
    "-" +
    pad(date.getSeconds());
  writeFile(wb, `trgmc_${formattedDate}.xlsx`);
}
