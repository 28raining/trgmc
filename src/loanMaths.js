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
  interestOnly
) {
  const appraisalIsSet = appraisal !== undefined && appraisal !== null && appraisal !== "" && appraisal !== 0;
  // console.log(appraisal,'appraisal', appraisalIsSet, PMI, PMI_fixed);
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
  var overPay = 0;
  remaining[0] = loanData["loanAmount"];

  var rate = interestRate / 100;
  var lastMonth = 0;

  for (var i = 0; i < numMonths; i++) {
    lastMonth=i;
    //Create a month label, i.e May 24
    monthIndex = (start + i) % 12;
    if (monthIndex == 0 && i > 0) year = year + 1;
    thisMonth = `${months[monthIndex]} ${year}`;
    loanMonths.push(thisMonth);

    //Check if any events happening this month
    while (loanEvent.length > eventIndex && thisMonth == loanEvent[eventIndex]["date"]) {
      if (loanEvent[eventIndex]["event"] == "Over-pay") {
        fees[i] = fees[i] + parseFloat(loanEvent[eventIndex]["cost"]);
        // extraPayments += parseFloat(loanEvent[eventIndex].cost);
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
    }

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
    equity[i] = `${Math.round((1000 * (originalHomeVal - remaining[i])) / originalHomeVal) / 10}%`;
    monthlyPMI[i] = PMI_fixed > 0 ? PMI_fixed : (remaining[i] * PMI_int) / 12;
    monthlyInterest[i] = (remaining[i] * rate) / 12;
    monthlyPrincipal[i] = interestOnly ? 0 : PMI_int > 0 ? loanData.monthly - monthlyInterest[i] - monthlyPMI[i] : loanData.monthly - monthlyInterest[i];
    monthlyPayment[i] = loanData.monthly + loanData.monthlyExta;
    remaining[i + 1] = remaining[i] - monthlyPrincipal[i];

    if (repeatingOverpayments[i] < remaining[i + 1]) overPay = repeatingOverpayments[i];
    else overPay = 0;
    remaining[i + 1] -= overPay;
    extraPayments += overPay;

    if (i == 0) monthlyPaymentPerEvent[0] = { loan: loanData.monthly, extra: loanData.monthlyExta }; //in case the event is on day 1 of the loan
    monthlyPaymentPerEvent[eventIndex] = { loan: loanData.monthly, extra: loanData.monthlyExta };

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
    totalFees: fees.reduce((a, b) => a + b, 0),
    monthlyPaymentPerEvent: monthlyPaymentPerEvent,
    totalPrincipal: totalPrincipal,
    totalInterest: totalInterest,
    monthlyPMI: monthlyPMI,
    equity: equity,
    inflation: inflationScaler,
    overPayments: repeatingOverpayments,
    refinanceEvents: refinanceEvents,
  };
}
