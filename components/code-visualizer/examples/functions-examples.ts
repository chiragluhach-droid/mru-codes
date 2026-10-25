export type Language = "c" | "cpp" | "java" | "python" | "javascript";

interface FunctionCall {
  name: string;
  params: Record<string, any>;
  returnValue?: any;
  id: number;
}

interface Step {
  currentLine: number;
  description: string;
  variables: Record<string, any>;
  highlightLines: number[];
  output?: string;
  functionCalls: FunctionCall[];
  scope?: string;
}

let callIdCounter = 0;

export const functionsExamples = {
  basicFunction: {
    name: "Basic Function",
    complexity: {
      time: "O(1)",
      space: "O(1)",
      description: "Simple function call with parameters and return value. Time and space complexity is O(1)."
    },
    code: {
      c: `int add(int a, int b) {
    int sum = a + b;
    return sum;
}

int main() {
    int x = 5, y = 10;
    int result = add(x, y);
    printf("Sum: %d", result);
    return 0;
}`,
      cpp: `int add(int a, int b) {
    int sum = a + b;
    return sum;
}

int main() {
    int x = 5, y = 10;
    int result = add(x, y);
    cout << "Sum: " << result;
    return 0;
}`,
      java: `public static int add(int a, int b) {
    int sum = a + b;
    return sum;
}

public static void main(String[] args) {
    int x = 5, y = 10;
    int result = add(x, y);
    System.out.println("Sum: " + result);
}`,
      python: `def add(a, b):
    sum = a + b
    return sum

if __name__ == "__main__":
    x, y = 5, 10
    result = add(x, y)
    print(f"Sum: {result}")`,
      javascript: `function add(a, b) {
    const sum = a + b;
    return sum;
}

const x = 5, y = 10;
const result = add(x, y);
console.log(\`Sum: \${result}\`);`,
    },
    generateSteps: (value: number): Step[] => {
      const steps: Step[] = [];
      callIdCounter = 0;
      const x = value;
      const y = value + 5;

      steps.push({
        currentLine: 6,
        description: `Main: Initialize x = ${x}, y = ${y}`,
        variables: { x, y },
        highlightLines: [6],
        functionCalls: [],
        scope: "main",
      });

      steps.push({
        currentLine: 7,
        description: `Main: Calling add(${x}, ${y})`,
        variables: { x, y },
        highlightLines: [7],
        functionCalls: [],
        scope: "main",
      });

      const addCall: FunctionCall = {
        name: "add",
        params: { a: x, b: y },
        id: callIdCounter++,
      };

      steps.push({
        currentLine: 1,
        description: `Function add: Parameters received a = ${x}, b = ${y}`,
        variables: { a: x, b: y },
        highlightLines: [1],
        functionCalls: [addCall],
        scope: "add",
      });

      const sum = x + y;

      steps.push({
        currentLine: 2,
        description: `Function add: Calculate sum = ${x} + ${y} = ${sum}`,
        variables: { a: x, b: y, sum },
        highlightLines: [2],
        functionCalls: [addCall],
        scope: "add",
      });

      addCall.returnValue = sum;

      steps.push({
        currentLine: 3,
        description: `Function add: Returning ${sum} to caller`,
        variables: { a: x, b: y, sum },
        highlightLines: [3],
        functionCalls: [addCall],
        scope: "add",
      });

      steps.push({
        currentLine: 7,
        description: `Main: Received ${sum} from add(). Assigned to result`,
        variables: { x, y, result: sum },
        highlightLines: [7],
        functionCalls: [],
        scope: "main",
      });

      steps.push({
        currentLine: 8,
        description: `Main: Print "Sum: ${sum}"`,
        variables: { x, y, result: sum },
        highlightLines: [8],
        functionCalls: [],
        scope: "main",
        output: `Sum: ${sum}`,
      });

      return steps;
    },
  },

  voidFunction: {
    name: "Void Function",
    complexity: {
      time: "O(1)",
      space: "O(1)",
      description: "Function without return value. Performs action but doesn't return data. Time and space complexity is O(1)."
    },
    code: {
      c: `void greet(char name[]) {
    printf("Hello, %s!\\n", name);
}

int main() {
    greet("Alice");
    greet("Bob");
    return 0;
}`,
      cpp: `void greet(string name) {
    cout << "Hello, " << name << "!" << endl;
}

int main() {
    greet("Alice");
    greet("Bob");
    return 0;
}`,
      java: `public static void greet(String name) {
    System.out.println("Hello, " + name + "!");
}

public static void main(String[] args) {
    greet("Alice");
    greet("Bob");
}`,
      python: `def greet(name):
    print(f"Hello, {name}!")

if __name__ == "__main__":
    greet("Alice")
    greet("Bob")`,
      javascript: `function greet(name) {
    console.log(\`Hello, \${name}!\`);
}

greet("Alice");
greet("Bob");`,
    },
    generateSteps: (value: number): Step[] => {
      const steps: Step[] = [];
      callIdCounter = 0;
      const names = ["Alice", "Bob", "Charlie"];
      const selectedNames = names.slice(0, Math.min(value, 3));

      selectedNames.forEach((name, index) => {
        steps.push({
          currentLine: 5 + index,
          description: `Main: Calling greet("${name}")`,
          variables: {},
          highlightLines: [5 + index],
          functionCalls: [],
          scope: "main",
        });

        const greetCall: FunctionCall = {
          name: "greet",
          params: { name },
          id: callIdCounter++,
        };

        steps.push({
          currentLine: 1,
          description: `Function greet: Parameter received name = "${name}"`,
          variables: { name },
          highlightLines: [1],
          functionCalls: [greetCall],
          scope: "greet",
        });

        steps.push({
          currentLine: 2,
          description: `Function greet: Print "Hello, ${name}!"`,
          variables: { name },
          highlightLines: [2],
          functionCalls: [greetCall],
          scope: "greet",
          output: `Hello, ${name}!`,
        });

        steps.push({
          currentLine: 5 + index,
          description: `Main: greet() completed (void return)`,
          variables: {},
          highlightLines: [5 + index],
          functionCalls: [],
          scope: "main",
        });
      });

      steps.push({
        currentLine: 5 + selectedNames.length,
        description: `✓ All function calls complete`,
        variables: {},
        highlightLines: [5 + selectedNames.length],
        functionCalls: [],
        scope: "main",
        output: selectedNames.map(n => `Hello, ${n}!`).join("\n"),
      });

      return steps;
    },
  },

  passByValue: {
    name: "Pass by Value",
    complexity: {
      time: "O(1)",
      space: "O(1)",
      description: "Function receives copy of arguments. Changes inside function don't affect original variables. Time and space complexity is O(1)."
    },
    code: {
      c: `void modify(int x) {
    x = x * 2;
    printf("Inside function: %d\\n", x);
}

int main() {
    int num = 10;
    printf("Before: %d\\n", num);
    modify(num);
    printf("After: %d\\n", num);
    return 0;
}`,
      cpp: `void modify(int x) {
    x = x * 2;
    cout << "Inside function: " << x << endl;
}

int main() {
    int num = 10;
    cout << "Before: " << num << endl;
    modify(num);
    cout << "After: " << num << endl;
    return 0;
}`,
      java: `public static void modify(int x) {
    x = x * 2;
    System.out.println("Inside function: " + x);
}

public static void main(String[] args) {
    int num = 10;
    System.out.println("Before: " + num);
    modify(num);
    System.out.println("After: " + num);
}`,
      python: `def modify(x):
    x = x * 2
    print(f"Inside function: {x}")

if __name__ == "__main__":
    num = 10
    print(f"Before: {num}")
    modify(num)
    print(f"After: {num}")`,
      javascript: `function modify(x) {
    x = x * 2;
    console.log(\`Inside function: \${x}\`);
}

let num = 10;
console.log(\`Before: \${num}\`);
modify(num);
console.log(\`After: \${num}\`);`,
    },
    generateSteps: (value: number): Step[] => {
      const steps: Step[] = [];
      callIdCounter = 0;
      const num = value;
      const outputs: string[] = [];

      steps.push({
        currentLine: 7,
        description: `Main: Initialize num = ${num}`,
        variables: { num },
        highlightLines: [7],
        functionCalls: [],
        scope: "main",
      });

      outputs.push(`Before: ${num}`);
      steps.push({
        currentLine: 8,
        description: `Main: Print "Before: ${num}"`,
        variables: { num },
        highlightLines: [8],
        functionCalls: [],
        scope: "main",
        output: outputs.join("\n"),
      });

      steps.push({
        currentLine: 9,
        description: `Main: Calling modify(${num}) - Passing COPY of num`,
        variables: { num },
        highlightLines: [9],
        functionCalls: [],
        scope: "main",
      });

      const modifyCall: FunctionCall = {
        name: "modify",
        params: { x: num },
        id: callIdCounter++,
      };

      steps.push({
        currentLine: 1,
        description: `Function modify: Received x = ${num} (copy of num)`,
        variables: { x: num },
        highlightLines: [1],
        functionCalls: [modifyCall],
        scope: "modify",
      });

      const modifiedX = num * 2;

      steps.push({
        currentLine: 2,
        description: `Function modify: x = x * 2 = ${modifiedX} (only local copy changed)`,
        variables: { x: modifiedX },
        highlightLines: [2],
        functionCalls: [modifyCall],
        scope: "modify",
      });

      outputs.push(`Inside function: ${modifiedX}`);
      steps.push({
        currentLine: 3,
        description: `Function modify: Print "Inside function: ${modifiedX}"`,
        variables: { x: modifiedX },
        highlightLines: [3],
        functionCalls: [modifyCall],
        scope: "modify",
        output: outputs.join("\n"),
      });

      steps.push({
        currentLine: 9,
        description: `Main: Function returned. Original num is UNCHANGED = ${num}`,
        variables: { num },
        highlightLines: [9],
        functionCalls: [],
        scope: "main",
      });

      outputs.push(`After: ${num}`);
      steps.push({
        currentLine: 10,
        description: `Main: Print "After: ${num}" - Original value unchanged!`,
        variables: { num },
        highlightLines: [10],
        functionCalls: [],
        scope: "main",
        output: outputs.join("\n"),
      });

      return steps;
    },
  },

  multipleParams: {
    name: "Multiple Parameters",
    complexity: {
      time: "O(1)",
      space: "O(1)",
      description: "Function with multiple parameters performing calculations. Time and space complexity is O(1)."
    },
    code: {
      c: `int calculate(int a, int b, int c) {
    int result = (a + b) * c;
    return result;
}

int main() {
    int x = 5, y = 3, z = 2;
    int answer = calculate(x, y, z);
    printf("Result: %d", answer);
    return 0;
}`,
      cpp: `int calculate(int a, int b, int c) {
    int result = (a + b) * c;
    return result;
}

int main() {
    int x = 5, y = 3, z = 2;
    int answer = calculate(x, y, z);
    cout << "Result: " << answer;
    return 0;
}`,
      java: `public static int calculate(int a, int b, int c) {
    int result = (a + b) * c;
    return result;
}

public static void main(String[] args) {
    int x = 5, y = 3, z = 2;
    int answer = calculate(x, y, z);
    System.out.println("Result: " + answer);
}`,
      python: `def calculate(a, b, c):
    result = (a + b) * c
    return result

if __name__ == "__main__":
    x, y, z = 5, 3, 2
    answer = calculate(x, y, z)
    print(f"Result: {answer}")`,
      javascript: `function calculate(a, b, c) {
    const result = (a + b) * c;
    return result;
}

const x = 5, y = 3, z = 2;
const answer = calculate(x, y, z);
console.log(\`Result: \${answer}\`);`,
    },
    generateSteps: (value: number): Step[] => {
      const steps: Step[] = [];
      callIdCounter = 0;
      const x = value;
      const y = value + 2;
      const z = 2;

      steps.push({
        currentLine: 6,
        description: `Main: Initialize x = ${x}, y = ${y}, z = ${z}`,
        variables: { x, y, z },
        highlightLines: [6],
        functionCalls: [],
        scope: "main",
      });

      steps.push({
        currentLine: 7,
        description: `Main: Calling calculate(${x}, ${y}, ${z})`,
        variables: { x, y, z },
        highlightLines: [7],
        functionCalls: [],
        scope: "main",
      });

      const calcCall: FunctionCall = {
        name: "calculate",
        params: { a: x, b: y, c: z },
        id: callIdCounter++,
      };

      steps.push({
        currentLine: 1,
        description: `Function calculate: Received a = ${x}, b = ${y}, c = ${z}`,
        variables: { a: x, b: y, c: z },
        highlightLines: [1],
        functionCalls: [calcCall],
        scope: "calculate",
      });

      const result = (x + y) * z;

      steps.push({
        currentLine: 2,
        description: `Function calculate: result = (${x} + ${y}) * ${z} = ${x + y} * ${z} = ${result}`,
        variables: { a: x, b: y, c: z, result },
        highlightLines: [2],
        functionCalls: [calcCall],
        scope: "calculate",
      });

      calcCall.returnValue = result;

      steps.push({
        currentLine: 3,
        description: `Function calculate: Returning ${result}`,
        variables: { a: x, b: y, c: z, result },
        highlightLines: [3],
        functionCalls: [calcCall],
        scope: "calculate",
      });

      steps.push({
        currentLine: 7,
        description: `Main: Received ${result}, assigned to answer`,
        variables: { x, y, z, answer: result },
        highlightLines: [7],
        functionCalls: [],
        scope: "main",
      });

      steps.push({
        currentLine: 8,
        description: `Main: Print "Result: ${result}"`,
        variables: { x, y, z, answer: result },
        highlightLines: [8],
        functionCalls: [],
        scope: "main",
        output: `Result: ${result}`,
      });

      return steps;
    },
  },

  returnTypes: {
    name: "Different Return Types",
    complexity: {
      time: "O(1)",
      space: "O(1)",
      description: "Functions can return different data types. Time and space complexity is O(1)."
    },
    code: {
      c: `int square(int n) {
    return n * n;
}

float divide(int a, int b) {
    return (float)a / b;
}

int main() {
    int num = 5;
    int sq = square(num);
    float div = divide(10, 3);
    printf("Square: %d, Division: %.2f", sq, div);
    return 0;
}`,
      cpp: `int square(int n) {
    return n * n;
}

double divide(int a, int b) {
    return (double)a / b;
}

int main() {
    int num = 5;
    int sq = square(num);
    double div = divide(10, 3);
    cout << "Square: " << sq << ", Division: " << div;
    return 0;
}`,
      java: `public static int square(int n) {
    return n * n;
}

public static double divide(int a, int b) {
    return (double)a / b;
}

public static void main(String[] args) {
    int num = 5;
    int sq = square(num);
    double div = divide(10, 3);
    System.out.println("Square: " + sq + ", Division: " + div);
}`,
      python: `def square(n):
    return n * n

def divide(a, b):
    return a / b

if __name__ == "__main__":
    num = 5
    sq = square(num)
    div = divide(10, 3)
    print(f"Square: {sq}, Division: {div:.2f}")`,
      javascript: `function square(n) {
    return n * n;
}

function divide(a, b) {
    return a / b;
}

const num = 5;
const sq = square(num);
const div = divide(10, 3);
console.log(\`Square: \${sq}, Division: \${div.toFixed(2)}\`);`,
    },
    generateSteps: (value: number): Step[] => {
      const steps: Step[] = [];
      callIdCounter = 0;
      const num = value;

      steps.push({
        currentLine: 10,
        description: `Main: Initialize num = ${num}`,
        variables: { num },
        highlightLines: [10],
        functionCalls: [],
        scope: "main",
      });

      // Square function
      steps.push({
        currentLine: 11,
        description: `Main: Calling square(${num})`,
        variables: { num },
        highlightLines: [11],
        functionCalls: [],
        scope: "main",
      });

      const squareCall: FunctionCall = {
        name: "square",
        params: { n: num },
        id: callIdCounter++,
      };

      const sq = num * num;

      steps.push({
        currentLine: 2,
        description: `Function square: Calculate ${num} * ${num} = ${sq}`,
        variables: { n: num },
        highlightLines: [2],
        functionCalls: [squareCall],
        scope: "square",
      });

      squareCall.returnValue = sq;

      steps.push({
        currentLine: 2,
        description: `Function square: Returning ${sq} (int type)`,
        variables: { n: num },
        highlightLines: [2],
        functionCalls: [squareCall],
        scope: "square",
      });

      steps.push({
        currentLine: 11,
        description: `Main: Received ${sq}, assigned to sq (int)`,
        variables: { num, sq },
        highlightLines: [11],
        functionCalls: [],
        scope: "main",
      });

      // Divide function
      steps.push({
        currentLine: 12,
        description: `Main: Calling divide(10, 3)`,
        variables: { num, sq },
        highlightLines: [12],
        functionCalls: [],
        scope: "main",
      });

      const divideCall: FunctionCall = {
        name: "divide",
        params: { a: 10, b: 3 },
        id: callIdCounter++,
      };

      const div = 10 / 3;

      steps.push({
        currentLine: 6,
        description: `Function divide: Calculate 10 / 3 = ${div.toFixed(2)}`,
        variables: { a: 10, b: 3 },
        highlightLines: [6],
        functionCalls: [divideCall],
        scope: "divide",
      });

      divideCall.returnValue = div.toFixed(2);

      steps.push({
        currentLine: 6,
        description: `Function divide: Returning ${div.toFixed(2)} (float/double type)`,
        variables: { a: 10, b: 3 },
        highlightLines: [6],
        functionCalls: [divideCall],
        scope: "divide",
      });

      steps.push({
        currentLine: 12,
        description: `Main: Received ${div.toFixed(2)}, assigned to div (float/double)`,
        variables: { num, sq, div: div.toFixed(2) },
        highlightLines: [12],
        functionCalls: [],
        scope: "main",
      });

      steps.push({
        currentLine: 13,
        description: `Main: Print both results`,
        variables: { num, sq, div: div.toFixed(2) },
        highlightLines: [13],
        functionCalls: [],
        scope: "main",
        output: `Square: ${sq}, Division: ${div.toFixed(2)}`,
      });

      return steps;
    },
  },
};
