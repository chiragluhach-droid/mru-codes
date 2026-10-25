export type Language = "c" | "cpp" | "java" | "python" | "javascript";

interface Step {
  variables: Record<string, any>;
  currentLine: number;
  description: string;
  highlightLines: number[];
  output?: string;
  loopIteration?: number;
}

export const loopExamples = {
  forLoop: {
    name: "For Loop - Sum",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      description: "Time complexity is O(n) as the loop runs n times. Space complexity is O(1) as we only use a fixed amount of variables."
    },
    code: {
      c: `int main() {\n    int n = 5;\n    int sum = 0;\n    \n    for (int i = 1; i <= n; i++) {\n        sum += i;\n    }\n    \n    printf("Sum: %d", sum);\n    return 0;\n}`,
      cpp: `int main() {\n    int n = 5;\n    int sum = 0;\n    \n    for (int i = 1; i <= n; i++) {\n        sum += i;\n    }\n    \n    cout << "Sum: " << sum;\n    return 0;\n}`,
      java: `public static void main(String[] args) {\n    int n = 5;\n    int sum = 0;\n    \n    for (int i = 1; i <= n; i++) {\n        sum += i;\n    }\n    \n    System.out.println("Sum: " + sum);\n}`,
      python: `n = 5\nsum = 0\n\nfor i in range(1, n + 1):\n    sum += i\n\nprint(f"Sum: {sum}")`,
      javascript: `const n = 5;\nlet sum = 0;\n\nfor (let i = 1; i <= n; i++) {\n    sum += i;\n}\n\nconsole.log(\`Sum: \${sum}\`);`,
    },
    generateSteps: (n: number): Step[] => {
      const steps: Step[] = [];
      let sum = 0;
      let outputs: string[] = [];

      steps.push({
        variables: { n, sum: 0 },
        currentLine: 2,
        description: `Initialize n = ${n}`,
        highlightLines: [2],
      });

      steps.push({
        variables: { n, sum: 0, i: 1 },
        currentLine: 5,
        description: `Start for loop: i = 1`,
        highlightLines: [5],
        loopIteration: 0,
      });

      for (let i = 1; i <= n; i++) {
        steps.push({
          variables: { n, sum, i },
          currentLine: 5,
          description: `Check condition: i (${i}) <= n (${n})? Yes`,
          highlightLines: [5],
          loopIteration: i,
        });

        sum += i;
        outputs.push(`i = ${i}, sum = ${sum}`);

        steps.push({
          variables: { n, sum, i },
          currentLine: 6,
          description: `Execute: sum += i → sum = ${sum - i} + ${i} = ${sum}`,
          highlightLines: [6],
          loopIteration: i,
          output: outputs.join("\\n"),
        });

        if (i < n) {
          steps.push({
            variables: { n, sum, i: i + 1 },
            currentLine: 5,
            description: `Increment: i++ → i = ${i + 1}`,
            highlightLines: [5],
            loopIteration: i,
          });
        }
      }

      steps.push({
        variables: { n, sum, i: n + 1 },
        currentLine: 5,
        description: `Check condition: i (${n + 1}) <= n (${n})? No - Exit loop`,
        highlightLines: [5],
      });

      steps.push({
        variables: { n, sum },
        currentLine: 9,
        description: `✓ Loop complete. Final sum = ${sum}`,
        highlightLines: [9],
        output: `Sum: ${sum}`,
      });

      return steps;
    },
  },
  whileLoop: {
    name: "While Loop",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      description: "Time complexity is O(n) for n iterations. Space complexity is O(1) as we use constant extra space."
    },
    code: {
      c: `int main() {\n    int n = 5;\n    int i = 1;\n    int product = 1;\n    \n    while (i <= n) {\n        product *= i;\n        i++;\n    }\n    \n    printf("Product: %d", product);\n    return 0;\n}`,
      cpp: `int main() {\n    int n = 5;\n    int i = 1;\n    int product = 1;\n    \n    while (i <= n) {\n        product *= i;\n        i++;\n    }\n    \n    cout << "Product: " << product;\n    return 0;\n}`,
      java: `public static void main(String[] args) {\n    int n = 5;\n    int i = 1;\n    int product = 1;\n    \n    while (i <= n) {\n        product *= i;\n        i++;\n    }\n    \n    System.out.println("Product: " + product);\n}`,
      python: `n = 5\ni = 1\nproduct = 1\n\nwhile i <= n:\n    product *= i\n    i += 1\n\nprint(f"Product: {product}")`,
      javascript: `const n = 5;\nlet i = 1;\nlet product = 1;\n\nwhile (i <= n) {\n    product *= i;\n    i++;\n}\n\nconsole.log(\`Product: \${product}\`);`,
    },
    generateSteps: (n: number): Step[] => {
      const steps: Step[] = [];
      let i = 1;
      let product = 1;

      steps.push({
        variables: { n, i: 1, product: 1 },
        currentLine: 3,
        description: `Initialize i = 1, product = 1`,
        highlightLines: [3, 4],
      });

      let iteration = 1;
      while (i <= n) {
        steps.push({
          variables: { n, i, product },
          currentLine: 6,
          description: `Check condition: i (${i}) <= n (${n})? Yes`,
          highlightLines: [6],
          loopIteration: iteration,
        });

        product *= i;

        steps.push({
          variables: { n, i, product },
          currentLine: 7,
          description: `Multiply: product = ${product / i} * ${i} = ${product}`,
          highlightLines: [7],
          loopIteration: iteration,
        });

        i++;

        steps.push({
          variables: { n, i, product },
          currentLine: 8,
          description: `Increment: i = ${i}`,
          highlightLines: [8],
          loopIteration: iteration,
        });

        iteration++;
      }

      steps.push({
        variables: { n, i, product },
        currentLine: 6,
        description: `Check condition: i (${i}) <= n (${n})? No - Exit loop`,
        highlightLines: [6],
      });

      steps.push({
        variables: { n, i, product },
        currentLine: 11,
        description: `✓ Loop complete. Product = ${product}`,
        highlightLines: [11],
        output: `Product: ${product}`,
      });

      return steps;
    },
  },
  nestedLoop: {
    name: "Nested Loop - Pattern",
    complexity: {
      time: "O(n²)",
      space: "O(1)",
      description: "Time complexity is O(n²) as the inner loop runs n times for each of the n iterations of the outer loop. Space complexity is O(1)."
    },
    code: {
      c: `int main() {\n    int n = 4;\n    \n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= i; j++) {\n            printf("* ");\n        }\n        printf("\\n");\n    }\n    return 0;\n}`,
      cpp: `int main() {\n    int n = 4;\n    \n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= i; j++) {\n            cout << "* ";\n        }\n        cout << endl;\n    }\n    return 0;\n}`,
      java: `public static void main(String[] args) {\n    int n = 4;\n    \n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= i; j++) {\n            System.out.print("* ");\n        }\n        System.out.println();\n    }\n}`,
      python: `n = 4\n\nfor i in range(1, n + 1):\n    for j in range(1, i + 1):\n        print("* ", end="")\n    print()`,
      javascript: `const n = 4;\n\nfor (let i = 1; i <= n; i++) {\n    let row = "";\n    for (let j = 1; j <= i; j++) {\n        row += "* ";\n    }\n    console.log(row);\n}`,
    },
    generateSteps: (n: number): Step[] => {
      const steps: Step[] = [];
      const pattern: string[] = [];

      if (n > 6) n = 6;

      steps.push({
        variables: { n },
        currentLine: 2,
        description: `Initialize n = ${n}`,
        highlightLines: [2],
      });

      for (let i = 1; i <= n; i++) {
        steps.push({
          variables: { n, i },
          currentLine: 4,
          description: `Outer loop: i = ${i}`,
          highlightLines: [4],
        });

        let row = "";
        for (let j = 1; j <= i; j++) {
          steps.push({
            variables: { n, i, j },
            currentLine: 5,
            description: `Inner loop: j = ${j}, printing star`,
            highlightLines: [5, 6],
          });
          row += "* ";
        }

        pattern.push(row.trim());

        steps.push({
          variables: { n, i },
          currentLine: 8,
          description: `Row ${i} complete: "${row.trim()}"`,
          highlightLines: [8],
          output: pattern.join("\\n"),
        });
      }

      steps.push({
        variables: { n },
        currentLine: 10,
        description: `✓ Pattern complete!`,
        highlightLines: [10],
        output: pattern.join("\\n"),
      });

      return steps;
    },
  },
  doWhileLoop: {
    name: "Do-While Loop",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      description: "Time complexity is O(n) for n iterations. Space complexity is O(1). Do-While loops execute at least once before checking the condition."
    },
    code: {
      c: `int main() {\n    int n = 5;\n    int i = 1;\n    \n    do {\n        printf("%d ", i);\n        i++;\n    } while (i <= n);\n    \n    return 0;\n}`,
      cpp: `int main() {\n    int n = 5;\n    int i = 1;\n    \n    do {\n        cout << i << " ";\n        i++;\n    } while (i <= n);\n    \n    return 0;\n}`,
      java: `public static void main(String[] args) {\n    int n = 5;\n    int i = 1;\n    \n    do {\n        System.out.print(i + " ");\n        i++;\n    } while (i <= n);\n}`,
      python: `n = 5\ni = 1\n\nwhile True:\n    print(i, end=" ")\n    i += 1\n    if i > n:\n        break`,
      javascript: `const n = 5;\nlet i = 1;\n\ndo {\n    console.log(i);\n    i++;\n} while (i <= n);`,
    },
    generateSteps: (n: number): Step[] => {
      const steps: Step[] = [];
      let i = 1;
      const outputs: number[] = [];

      steps.push({
        variables: { n, i: 1 },
        currentLine: 3,
        description: `Initialize i = 1`,
        highlightLines: [3],
      });

      let iteration = 1;
      do {
        steps.push({
          variables: { n, i },
          currentLine: 5,
          description: `Do-while: Execute body (iteration ${iteration})`,
          highlightLines: [5],
          loopIteration: iteration,
        });

        outputs.push(i);

        steps.push({
          variables: { n, i },
          currentLine: 6,
          description: `Print: ${i}`,
          highlightLines: [6],
          output: outputs.join(" "),
          loopIteration: iteration,
        });

        i++;

        steps.push({
          variables: { n, i },
          currentLine: 7,
          description: `Increment: i = ${i}`,
          highlightLines: [7],
          loopIteration: iteration,
        });

        steps.push({
          variables: { n, i },
          currentLine: 8,
          description: `Check condition: i (${i}) <= n (${n})? ${i <= n ? "Yes - Continue" : "No - Exit"}`,
          highlightLines: [8],
          loopIteration: iteration,
        });

        iteration++;
      } while (i <= n);

      steps.push({
        variables: { n, i },
        currentLine: 10,
        description: `✓ Loop complete. Printed: ${outputs.join(" ")}`,
        highlightLines: [10],
        output: outputs.join(" "),
      });

      return steps;
    },
  },
};
