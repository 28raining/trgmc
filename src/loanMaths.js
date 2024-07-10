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

function loanCalc(numMonths, interestRate, loanAmount, chosenInput, monthlyPaymentInput, downPay, userSetDownPercent, monthlyExtraPercent, monthlyExtraFee) {
  // console.log('loanCalc', numMonths, interestRate, loanAmount, chosenInput, monthlyPaymentInput, downPayCash, monthlyExtraPercent, monthlyExtraFee)
  // console.log("chosenInput", chosenInput)
  var monthlyInterest = 1 + interestRate / (12 * 100);
  var interestScalar = monthlyInterest ** numMonths;
  var T = monthlyExtraPercent / 100;
  var homeVal, loanAmount_new, interestPlusPrincipal, monthlyTax, totalRepay;

  if (chosenInput == "monthlyPayment") {
    var actualMonthly = monthlyPaymentInput - monthlyExtraFee;
    interestPlusPrincipal = numMonths * actualMonthly;
    if (interestRate == 0) {
      loanAmount_new = interestPlusPrincipal;
      homeVal = userSetDownPercent ? loanAmount_new / (1 - downPay) : loanAmount_new + downPay;
    } else {
      var Z = (interestScalar - 1) / (interestRate / (12 * 100)) / interestScalar;
      if (userSetDownPercent) {
        homeVal = actualMonthly / (T + 1 / Z) / (1 - downPay / (T * Z + 1));
        loanAmount_new = homeVal * (1 - downPay);
      } else {
        homeVal = actualMonthly / (T + 1 / Z) + downPay / (T * Z + 1);
        loanAmount_new = homeVal - downPay;
      }
      monthlyTax = homeVal * T;

      // var compoundTotalRepay = actualMonthly * ((interestScalar - 1) / (interestRate / (12 * 100)));
      // var loanAmount_new = compoundTotalRepay / interestScalar;
    }
    // console.log('bp85', loanAmount_new, homeVal, downPay)

    return {
      monthly: actualMonthly - monthlyTax,
      interestPlusPrincipal: interestPlusPrincipal,
      loanAmount: loanAmount_new,
      monthlyExta: monthlyTax + monthlyExtraFee,
      homeVal: homeVal,
    };
  } else {
    var monthly;
    totalRepay = loanAmount * interestScalar;
    if (interestRate == 0) {
      monthly = totalRepay / numMonths;
      interestPlusPrincipal = loanAmount;
    } else {
      monthly = totalRepay / ((interestScalar - 1) / (interestRate / (12 * 100)));
      interestPlusPrincipal = monthly * numMonths;
    }
    homeVal = userSetDownPercent ? loanAmount / (1 - downPay) : loanAmount + downPay;
    monthlyTax = T * homeVal;
    // console.log('bp85', homeVal)

    // console.log(interestPlusPrincipal);
    return {
      monthly: monthly,
      interestPlusPrincipal: interestPlusPrincipal,
      loanAmount: loanAmount,
      monthlyExta: monthlyTax + monthlyExtraFee,
      homeVal: homeVal,
    };
  }
}

//function to handle recurring overpayments
//0 : "doesn't repeat"
//1 : "weekly"
//2 : "bi-weekly"
//3 : "monthly"
//4 : "bi-monthly"
//5 : "every 6 months"
//6 : "annualy"
//7 : "bi-annually"]

function handleRepeatPayments(payArray, repeats, amount, month) {
  //it is more correct to count sundays in a month - that way every month would get exactly the right number of sundays (overpayments).
  //then the tool would be more accurate because the interest calculations are based on different remaining balances
  //however, I decided that was too complicated and only has a minor impact on the final numbers. And who knows exactly how banks calculate interest, is it accrued daily or at end of month... or varies by bank
  var i;
  if (repeats == 1) {
    for (i = month + 1; i < payArray.length; i += 12 / 52) payArray[Math.floor(i)] += amount;
  } else if (repeats == 2) {
    for (i = month + 1; i < payArray.length; i += 12 / 26) payArray[Math.floor(i)] += amount;
  } else if (repeats == 3) {
    for (i = month + 1; i < payArray.length; i++) payArray[i] += amount;
  } else if (repeats == 4) {
    for (i = month + 2; i < payArray.length; i += 2) payArray[i] += amount;
  } else if (repeats == 5) {
    for (i = month + 6; i < payArray.length; i += 6) payArray[i] += amount;
  } else if (repeats == 6) {
    for (i = month + 12; i < payArray.length; i += 12) payArray[i] += amount;
  } else if (repeats == 7) {
    for (i = month + 24; i < payArray.length; i += 24) payArray[i] += amount;
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
  startDate
) {
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

  var loanData = loanCalc(
    numMonths,
    interestRate,
    loanAmount,
    chosenInput,
    monthlyPaymentInput,
    downPay,
    userSetDownPercent,
    monthlyExtraPercent,
    monthlyExtraFee
  );

  var originalLoanAmount = loanData["loanAmount"];
  var originalHomeVal = loanData["homeVal"];
  var originalInterestPlusPrincipal = loanData["interestPlusPrincipal"];

  var monthlyPayment = new Array(numYears * 12).fill(0);
  var monthlyInterest = new Array(numYears * 12).fill(0);
  var monthlyPrincipal = new Array(numYears * 12).fill(0);
  var remaining = new Array(numYears * 12 + 1).fill(0);
  var repeatingOverpayments = new Array(numYears * 12 + 1).fill(0);
  // var loanCopy = { ...loanData };
  var totalPrincipal = 0;
  var totalInterest = 0;
  var overPay = 0;
  remaining[0] = loanData["loanAmount"];

  var rate = interestRate / 100;

  for (var i = 0; i < numMonths; i++) {
    //Create a month label, i.e May 24
    monthIndex = (start + i) % 12;
    if (monthIndex == 0) year = year + 1;
    thisMonth = `${months[monthIndex]} ${year}`;
    loanMonths.push(thisMonth);

    //Check if any events happening this month
    while (loanEvent.length > eventIndex && thisMonth == loanEvent[eventIndex]["date"]) {
      if (loanEvent[eventIndex]["event"] == "Over-pay") {
        remaining[i] = remaining[i] + parseFloat(loanEvent[eventIndex]["cost"]) - parseFloat(loanEvent[eventIndex]["change"]);
        extraPayments += parseFloat(loanEvent[eventIndex].cost) + parseFloat(loanEvent[eventIndex]["change"]);
        repeatingOverpayments = handleRepeatPayments(repeatingOverpayments, loanEvent[eventIndex]["repeats"], parseFloat(loanEvent[eventIndex]["change"]), i);
      } else if (loanEvent[eventIndex]["event"] == "Refinance") {
        interestRate = Number(loanEvent[eventIndex].change);
        rate = interestRate / 100;
        remaining[i] = remaining[i] + parseFloat(loanEvent[eventIndex].cost);
        extraPayments += parseFloat(loanEvent[eventIndex].cost);
        if (loanEvent[eventIndex]["newLength"] != 0) numMonths = i + loanEvent[eventIndex]["newLength"] * 12;
        loanData = loanCalc(numMonths - i, interestRate, remaining[i], "homeVal", null, 0, 0, monthlyExtraPercent, monthlyExtraFee);
      } else if (loanEvent[eventIndex]["event"] == "Recast") {
        // rate = loanEvent[eventIndex].change/100;
        remaining[i] = remaining[i] + parseFloat(loanEvent[eventIndex].cost);
        extraPayments += parseFloat(loanEvent[eventIndex].cost);
        loanData = loanCalc(numMonths - i, interestRate, remaining[i], "homeVal", null, 0, 0, monthlyExtraPercent, monthlyExtraFee);
      }
      eventIndex = eventIndex + 1;
    }

    //Calculate 'the numbers' for the month

    monthlyPayment[i] = loanData.monthly + loanData.monthlyExta;
    monthlyInterest[i] = (remaining[i] * rate) / 12;
    monthlyPrincipal[i] = loanData.monthly - monthlyInterest[i];
    remaining[i + 1] = remaining[i] - monthlyPrincipal[i];
    if (repeatingOverpayments[i] < remaining[i + 1]) overPay = repeatingOverpayments[i];
    else overPay = 0;
    remaining[i + 1] -= overPay;
    extraPayments += overPay;

    monthlyPaymentPerEvent[eventIndex] = loanData.monthly;

    if (remaining[i + 1] <= 0) {
      monthlyPrincipal[i] = monthlyPrincipal[i] + remaining[i + 1];
      monthlyPayment[i] = monthlyPrincipal[i] + monthlyInterest[i + 1];
    }

    totalPrincipal += monthlyPrincipal[i];
    totalInterest += monthlyInterest[i];

    if (remaining[i + 1] <= 0) {
      remaining[i + 1] = 0;
      break;
    }
  }

  // console.log('ex', extraPayments)

  //remove the last element of 'remaining' which should be 0
  // remaining.splice(remaining.length - 1, 1);

  // console.log(i, numMonths, monthlyPayment.length,[...monthlyPayment]);
  monthlyPayment.splice(i + 1, numMonths - i);
  monthlyInterest.splice(i + 1, numMonths - i);
  monthlyPrincipal.splice(i + 1, numMonths - i);
  remaining.splice(i + 1, numMonths - i);
  // console.log(i, numMonths, monthlyPayment.length,[...monthlyPayment]);

  return {
    loanAmount: originalLoanAmount,
    endMonth: i,
    loanMonths: loanMonths,
    monthlyInterest: monthlyInterest,
    monthlyPayment: monthlyPayment,
    monthlyPrincipal: monthlyPrincipal,
    numMonths: numMonths,
    remaining: remaining,
    interestPlusPrincipal: originalInterestPlusPrincipal,
    homeVal: originalHomeVal,
    extraPayments: extraPayments,
    monthlyPaymentPerEvent: monthlyPaymentPerEvent,
    totalPrincipal: totalPrincipal,
    totalInterest: totalInterest,
  };
}
