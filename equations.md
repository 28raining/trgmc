## Monthly Loan Repayment

FIXME -> ZPMI like this does not work - it is not a real loan there is no principal

Every month the amount you owe the bank increases because of interest, and decreases because of your monthly payments

interest rate, $i$, is for example = 5  
Monthly payment towards loan = $M_{loan}$  
Loan amount = $homeValue - downPayment$   
$$Monthly Interest = 1 + \frac{i}{(12 * 100)}$$
$$Z = \frac{MonthlyInterest ^ {numberMonths} - 1}{MonthlyInterest ^ {numberMonths} \cdot \frac{i}{(12 * 100)}}$$
$$M_{loan} = \frac{loanAmount}{Z} = \frac{homeValue - downPayment}{Z}$$

## Monthy costs including extras (like tax)

Every month there are 3 types of payment

#1 Payments towards the loan ($M_{loan}$)  
#2 Fixed payments like utlities ($F$)  
#3 Percentage of home value payments - like Tax ($T$)  
#4 PMI - a percentage of the loan value - note it will decrease every month - it effectively inceases the interest rate and change Z above ($PMI$)

$$monthly = (homeValue - downPayment)(\frac{1}{Z}) + T \cdot homeValue$$
$$monthly = homeValue(T + \frac{1}{Z}) - downPayment(\frac{1}{Z})$$

## What can you afford for a fixed monthly payment

re-arranging the equation above
$$homeVal = \frac{monthly + downPayment(\frac{1}{Z})}{T + \frac{1}{Z}}$$

## What if downPayment is a fixed percentage of homeValue
$$downPayment = homeValue \cdot P$$
$$monthly = homeValue(T + \frac{1}{Z} - \frac{P}{Z})$$