"use strict";

//on load restore input data from local storage
window.onload = restore;

function calculate() {
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
    log('principal:' + principal);
    var interest = parseFloat(apr.value) / 100 / 12;
    log('interest:' + interest);
    var payments = parseFloat(years.value) * 12;
    log('payments:' + payments);

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
        //Draw graph
        chart(principal, interest, monthly, payments);
    } else {
        //Clear output data
        payment.innerHTML = '';
        total.innerHTML = '';
        totalinterest.innerHTML = '';
        chart();
    }
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
    try {
        getExchangeData();
    } catch (e) {
        log('Can not load foreign exchange data');
    }

    if (window.localStorage && localStorage.loan_amount) {
        document.getElementById('amount').value = localStorage.loan_amount;
        document.getElementById('apr').value = localStorage.loan_apr;
        document.getElementById('years').value = localStorage.loan_years;
        document.getElementById('zipcode').value = localStorage.loan_zipcode;
    }
}

function getExchangeData() {
    // http://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=13/01/2016&date_req2=14/01/2016&VAL_NM_RQ=R01235
    var url = getYqlUrl();
    var newScriptElement = document.createElement("script");
    newScriptElement.setAttribute("src", url);
    newScriptElement.setAttribute("id", "jsonp");

    var head = document.getElementsByTagName("head")[0];
    var oldScriptElement = document.getElementById("jsonp");
    if (oldScriptElement === null) {
        head.appendChild(newScriptElement);
    }
    else {
        head.replaceChild(newScriptElement, oldScriptElement);
    }
}

//used as JSONP callback
function updateExchangeTable(object) {
    var records = object.query.results.ValCurs.Record;
    if (Array.isArray(records)) {
        //fill table head
        var tableHead = document.getElementsByTagName("thead")[0];
        var row = createTableRow(['Value','Pair','Date'],true);
        tableHead.appendChild(row);
        //fill table body
        records.reverse();
        var tableBody = document.getElementsByTagName("tbody")[0];
        for (var i = 0; i < records.length; i++) {
            var rec = records[i];
            var date = rec.Date;
            var nominal = rec.Nominal;
            var value = rec.Value.replace(',', '.');
            value = parseFloat(value).toFixed(2);
            log(date + ';' + nominal + ';' + rec.Value + ';' + value + ';');
            row = createTableRow([value, 'USD/RUB', date], false);
            tableBody.appendChild(row);
        }
    }

    function createTableRow(valueList, isHeader) {
        var row = document.createElement('tr');
        if (Array.isArray(valueList)) {
            for (var i = 0; i < valueList.length; i++) {
                var col = createColumn(valueList[i], isHeader);
                row.appendChild(col);
            }
        }
        return row;

        function createColumn(value, isHeader) {
            var elem = isHeader ? 'th' : 'td';
            var col = document.createElement(elem);
            col.innerHTML = value;
            return col;
        }
    }
}

function getYqlUrl() {
    //Example:
    //https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'www.cbr.ru%2Fscripts%2FXML_dynamic.asp%3Fdate_req1%3D02%2F03%2F2001%26date_req2%3D14%2F03%2F2001%26VAL_NM_RQ%3DR01235'&format=json&callback=callback
    var yql_uri = 'https://query.yahooapis.com/v1/public/yql?q=';
    yql_uri += getEncodedSelectQuery();
    yql_uri += '&format=json&callback=updateExchangeTable';
    log('url:' + yql_uri);
    return yql_uri;
}

function getEncodedSelectQuery() {
    var selectStr = 'select * from xml where url=\'' + getCbrUrl() + '\'';
    return encodeURIComponent(selectStr);

    function getCbrUrl() {
        var usd_code = 'R01235';//USD
        //var eur_code = 'R01239';//EUR
        var date = new Date();//current date
        var cur_date = formatDate(date);
        date.setDate(date.getDate() - 7);//past date
        var yestr_date = formatDate(date);
        //Example:
        //http://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=13/01/2016&date_req2=14/01/2016&VAL_NM_RQ=R01235
        var url = 'www.cbr.ru/scripts/XML_dynamic.asp?date_req1=' + yestr_date + '&date_req2=' + cur_date + '&VAL_NM_RQ=' + usd_code;
        log('cbr url:' + url);
        return url;
    }

    // format date to 'dd/mm/YYY'
    function formatDate(date) {
        function formatNum(num) {
            if (num < 10) return '0' + num;
            return String(num);
        }
        return formatNum(date.getDate()) + '/' + formatNum(date.getMonth() + 1) + '/' + date.getFullYear();
    }
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

    var thisMonthsInterest;
    var i;
    for (i = 1; i <= payments; i++) {
        thisMonthsInterest = (principal - equity) * interest;
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
    for (i = 1; i <= payments; i++) {
        thisMonthsInterest = bal * interest;
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
    for (i = 0; i < ticks.length; i++) {
        y = amountToY(ticks[i]);
        context.fillRect(rightEdge - 3, y - 0.5, 3, 1);
        context.fillText(String(ticks[i].toFixed(0)), rightEdge - 5, y);
    }
}

function log(str) {
    console.log(str);
}
