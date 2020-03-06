const code = "A->B:N \n *A";
// const code = "A->B:E \n B->C:F";
// const code = "A->B:E \n B->C:F\n*A";
// const code = "A->B:E \n *B\nC->D:F";

const syntacticallyInvalidCode = "A|B";
const logicallyInvalidCode = "A->B:N\n*X";

try {
  //   parse(tokenize(code));
  parse(tokenize(syntacticallyInvalidCode));
  // parse(tokenize(logicallyInvalidCode));
} catch (error) {
  console.log("");
  console.log("!!!!!ERROR OCCURED!!!!");
  console.log("");
  console.error(error);
}

// input: the whole code in our language to be read as a string
// output: a list of tokens
function tokenize(code) {
  const validTokens = {
    COLON: ":",
    HYPHEN: "-",
    GT: ">",
    STRING: /[a-z]/i,
    DESTROY: "*"
  };

  const lines = code.split("\n");
  let tokens = [];

  console.log("====INPUT CODE====");
  console.log("");
  lines.forEach((readLine, index) => {
    const linum = index + 1;
    let line = readLine.trim();
    console.log(line);
    let isEdge = false; // it's a node till we encounter ":"
    let lineCurr = 0;
    let char = line[lineCurr];

    while (lineCurr < line.length) {
      if (validTokens.STRING.test(char)) {
        let str = "";
        while (validTokens.STRING.test(char)) {
          str += char;
          lineCurr += 1;
          if (lineCurr === line.length) break;
          char = line[lineCurr];
        }

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
          const errorMessage = !char
            ? `Unexpected end of line ${linum} : ${line}`
            : `Unexpected token ${
                line[lineCurr - 1]
              }${char} at line ${linum} : ${line}`;
          // throw error, invalid syntax
          throw new SyntaxError(errorMessage);
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

      throw new SyntaxError(
        `Unexpected token: ${char} at line ${linum}: ${line}`
      );
    }
  });

  //   console.log("");
  //   console.log("");
  //   console.log("Tokenizer");
  //   console.log(tokens);
  return tokens;
}

// input: the list of tokens
// output: an AST
function parse(tokens) {
  const operations = {
    arrow: "createEdge",
    destroy: "destroy",
    node: "createNode"
  };
  let ast = [];
  let lastRoot;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
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
        let filteredNodes = filterNodesFromAst(
          ast,
          operations.node,
          tokens[i - 1].value
        );
        if (filteredNodes.length === 1) {
          node.left = filteredNodes[0].id;
        } else {
          let left = newNode(operations.node);
          left.value = tokens[i - 1].value;
          ast.push(left);
          node.left = left.id;
        }

        filteredNodes = filterNodesFromAst(
          ast,
          operations.node,
          tokens[i + 1].value
        );
        if (filteredNodes.length === 1) {
          node.right = filteredNodes[0].id;
        } else {
          let right = newNode(operations.node);
          right.value = tokens[i + 1].value;
          ast.push(right);
          node.right = right.id;
        }

        node.value = tokens[i + 3].value;

        if (lastRoot) {
          node.next = lastRoot.id;
        }
      } else {
        // throw error
        let errorMessage;
        if (!validateNodesAroundArrow(i, tokens)) {
          errorMessage = `Invalid or no node specified to create edge`;
        } else if (!validateLabelAfterArrow(i, tokens)) {
          errorMessage = `Invalid or no label specified`;
        }
        throw new Error(errorMessage);
      }
      lastRoot = node;
    }

    if (token.type === "destroy") {
      let node = newNode(operations.destroy);
      ast.push(node);
      // validate that the asterisk is followed by a valid node
      if (validateNodeToDestroy(i, tokens)) {
        // traverse the ast and ensure that it contains a node with this value
        const filteredNodes = filterNodesFromAst(
          ast,
          operations.node,
          tokens[i + 1].value
        );
        if (filteredNodes.length === 1) {
          node.left = filteredNodes[0].id;
          node.next = lastRoot.id;
        } else {
          // throw error
          throw new Error(
            `Can't destroy node ${tokens[i + 1].value} before creation`
          );
        }
      } else {
        // throw error
        throw new Error(`Invalid usage of *`);
      }
      lastRoot = node;
    }
  }
  lastRoot.root = true;

  function validateNodeToDestroy(i, tokens) {
    return i + 1 < tokens.length && tokens[i + 1].type === "node";
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
      next: ""
    };
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

  function filterNodesFromAst(ast, type, value) {
    // console.log("");
    // console.log(type);
    // console.log(value);
    // ast.forEach(astNode => {
    //   console.log(astNode);
    // });
    return ast.filter(astNode => {
      return astNode.type === type && astNode.value === value;
    });
  }

  console.log("");
  console.log("====AST CREATED====");
  console.log("");
  console.log(ast);
}

// input: the AST
// output: a html string
function generate() {}

// optional
// function transform()
