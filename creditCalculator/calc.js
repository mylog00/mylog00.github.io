"use strict";

//on load restore input data from local storage
window.onload = restore;

function calculate() {
    console.log('strt calculate');
    //find elements by 'id'
    var amount = document.getElementById('amount');
    var apr = document.getElementById('apr');
    var years = document.getElementById('years');
    var zipcode = document.getElementById('zipcode');
    var payment = document.getElementById('payment');
    var total = document.getElementById('total');
    var totalinterest = document.getElementById('totalinterest');

    //Get input data
    var principal = parseFloat(amount.value);
    console.log('principal:' + principal);
    var interest = parseFloat(apr.value) / 100 / 12;
    console.log('interest:' + interest);
    var payments = parseFloat(years.value) * 12;
    console.log('payments:' + payments);

    //Calculate monthly payment
    var x = Math.pow(1 + interest, payments);
    var monthly = (principal * x * interest) / (x - 1);

    //Check 'monthly'
    //If the argument is NaN, positive infinity, or negative infinity, this method returns false; otherwise, it returns true.
    if (isFinite(monthly)) {//NOTE need check 'null'
        //Set output data
        payment.innerHTML = monthly.toFixed(2);
        total.innerHTML = (monthly * payments).toFixed(2);
        totalinterest.innerHTML = ((monthly * payments) - principal).toFixed(2);
        //Save input data to local storage
        save(amount.value, apr.value, years.value, zipcode.value);
        //
        try {
            getLenders(amount.value, apr.value, years.value, zipcode.value);
        } catch (e) {
            console.log('Error at function \'getLenders\'');
        }
        //Draw graph
        chart(principal, interest, monthly, payments);
    } else {
        //Clear output data
        payment.innerHTML = '';
        total.innerHTML = '';
        totalinterest.innerHTML = '';
        chart();
    }
    return true;
}

//Save data to local storage
function save(amount, apr, years, zipcode) {
    if (window.localStorage) {
        localStorage.loan_amount = amount;
        localStorage.loan_apr = apr;
        localStorage.loan_years = years;
        localStorage.loan_zipcode = zipcode;
    }
}
//Restore data to local storage
function restore() {
    if (window.localStorage && localStorage.loan_amount) {
        document.getElementById('amount').value = localStorage.loan_amount;
        document.getElementById('apr').value = localStorage.loan_apr;
        document.getElementById('years').value = localStorage.loan_years;
        document.getElementById('zipcode').value = localStorage.loan_zipcode;
    }
}

function getLenders(amount, apr, years, zipcode) {
    console.log('I do smth. Yeah!');
    //TODO
}

//Draw payment graph
function chart(principal, interest, monthly, payments) {
    var graph = document.getElementById('graph');
    graph.width = graph.width;//its magic

    //if no parameters or no <canvas> then return
    //NOTE getContext() method returns a drawing context on the canvas, or null if the context identifier is not supported.
    if (arguments.length == 0 || !graph.getContext)
        return;

    var context = graph.getContext('2d');//CanvasRenderingContext2D
    var width = graph.width;
    var height = graph.height;

    function paymentToX(n) {
        return n * width / payments;
    }

    function amountToY(a) {
        return height - (a * height / (monthly * payments * 1.05));
    }

    //First triangle
    context.moveTo(paymentToX(0), amountToY(0));
    context.lineTo(paymentToX(payments), amountToY(monthly * payments));
    context.lineTo(paymentToX(payments), amountToY(0));
    context.closePath();
    //First triangle color
    context.fillStyle = '#f88';
    context.fill();
    //First triangle text
    context.font = 'bold 12px sans-serif';
    context.fillText('Total interest payments', 20, 20);

    //Second figure
    var equity = 0;
    context.beginPath();
    context.moveTo(paymentToX(0), amountToY(0));
    for (var i = 1; i <= payments; i++) {
        var thisMonthsInterest = (principal - equity) * interest;
        equity += (monthly - thisMonthsInterest);
        context.lineTo(paymentToX(i), amountToY(equity));
    }
    context.lineTo(paymentToX(payments), amountToY(0));
    context.closePath();
    context.fillStyle = 'green';
    context.fill();
    context.fillText('Total equity', 20, 30);

    //Third figure
    var bal = principal;
    context.beginPath();
    context.moveTo(paymentToX(0), amountToY(bal));
    for (var i = 1; i <= payments; i++) {
        var thisMonthsInterest = bal * interest;
        bal -= (monthly - thisMonthsInterest);
        context.lineTo(paymentToX(i), amountToY(bal));
    }
    context.lineWidth = 3;
    context.stroke();//draw curve
    context.fillStyle = 'black';
    context.fillText('Loan balance', 20, 50);

    //X axis
    context.textAlign = 'right';
    var y = amountToY(0);
    for (var year = 1; year * 12 <= payments; year++) {
        var x = paymentToX(year * 12);
        context.fillRect(x - 0.5, y - 3, 1, 3);
        if (year == 1)
            context.fillText('Year', x, y - 5);
        if (year % 5 == 0 && year * 12 !== payments)
            context.fillText(String(year), x, y - 5);
    }

    //Y axis
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    var ticks = [monthly * payments, principal];
    var rightEdge = paymentToX(payments);
    for (var i = 0; i < ticks.length; i++) {
        var y = amountToY(ticks[i]);
        context.fillRect(rightEdge - 3, y - 0.5, 3, 1);
        context.fillText(String(ticks[i].toFixed(0)), rightEdge - 5, y);
    }
}
