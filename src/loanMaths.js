//determines if a string is a number
export function isNumber(num) {
  if (num === "") return false;
  return !isNaN(num);
}

//converts float / int to nicely formatted currency
export function cashFormat(val) {
  if (val === "") return "";
  if (!isNumber(val)) return "";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    minimumIntegerDigits: val.length,
  }).format(val);
}

function loanCalc(
  numMonths,
  interestRate,
  loanAmount,
  chosenInput,
  monthlyPaymentInput,
  downPay,
  userSetDownPercent,
  monthlyExtraPercent,
  monthlyExtraFee,
  PMI,
  PMI_fixed,
  interestOnly
) {
  // console.log('loanCalc', numMonths, interestRate, loanAmount, chosenInput, monthlyPaymentInput, downPayCash, monthlyExtraPercent, monthlyExtraFee)
  // console.log("chosenInput", chosenInput)
  var newInterest = interestRate * 0.01 + PMI;
  var monthlyInterest = 1 + newInterest / 12;
  var interestScalar = monthlyInterest ** numMonths;
  var Z = (interestScalar - 1) / (newInterest / 12) / interestScalar;
  var T = monthlyExtraPercent / 100;
  var homeVal, loanAmount_new, interestPlusPrincipal, monthlyTax, totalRepay;

  if (chosenInput == "monthlyPayment") {
    var actualMonthly = monthlyPaymentInput - monthlyExtraFee - PMI_fixed;

    if (interestOnly) {
      homeVal = actualMonthly / (newInterest / 12 + T); //home value * (monthly_interest + monthly_tax) = actualMonthly
      interestPlusPrincipal = (homeVal * newInterest) / 12;
      if (userSetDownPercent) loanAmount_new = homeVal * (1 - downPay);
      else loanAmount_new = homeVal - downPay;
    } else {
      interestPlusPrincipal = numMonths * actualMonthly;
      if (newInterest == 0) {
        //if user wants a 0% interest loan...
        loanAmount_new = interestPlusPrincipal;
        homeVal = userSetDownPercent ? loanAmount_new / (1 - downPay) : loanAmount_new + downPay;
      } else {
        if (userSetDownPercent) {
          // console.log('bp8',actualMonthly,T,ZPMI,downPay)
          homeVal = actualMonthly / (T + 1 / Z - downPay / Z);
          // homeVal = actualMonthly / (T + 1/Z) / (1 - downPay / (T * Z + 1));
          loanAmount_new = homeVal * (1 - downPay);
        } else {
          // console.log('bp9',actualMonthly,T,ZPMI,downPay)
          homeVal = (actualMonthly + downPay * (1 / Z)) / (1 / Z + T);
          loanAmount_new = homeVal - downPay;
        }
      }
    }
    monthlyTax = homeVal * T; //FIXME - I moved this down one line, test it didn't break anything
    // monthly = actualMonthly - monthlyTax;
    return {
      monthly: actualMonthly - monthlyTax,
      interestPlusPrincipal: interestPlusPrincipal,
      loanAmount: loanAmount_new,
      monthlyExta: monthlyTax + monthlyExtraFee + PMI_fixed,
      homeVal: homeVal,
    };
  } else {
    var monthly;
    homeVal = userSetDownPercent ? loanAmount / (1 - downPay) : loanAmount + downPay;
    monthlyTax = T * homeVal;
    if (interestOnly) {
      monthly = (loanAmount * newInterest) / 12;
      interestPlusPrincipal = loanAmount;
    } else {
      totalRepay = loanAmount * interestScalar;
      if (interestRate == 0) {
        monthly = totalRepay / numMonths;
        interestPlusPrincipal = loanAmount;
      } else {
        monthly = loanAmount / Z;
        interestPlusPrincipal = monthly * numMonths;
      }
    }
    return {
      monthly: monthly,
      interestPlusPrincipal: interestPlusPrincipal,
      loanAmount: loanAmount,
      monthlyExta: monthlyTax + monthlyExtraFee + PMI_fixed,
      homeVal: homeVal,
    };
  }
}

export const BUYDOWN_STRUCTURES = {
  "1-0": [1],
  "2-1": [2, 1],
  "3-2-1": [3, 2, 1],
};

// Principal-and-interest only, original amount and original term (payment-equivalent).
export function paymentEquivalent(loanAmount, numMonths, interestRate, interestOnly) {
  if (!isNumber(interestRate) || !isNumber(loanAmount) || !isNumber(numMonths) || numMonths <= 0) return 0;
  var rate = Math.max(0, parseFloat(interestRate));
  return loanCalc(numMonths, rate, loanAmount, "homeVal", null, 0, 0, 0, 0, 0, 0, interestOnly).monthly;
}

export function getBuydownSchedule(loanAmount, numYears, noteRate, structure, interestOnly) {
  var steps = BUYDOWN_STRUCTURES[structure];
  if (!steps || !isNumber(loanAmount) || !isNumber(numYears) || !isNumber(noteRate)) return null;
  var numMonths = numYears * 12;
  var notePayment = paymentEquivalent(loanAmount, numMonths, noteRate, interestOnly);
  var years = steps.map((reduction, i) => {
    var rate = Math.max(0, noteRate - reduction);
    var payment = paymentEquivalent(loanAmount, numMonths, rate, interestOnly);
    return { year: i + 1, rate, payment, monthlySavings: notePayment - payment };
  });
  var cost = years.reduce((sum, y) => sum + y.monthlySavings * 12, 0);
  return { notePayment, years, cost };
}

export function boughtRateFromCut(advertisedRate, points, rateCut) {
  var pts = isNumber(points) ? parseFloat(points) : 0;
  var cut = isNumber(rateCut) && rateCut !== "" ? parseFloat(rateCut) : 0.25;
  if (!isNumber(advertisedRate) || pts <= 0) return null;
  return Math.max(0, parseFloat(advertisedRate) - pts * cut);
}

export function getPointsBuydown(loanAmount, numYears, advertisedRate, rateCut, points, interestOnly) {
  var pts = isNumber(points) ? parseFloat(points) : 0;
  if (pts <= 0 || !isNumber(loanAmount) || !isNumber(numYears) || !isNumber(advertisedRate)) return null;
  var numMonths = numYears * 12;
  var cost = pts * 0.01 * loanAmount;
  var boughtRate = boughtRateFromCut(advertisedRate, pts, rateCut);
  var appliedCut = boughtRate != null ? (isNumber(rateCut) && rateCut !== "" ? parseFloat(rateCut) : 0.25) : null;
  var before = paymentEquivalent(loanAmount, numMonths, advertisedRate, interestOnly);
  var after = boughtRate != null ? paymentEquivalent(loanAmount, numMonths, boughtRate, interestOnly) : before;
  var monthlySavings = before - after;
  var breakEvenMonths = monthlySavings > 0 ? cost / monthlySavings : null;
  return { cost, before, after, monthlySavings, breakEvenMonths, boughtRate, points: pts, rateCut: appliedCut };
}

function handleRepeatPayments(payArray, repeats, addPaymentToExistingPayments, month) {
  //it is more correct to count sundays in a month - that way every month would get exactly the right number of sundays (overpayments).
  //then the tool would be more accurate because the interest calculations are based on different remaining balances
  //however, I decided that was too complicated and only has a minor impact on the final numbers. And who knows exactly how banks calculate interest, is it accrued daily or at end of month... or varies by bank
  var i;
  //firstly add for the current month
  addPaymentToExistingPayments(payArray, month);
  if (repeats == 1) {
    for (i = month + 1; i < payArray.length; i += 12 / 52) addPaymentToExistingPayments(payArray, i);
  } else if (repeats == 2) {
    for (i = month + 1; i < payArray.length; i += 12 / 26) addPaymentToExistingPayments(payArray, i);
  } else if (repeats == 3) {
    for (i = month + 1; i < payArray.length; i++) addPaymentToExistingPayments(payArray, i);
  } else if (repeats == 4) {
    for (i = month + 2; i < payArray.length; i += 2) addPaymentToExistingPayments(payArray, i);
  } else if (repeats == 5) {
    for (i = month + 6; i < payArray.length; i += 6) addPaymentToExistingPayments(payArray, i);
  } else if (repeats == 6) {
    for (i = month + 12; i < payArray.length; i += 12) addPaymentToExistingPayments(payArray, i);
  } else if (repeats == 7) {
    for (i = month + 24; i < payArray.length; i += 24) addPaymentToExistingPayments(payArray, i);
  }
  return payArray;
}

export function loanMaths(
  loanAmount,
  numYears,
  interestRate,
  loanEvent,
  chosenInput,
  monthlyPaymentInput,
  downPay,
  userSetDownPercent,
  monthlyExtraPercent,
  monthlyExtraFee,
  startDate,
  PMI,
  PMI_fixed,
  appraisal,
  interestOnly,
  buydownOpts
) {
  const appraisalIsSet = appraisal !== undefined && appraisal !== null && appraisal !== "" && appraisal !== 0;
  if (!isNumber(numYears) || numYears == 0) numYears = 1; //fix issue when loan length is blank
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var stDate = new Date(Number(startDate));
  var loanMonths = [];
  var monthIndex;
  var start = stDate.getMonth();
  var thisMonth;
  var year = stDate.getFullYear(); // % 100;
  var eventIndex = 0;
  var monthlyPaymentPerEvent = [];

  var numMonths = numYears * 12;
  var extraPayments = 0;

  var PMI_int = PMI;

  var opts = buydownOpts || {};
  var advertisedRate = interestRate;
  var mode = opts.buydown || "";
  var isPointsMode = mode === "points";
  var tempStructure = !isPointsMode && chosenInput != "monthlyPayment" && BUYDOWN_STRUCTURES[mode] ? mode : "";
  var points = isPointsMode && chosenInput != "monthlyPayment" && isNumber(opts.points) ? parseFloat(opts.points) : 0;
  var boughtRate = isPointsMode && chosenInput != "monthlyPayment" ? boughtRateFromCut(advertisedRate, points, opts.rateCut) : null;
  if (boughtRate != null) interestRate = boughtRate;
  var buydownPayer = opts.buydownPayer == "buyer" ? "buyer" : "seller";

  var loanData = loanCalc(
    numMonths,
    interestRate,
    loanAmount,
    chosenInput,
    monthlyPaymentInput,
    downPay,
    userSetDownPercent,
    monthlyExtraPercent,
    monthlyExtraFee,
    PMI_int,
    PMI_fixed,
    interestOnly
  );

  var originalLoanAmount = loanData["loanAmount"];
  var originalHomeVal = loanData["homeVal"];
  var originalInterestPlusPrincipal = loanData["interestPlusPrincipal"];

  var monthlyPayment = new Array(numYears * 12).fill(0);
  var monthlyInterest = new Array(numYears * 12).fill(0);
  var monthlyPMI = new Array(numYears * 12).fill(0);
  var equity = new Array(numYears * 12).fill(0);
  var monthlyPrincipal = new Array(numYears * 12).fill(0);
  var remaining = new Array(numYears * 12 + 1).fill(0);
  var repeatingOverpayments = new Array(numYears * 12 * 2).fill(0);
  var inflationScaler = new Array(numYears * 12 * 2).fill(1.0); //make this (2x) longer so if they refinance and make the load longer the site still works
  var refinanceEvents = new Array(numYears * 12).fill(null);
  var fees = new Array(numYears * 12).fill(0);
  // var loanCopy = { ...loanData };
  var totalPrincipal = 0;
  var totalInterest = 0;
  remaining[0] = loanData["loanAmount"];

  var tempSchedule = getBuydownSchedule(originalLoanAmount, numYears, interestRate, tempStructure, interestOnly);
  var pointsInfo =
    isPointsMode && chosenInput != "monthlyPayment" ? getPointsBuydown(originalLoanAmount, numYears, advertisedRate, opts.rateCut, points, interestOnly) : null;
  var pointsCost = pointsInfo ? pointsInfo.cost : 0;
  if (pointsCost > 0) fees[0] += pointsCost;
  if (tempSchedule && buydownPayer == "buyer") fees[0] += tempSchedule.cost;

  var buydownSubsidy = new Array(numYears * 12).fill(0);
  var buydownActive = tempSchedule != null;
  var buydownInfo = null;
  if (tempSchedule || pointsInfo) {
    buydownInfo = {
      advertisedRate: advertisedRate,
      noteRate: interestRate,
      structure: tempStructure || "",
      payer: buydownPayer,
      notePayment: tempSchedule ? tempSchedule.notePayment : pointsInfo ? pointsInfo.after : null,
      years: tempSchedule ? tempSchedule.years : [],
      tempCost: tempSchedule ? tempSchedule.cost : 0,
      pointsCost: pointsCost,
      points: points,
      rateCut: pointsInfo ? pointsInfo.rateCut : null,
      paymentBeforePoints: pointsInfo ? pointsInfo.before : null,
      paymentAfterPoints: pointsInfo ? pointsInfo.after : null,
      monthlySavings: pointsInfo ? pointsInfo.monthlySavings : 0,
      breakEvenMonths: pointsInfo ? pointsInfo.breakEvenMonths : null,
      tempCostPoints: tempSchedule && originalLoanAmount > 0 ? (tempSchedule.cost / originalLoanAmount) * 100 : 0,
    };
  }

  var rate = interestRate / 100;
  var lastMonth = 0;

  for (var i = 0; i < numMonths; i++) {
    lastMonth = i;
    //Create a month label, i.e May 24
    monthIndex = (start + i) % 12;
    if (monthIndex == 0 && i > 0) year = year + 1;
    thisMonth = `${months[monthIndex]} ${year}`;
    loanMonths.push(thisMonth);

    //Check if any events happening this month
    var wasAnEvent = false;
    while (loanEvent.length > eventIndex && thisMonth == loanEvent[eventIndex]["date"]) {
      wasAnEvent = true;
      if (loanEvent[eventIndex]["event"] == "Over-pay") {
        fees = handleRepeatPayments(
          fees,
          loanEvent[eventIndex]["repeats"],
          (arr, i) => {
            arr[Math.floor(i)] += parseFloat(loanEvent[eventIndex]["cost"]);
          },
          i
        );
        repeatingOverpayments = handleRepeatPayments(
          repeatingOverpayments,
          loanEvent[eventIndex]["repeats"],
          (arr, i) => {
            arr[Math.floor(i)] += parseFloat(loanEvent[eventIndex]["change"]);
          },
          i
        );
      } else if (loanEvent[eventIndex]["event"] == "Expense") {
        fees = handleRepeatPayments(
          fees,
          loanEvent[eventIndex]["repeats"],
          (arr, i) => {
            arr[Math.floor(i)] += parseFloat(loanEvent[eventIndex]["change"]);
          },
          i
        );
      } else if (loanEvent[eventIndex]["event"] == "Refinance") {
        interestRate = Number(loanEvent[eventIndex].change);
        rate = interestRate / 100;
        fees[i] = fees[i] + parseFloat(loanEvent[eventIndex].cost);
        // extraPayments += parseFloat(loanEvent[eventIndex].cost);
        if (loanEvent[eventIndex]["newLength"] != 0) numMonths = i + loanEvent[eventIndex]["newLength"] * 12;
        loanData = loanCalc(
          numMonths - i,
          interestRate,
          remaining[i],
          "homeVal",
          null,
          0,
          0,
          monthlyExtraPercent,
          monthlyExtraFee,
          PMI_int,
          PMI_fixed,
          interestOnly
        );
        refinanceEvents[i] = { interestRate: rate, newLength: loanEvent[eventIndex]["newLength"] };
        buydownActive = false;
      } else if (loanEvent[eventIndex]["event"] == "Recast") {
        // rate = loanEvent[eventIndex].change/100;
        fees[i] = fees[i] + parseFloat(loanEvent[eventIndex].cost);
        // extraPayments += parseFloat(loanEvent[eventIndex].cost);
        loanData = loanCalc(
          numMonths - i,
          interestRate,
          remaining[i],
          "homeVal",
          null,
          0,
          0,
          monthlyExtraPercent,
          monthlyExtraFee,
          PMI_int,
          PMI_fixed,
          interestOnly
        );
      } else if (loanEvent[eventIndex]["event"] == "Inflation") {
        inflationScaler = handleRepeatPayments(
          inflationScaler,
          loanEvent[eventIndex]["repeats"],
          (arr, i) => {
            for (let j = i; j < arr.length; j++) arr[j] *= 1 + parseFloat(loanEvent[eventIndex]["change"]) / 100;
            return arr;
          },
          i
        );
      }
      eventIndex = eventIndex + 1;
      monthlyPaymentPerEvent[eventIndex] = { loan: loanData.monthly, extra: loanData.monthlyExta };
    }
    if (i == 0) monthlyPaymentPerEvent[0] = { loan: loanData.monthly, extra: loanData.monthlyExta }; //in case the event is on day 1 of the loan
    if (!wasAnEvent) monthlyPaymentPerEvent[eventIndex] = { loan: loanData.monthly, extra: loanData.monthlyExta };

    //handle case when PMI payments stop due to <80% L2V. This is like an event causing loan re-calculation
    if (PMI_int > 0 || PMI_fixed > 0) {
      if ((!appraisalIsSet && remaining[i] <= 0.8 * originalHomeVal) || (appraisalIsSet && remaining[i] <= 0.8 * appraisal)) {
        // console.log("stopping PMI at month", i, appraisalIsSet)
        PMI_int = 0;
        PMI_fixed = 0;
        loanData = loanCalc(
          numMonths - i,
          interestRate,
          remaining[i],
          "homeVal",
          null,
          0,
          0,
          monthlyExtraPercent,
          monthlyExtraFee,
          PMI_int,
          PMI_fixed,
          interestOnly
        );
      }
    }

    //Calculate 'the numbers' for the month
    equity[i] = appraisalIsSet ? (appraisal - remaining[i]) / appraisal : (originalHomeVal - remaining[i]) / originalHomeVal;
    monthlyPMI[i] = PMI_fixed > 0 ? PMI_fixed : (remaining[i] * PMI_int) / 12;
    monthlyInterest[i] = (remaining[i] * rate) / 12;
    monthlyPrincipal[i] = interestOnly ? 0 : PMI_int > 0 ? loanData.monthly - monthlyInterest[i] - monthlyPMI[i] : loanData.monthly - monthlyInterest[i];
    var subsidy = 0;
    if (buydownActive && tempSchedule) {
      var buydownYear = Math.floor(i / 12);
      if (buydownYear < tempSchedule.years.length) subsidy = tempSchedule.years[buydownYear].monthlySavings;
    }
    buydownSubsidy[i] = subsidy;
    monthlyPayment[i] = loanData.monthly + loanData.monthlyExta - subsidy;
    remaining[i + 1] = remaining[i] - monthlyPrincipal[i];

    if (repeatingOverpayments[i] > remaining[i + 1]) repeatingOverpayments[i] = 0;
    remaining[i + 1] -= repeatingOverpayments[i];
    extraPayments += repeatingOverpayments[i];

    if (remaining[i + 1] <= 0) {
      monthlyPrincipal[i] += remaining[i + 1];
      monthlyPayment[i] += remaining[i + 1];
    }

    totalPrincipal += monthlyPrincipal[i];
    totalInterest += monthlyInterest[i];

    if (remaining[i + 1] <= 0) {
      remaining[i + 1] = 0;
      break;
    }
  }
  // console.log("monthlyPMI", monthlyPMI)

  monthlyPayment.splice(lastMonth + 1);
  monthlyInterest.splice(lastMonth + 1);
  monthlyPrincipal.splice(lastMonth + 1);
  remaining.splice(lastMonth + 1);
  monthlyPMI.splice(lastMonth + 1);
  equity.splice(lastMonth + 1);
  inflationScaler.splice(lastMonth + 1);
  loanMonths.splice(lastMonth + 1);
  repeatingOverpayments.splice(lastMonth + 1);
  fees.splice(lastMonth + 1);
  buydownSubsidy.splice(lastMonth + 1);
  return {
    loanAmount: originalLoanAmount,
    endMonth: lastMonth,
    loanMonths: loanMonths,
    monthlyInterest: monthlyInterest,
    monthlyPayment: monthlyPayment,
    monthlyPrincipal: monthlyPrincipal,
    numMonths: numMonths,
    remaining: remaining,
    interestPlusPrincipal: originalInterestPlusPrincipal,
    homeVal: originalHomeVal,
    extraPayments: extraPayments,
    totalFees: fees,
    monthlyPaymentPerEvent: monthlyPaymentPerEvent,
    totalPrincipal: totalPrincipal,
    totalInterest: totalInterest,
    monthlyPMI: monthlyPMI,
    equity: equity,
    inflation: inflationScaler,
    overPayments: repeatingOverpayments,
    refinanceEvents: refinanceEvents,
    buydownSubsidy: buydownSubsidy,
    buydownInfo: buydownInfo,
  };
}
