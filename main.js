// const code = "A->B:E\nB->C:F";
const code = "A->B:N\n*A";
parser(tokenize(code));

// input: the whole code in our language to be read as a string
// output: an list of tokens
function tokenize(code) {
  const validTokens = {
    COLON: ":",
    HYPHEN: "-",
    GT: ">",
    STRING: /[a-z]/i,
    DESTROY: "*"
  };

  const lines = code.split("\n");
  //   console.log(lines);
  let tokens = [];

  lines.forEach(line => {
    console.log(line);
    let isEdge = false; // it's a node till we encounter ":"
    let lineCurr = 0;
    let char = line[lineCurr];
    while (lineCurr < line.length) {
      //   console.log(char, lineCurr);
      if (validTokens.STRING.test(char)) {
        // console.log("got string ", char);
        let str = "";
        while (validTokens.STRING.test(char)) {
          str += char;
          lineCurr += 1;
          if (lineCurr === line.length) break;
          char = line[lineCurr];
        }
        // console.log("pushing string token ", str);

        tokens.push({
          type: isEdge ? "edge" : "node", // either node or edge
          value: str
        });
        continue;
      }

      if (char === validTokens.HYPHEN) {
        lineCurr += 1;
        char = line[lineCurr];
        if (char === validTokens.GT) {
          tokens.push({
            type: "arrow",
            value: "->"
          });
          lineCurr += 1;
          char = line[lineCurr];
          continue;
        } else {
          // throw error, invalid syntax
        }
      }

      if (char === validTokens.COLON) {
        isEdge = true;
        tokens.push({
          type: "colon",
          value: ":"
        });

        lineCurr += 1;
        char = line[lineCurr];
        continue;
      }

      if (char === validTokens.DESTROY) {
        tokens.push({
          type: "destroy",
          value: "*"
        });

        lineCurr += 1;
        char = line[lineCurr];
        continue;
      }

      //   lineCurr += 1;
      //   char = line[lineCurr];
    }
    // console.log(tokens);
  });
  //   console.log(tokens);

  console.log("");
  console.log("");
  console.log("Tokenizer");
  console.log(tokens);
  return tokens;
}

function newNode(type) {
  return {
    id: Math.random()
      .toString(36)
      .substring(7),
    type: type,
    value: null,
    left: "",
    right: "",
    dependsOn: ""
  };
}

// input: the list of tokens
// output: an AST
function parser(tokens) {
  const operations = {
    arrow: "createEdge",
    destroy: "destroy",
    node: "createNode"
  };
  let ast = [];

  // { left, right, type, value }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let lastRoot;
    // arrow: create Edge operation
    // asterisk: destroy operation
    // look for the first create edge
    // split create edge into sub operations: create nodes

    if (token.type === "arrow") {
      let node = newNode(operations.arrow);
      ast.push(node);
      // validate that the arrow is:
      // (1) accompanied by nodes at prev and next indexes to it
      // (2) accompanied by the label after a colon
      if (
        validateNodesAroundArrow(i, tokens) &&
        validateLabelAfterArrow(i, tokens)
      ) {
        let filteredNodes = filterNodesFromAst("node", tokens[i - 1].value);
        if (filteredNodes.length === 1) {
          node.left = filteredNodes[0].id;
        } else {
          let left = newNode(operations.node);
          left.value = tokens[i - 1].value;
          ast.push(left);
          node.left = left.id;
        }

        filteredNodes = filterNodesFromAst("node", tokens[i + 1].value);
        if (filteredNodes.length === 1) {
          node.right = filteredNodes[0].id;
        } else {
          let right = newNode(operations.node);
          right.value = tokens[i + 1].value;
          ast.push(right);
          node.right = right.id;
        }

        node.value = tokens[i + 3].value;

        // attach dependsOn
        if (lastRoot) {
          lastRoot.dependsOn = node.id;
        }
      } else {
        // throw error
      }
      lastRoot = node;
    }

    if (token.type === "destroy") {
      let node = newNode(operations.destroy);
      ast.push(node);
      // validate that the asterisk is followed by a valid node
      if (i + 1 < tokens.length && tokens[i + 1].type === "node") {
        // traverse the ast and ensure that it contains a node with this value
        const filteredNodes = filterNodesFromAst("node", tokens[i + 1].value);
        if (filteredNodes.length === 1) {
          node.left = filteredNodes[0].id;
          lastRoot.dependsOn = node.id;
        } else {
          // throw error
        }
      } else {
        // throw error
      }
      lastRoot = node;
    }
  }

  function validateNodesAroundArrow(i, tokens) {
    return (
      i - 1 >= 0 &&
      i + 1 < tokens.length &&
      tokens[i - 1].type === "node" &&
      tokens[i + 1].type === "node"
    );
  }

  function validateLabelAfterArrow(i, tokens) {
    return (
      i + 3 < tokens.length &&
      tokens[i + 2].type === "colon" &&
      tokens[i + 3].type === "edge"
    );
  }

  function filterNodesFromAst(type, value) {
    return ast.filter(node => {
      node.type === type && node.value === value;
    });
  }

  console.log("");
  console.log("");
  console.log("Parser");
  console.log(ast);
}

// input: the AST
// output: a html string
function generate() {}

// optional
// function transform()