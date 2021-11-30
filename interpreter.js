// TODO: make it accept nested lists, cond

const specialForms = Object.create(null);
specialForms.define = function(args) {
  return this[evaluate(args[0])] = evaluate(args[1]);
}

specialForms['+'] = function(args) {
  let sum = 0;
  for (let i = 0; i < args.length; i++) {
    sum += evaluate(args[i]);
  }
  return sum;
}

specialForms['-'] = function(args) {
  let acc = 0;
  for (let i = 0; i < args.length; i++) {
    acc -= evaluate(args[i]);
  }
  return acc;
}

specialForms['*'] = function(args) {
  let acc = 1;
  for (let i = 0; i < args.length; i++) {
    acc *= evaluate(args[i]);
  }
  return acc;
}

specialForms['/'] = function(args) {
  let acc = evaluate(args[0]);
  for (let i = 1; i < args.length; i++) {
    acc /= evaluate(args[i]);
  }
  return acc;
}

specialForms['<'] = function(args) {
  return evaluate(args[0]) < evaluate(args[1]);
}

specialForms['<='] = function(args) {
  return evaluate(args[0]) <= evaluate(args[1]);
}

specialForms['>='] = function(args) {
  return evaluate(args[0]) >= evaluate(args[1]);
}

specialForms['>'] = function(args) {
  return evaluate(args[0]) > evaluate(args[1]);
}

specialForms['='] = function(args) {
  return evaluate(args[0]) === evaluate(args[1]);
}

specialForms['cond'] = function(args) {
  console.log(args);
  for (let i = 0; i < args.length; i++) {
    if (evaluate(
          specialForms['car'](args[0]))) {
      evaluate(specialForms['cdr'](args[0]))
      break;
    }
  }
}

specialForms['else'] = function() {
  return true;
}

specialForms['car'] = function(args) {
  if (args[0].type === 'list') {
    return evaluate(args[0]['value'][0]);
  } else if (args[0].type === 'procedure') {
    return specialForms['car']([evaluate(args[0])]);
  }
}

specialForms['cdr'] = function(args) {
  const res = {
    type: 'list',
    value: args[0].value.slice(1),
  }

  return res
}

specialForms['#t'] = true;
specialForms['#f'] = false;

// for (let op of ['+', '-', '*', '/']) {
//   specialForms[op] = Function('args', `
//   let acc = 0;
//   for (let i = 0; i < args.length; i++) {
//     acc ${op}= ${evaluate}(args[i]);
//   }
//   return acc;`)
// }

specialForms.print = function(args) {
  args.forEach(arg => console.log(evaluate(arg)));
}

// const program = `(define a b) (define five 5)`;
const program = `
(define a (+ 2 3))
(define b (* (/ 4 2) 2 2))
(print a)
(print b)
(print (+ a b))
(print (= a b))
(print (< a b))
(define ten (+ 5 5))
(print (> ten 5))
(print
  (+ (car (cdr '(5 10))) 7))
`
// (print (car '(hello world)))

// let aTree = parse(" (define a hello) '(cruel world)");
// console.log(aTree[1]);

// const p2 = `
//   (define foo (car '(hello world)))
//   (car (cdr '(hello world)))
//   (print foo)
// `

const p2 = `
  (cond
    '((= 2 2) #t)
  )
`

run(program);
// run(p2)

function run(program) {
  program = program.replace(/\s{2,}/g, ' ');
  const trees = parse(program);
  evaluateAll(trees)
}

function evaluateAll(trees) {
  let i;
  for (i = 0; i < trees.length - 1; i++) {
    evaluate(trees[i]);
  }
  return evaluate(trees[i]);
}

function evaluate(tree) {
  if (tree.type === 'procedure') {
    return specialForms[tree.value.operator](tree.value.operands);
  } else if (tree.type = 'atom') {
    if (globalThis.isNaN(tree.value)) {
      return specialForms[tree.value] || tree.value;
    } else {
      return Number(tree.value);
    }
  } else if (tree.type = 'list') {
    return tree.elements;
  } else {
    console.log('\n ERROR: INVALID TYPE');
  }
}

function parse(program) {
  program = skipWSpace(program);
  let [ expr, rest ] = chunk(program);
  if (rest === '') {
    return [parseApply(expr)];
  } else {
    return [parseApply(expr)].concat(parse(rest));
  }
}

function skipWSpace(str) {
  return str.trim();
}

function parseApply(expr) {
  expr = skipWSpace(expr);

  let match = expr.match(/^\((\S+)((.)*)\)$/);
  if (match) {
    var [ _, operator, rest ] = match;
    const operands = splitOperands(rest.trim());

    var node = {};
    node.type = 'procedure';
    node.value = {
      operator: operator,
      operands: operands.map(parseApply),
    }
  } else if (expr.match(/^'\(([^)]*)\)(.*)$/)) {
    var [ _, elStr, rest ] = expr.match(/^'\(([^)]*)\)(.*)$/);
    var elements = splitElements(elStr);

    var node = {};
    node.type = 'list';
    node.value = elements.map(parseApply);
  } else {
    var node = { type: 'atom', value: expr }
  }
  return node;
}

// console.log(splitElements("five (+ 2 3)"));

function splitElements(elStr) { // same as splitOperands
  const elements = [];

  do {
    [ element, rest ] = chunk(elStr);
    elements.push(element);
    elStr = rest;
  } while(rest !== '');

  return elements;
}

function splitOperands(opString) {
  const operands = [];
  do {
    [ operand, rest ] = chunk(opString);
    operands.push(operand);
    opString = rest;
  } while(rest !== '');

  return operands;
}

function chunk(str) {
  let res = str[0];
  if (res === "(") {
    let openParens = 1;
    let closeParens = 0;
    for (let i = 1; i < str.length; i++) {
      res += str[i];
      if (str[i] === ")") closeParens++;
      if (str[i] === "(") openParens++;
      if (closeParens === openParens) {
        return [ res, str.slice(i + 1) ];
      }
    }
    console.log("\n  ERROR, UNCLOSED PARENTHESIS.\n");
  } else if (res === "'") {
    let openParens = 0;
    let closeParens = 0;
    for (let i = 1; i < str.length; i++) {
      res += str[i];
      if (str[i] === ")") closeParens++;
      if (str[i] === "(") openParens++;
      if (closeParens === openParens && openParens > 0) {
        return [ res, str.slice(i + 1) ];
      }
    }
    console.log("\n  ERROR, UNCLOSED PARENTHESIS.\n");
  } else {
    for (let i = 1; i < str.length; i++) {
      if (str[i] === ' ') {
        return [res, str.slice(i + 1)];
      } else {
        res += str[i];
      }
    }
    return [res, ''];
  }
}
