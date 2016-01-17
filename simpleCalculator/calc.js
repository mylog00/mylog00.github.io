'use strict';

const OPERATIONS = {
    '+': [1, function (x, y) {
        return x + y
    }],
    '-': [1, function (x, y) {
        return x - y
    }],
    '*': [2, function (x, y) {
        return x * y
    }],
    '/': [2, function (x, y) {
        return x / y
    }]
};

function calculate() {
    var formula = document.getElementById('formula');
    var rpn = document.getElementById('rpn');
    var result = document.getElementById('result');
    var trimmed_string = formula.value.replace(/\s+/g, '');//delete all white spaces
    result.innerHTML = '';
    rpn.innerHTML = '';
    if (trimmed_string) {
        if (!isValidString(trimmed_string)) {
            result.innerHTML = 'Unknown character at string';
        }
        else {
            var token_list = parse(trimmed_string);
            //console.log(token_list);
            var rpn_list = reversPolishNotation(token_list);
            rpn.innerHTML = rpn_list.join('');
            var eval_res = evaluateRpn(rpn_list);
            result.innerHTML = eval_res.toString();
        }
    } else {
        result.innerHTML = 'Empty string';
    }
}

function evaluateRpn(rpn_list) {
    var stack = [];
    for (var i = 0, len = rpn_list.length; i < len; i++) {
        var token = rpn_list[i];
        if (isOperation(token)) {
            var y = stack.pop();
            var x = stack.pop();
            var res = OPERATIONS[token][1](x, y);
            stack.push(res);
        } else {
            stack.push(token);
        }
    }
    return stack[0];
}

function reversPolishNotation(token_list) {
    var output = [];
    var stack = [];
    for (var i = 0, len = token_list.length; i < len; i++) {
        var token = token_list[i];
        if (isOperation(token)) {
            while (!isArrayEmpty(stack)) {
                var op = stack[stack.length - 1];
                if (op == '(') break;
                if (OPERATIONS[token][0] > OPERATIONS[op][0]) break;
                output.push(stack.pop())
            }
            stack.push(token);
        } else if (token == '(') {
            stack.push(token);
        } else if (token == ')') {
            while (!isArrayEmpty(stack)) {
                var e = stack.pop();
                if (e == '(') break;
                output.push(e);
            }
        } else {
            output.push(token);//is number
        }
    }
    if (!isArrayEmpty(stack)) {
        output = output.concat(stack.reverse())
    }
    return output;
}

function parse(input_str) {
    var res = [];
    var number = '';
    for (var i = 0, len = input_str.length; i < len; i++) {
        var c = input_str[i];
        if (isDigit(c)) {
            number += c;
        } else {
            if (number) {
                res.push(parseFloat(number));
                number = '';
            }
            if (isBracket(c) || isOperation(c)) {
                res.push(c);
            }
        }
    }
    if (number)
        res.push(parseFloat(number));
    return res;
}

function isDigit(char) {
    return char >= '0' && char <= '9' || char == '.';
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isBracket(char) {
    return char == '(' || char == ')';
}

function isOperation(char) {
    return char in OPERATIONS;
}

function isArrayEmpty(array) {
    return array === undefined || array.length <= 0
}

function isValidString(str) {
    return /^[*/+\-0-9().]+$/.test(str);
}