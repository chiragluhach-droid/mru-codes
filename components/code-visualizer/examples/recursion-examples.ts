export type Language = "c" | "cpp" | "java" | "python" | "javascript";

interface CallStackFrame {
  functionName: string;
  params: Record<string, any>;
  returnValue?: any;
  localVars?: Record<string, any>;
  id: number;
}

interface Step {
  callStack: CallStackFrame[];
  currentLine: number;
  description: string;
  variables: Record<string, any>;
  highlightLines: number[];
  output?: string;
}

let frameIdCounter = 0;

export const recursionExamples = {
  factorial: {
    name: "Factorial",
    code: {
      c: `int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    int result = n * factorial(n - 1);
    return result;
}

int main() {
    int n = 5;
    int answer = factorial(n);
    printf("Factorial of %d is %d", n, answer);
    return 0;
}`,
      cpp: `int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    int result = n * factorial(n - 1);
    return result;
}

int main() {
    int n = 5;
    int answer = factorial(n);
    cout << "Factorial of " << n << " is " << answer;
    return 0;
}`,
      java: `public int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    int result = n * factorial(n - 1);
    return result;
}

public static void main(String[] args) {
    int n = 5;
    int answer = factorial(n);
    System.out.println("Factorial of " + n + " is " + answer);
}`,
      python: `def factorial(n):
    if n <= 1:
        return 1
    result = n * factorial(n - 1)
    return result

if __name__ == "__main__":
    n = 5
    answer = factorial(n)
    print(f"Factorial of {n} is {answer}")`,
      javascript: `function factorial(n) {
    if (n <= 1) {
        return 1;
    }
    const result = n * factorial(n - 1);
    return result;
}

const n = 5;
const answer = factorial(n);
console.log(\`Factorial of \${n} is \${answer}\`);`,
    },
    generateSteps: (n: number): Step[] => {
      const steps: Step[] = [];
      frameIdCounter = 0;
      
      function factorialRecursive(value: number, stack: CallStackFrame[]): number {
        const frameId = frameIdCounter++;
        const frame: CallStackFrame = {
          functionName: "factorial",
          params: { n: value },
          id: frameId,
        };
        
        stack.push(frame);
        steps.push({
          callStack: [...stack],
          currentLine: 1,
          description: `Calling factorial(${value})`,
          variables: {},
          highlightLines: [1],
        });

        steps.push({
          callStack: [...stack],
          currentLine: 2,
          description: `Checking if ${value} <= 1`,
          variables: {},
          highlightLines: [2],
        });

        if (value <= 1) {
          frame.returnValue = 1;
          steps.push({
            callStack: [...stack],
            currentLine: 3,
            description: `Base case reached! Returning 1`,
            variables: {},
            highlightLines: [3],
          });
          stack.pop();
          return 1;
        }

        steps.push({
          callStack: [...stack],
          currentLine: 5,
          description: `Need to calculate factorial(${value - 1}) first`,
          variables: {},
          highlightLines: [5],
        });

        const recursiveResult = factorialRecursive(value - 1, stack);
        
        frame.localVars = { result: value * recursiveResult };
        steps.push({
          callStack: [...stack],
          currentLine: 5,
          description: `Received ${recursiveResult} from factorial(${value - 1}). Computing ${value} * ${recursiveResult} = ${value * recursiveResult}`,
          variables: {},
          highlightLines: [5],
        });

        frame.returnValue = value * recursiveResult;
        steps.push({
          callStack: [...stack],
          currentLine: 6,
          description: `Returning ${value * recursiveResult} to caller`,
          variables: {},
          highlightLines: [6],
        });

        stack.pop();
        return value * recursiveResult;
      }

      const stack: CallStackFrame[] = [];
      const result = factorialRecursive(n, stack);
      
      steps.push({
        callStack: [],
        currentLine: 10,
        description: `✓ Final result: factorial(${n}) = ${result}`,
        variables: { answer: result },
        highlightLines: [10],
        output: `Factorial of ${n} is ${result}`,
      });

      return steps;
    },
  },
  fibonacci: {
    name: "Fibonacci",
    code: {
      c: `int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    int fib1 = fibonacci(n - 1);
    int fib2 = fibonacci(n - 2);
    return fib1 + fib2;
}

int main() {
    int n = 5;
    int answer = fibonacci(n);
    printf("Fibonacci(%d) = %d", n, answer);
    return 0;
}`,
      cpp: `int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    int fib1 = fibonacci(n - 1);
    int fib2 = fibonacci(n - 2);
    return fib1 + fib2;
}

int main() {
    int n = 5;
    int answer = fibonacci(n);
    cout << "Fibonacci(" << n << ") = " << answer;
    return 0;
}`,
      java: `public int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    int fib1 = fibonacci(n - 1);
    int fib2 = fibonacci(n - 2);
    return fib1 + fib2;
}

public static void main(String[] args) {
    int n = 5;
    int answer = fibonacci(n);
    System.out.println("Fibonacci(" + n + ") = " + answer);
}`,
      python: `def fibonacci(n):
    if n <= 1:
        return n
    fib1 = fibonacci(n - 1)
    fib2 = fibonacci(n - 2)
    return fib1 + fib2

if __name__ == "__main__":
    n = 5
    answer = fibonacci(n)
    print(f"Fibonacci({n}) = {answer}")`,
      javascript: `function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    const fib1 = fibonacci(n - 1);
    const fib2 = fibonacci(n - 2);
    return fib1 + fib2;
}

const n = 5;
const answer = fibonacci(n);
console.log(\`Fibonacci(\${n}) = \${answer}\`);`,
    },
    generateSteps: (n: number): Step[] => {
      const steps: Step[] = [];
      frameIdCounter = 0;
      let callCount = 0;
      const maxCalls = 50;

      function fibRecursive(value: number, stack: CallStackFrame[]): number {
        if (callCount++ > maxCalls) return 0;
        
        const frameId = frameIdCounter++;
        const frame: CallStackFrame = {
          functionName: "fibonacci",
          params: { n: value },
          id: frameId,
        };
        
        stack.push(frame);
        steps.push({
          callStack: [...stack],
          currentLine: 1,
          description: `Calling fibonacci(${value})`,
          variables: {},
          highlightLines: [1],
        });

        steps.push({
          callStack: [...stack],
          currentLine: 2,
          description: `Checking if ${value} <= 1`,
          variables: {},
          highlightLines: [2],
        });

        if (value <= 1) {
          frame.returnValue = value;
          steps.push({
            callStack: [...stack],
            currentLine: 3,
            description: `Base case! Returning ${value}`,
            variables: {},
            highlightLines: [3],
          });
          stack.pop();
          return value;
        }

        steps.push({
          callStack: [...stack],
          currentLine: 5,
          description: `Calling fibonacci(${value - 1})`,
          variables: {},
          highlightLines: [5],
        });

        const fib1 = fibRecursive(value - 1, stack);
        
        frame.localVars = { fib1 };
        steps.push({
          callStack: [...stack],
          currentLine: 6,
          description: `Got ${fib1} from fibonacci(${value - 1}). Now calling fibonacci(${value - 2})`,
          variables: {},
          highlightLines: [6],
        });

        const fib2 = fibRecursive(value - 2, stack);
        
        frame.localVars = { fib1, fib2 };
        const result = fib1 + fib2;
        frame.returnValue = result;
        
        steps.push({
          callStack: [...stack],
          currentLine: 7,
          description: `Got ${fib2} from fibonacci(${value - 2}). Returning ${fib1} + ${fib2} = ${result}`,
          variables: {},
          highlightLines: [7],
        });

        stack.pop();
        return result;
      }

      const stack: CallStackFrame[] = [];
      const result = fibRecursive(n, stack);
      
      steps.push({
        callStack: [],
        currentLine: 11,
        description: `✓ Final result: fibonacci(${n}) = ${result}`,
        variables: { answer: result },
        highlightLines: [11],
        output: `Fibonacci(${n}) = ${result}`,
      });

      return steps;
    },
  },
  sum: {
    name: "Sum of N",
    code: {
      c: `int sum(int n) {
    if (n == 0) {
        return 0;
    }
    return n + sum(n - 1);
}

int main() {
    int n = 5;
    int answer = sum(n);
    printf("Sum(1 to %d) = %d", n, answer);
    return 0;
}`,
      cpp: `int sum(int n) {
    if (n == 0) {
        return 0;
    }
    return n + sum(n - 1);
}

int main() {
    int n = 5;
    int answer = sum(n);
    cout << "Sum(1 to " << n << ") = " << answer;
    return 0;
}`,
      java: `public int sum(int n) {
    if (n == 0) {
        return 0;
    }
    return n + sum(n - 1);
}

public static void main(String[] args) {
    int n = 5;
    int answer = sum(n);
    System.out.println("Sum(1 to " + n + ") = " + answer);
}`,
      python: `def sum(n):
    if n == 0:
        return 0
    return n + sum(n - 1)

if __name__ == "__main__":
    n = 5
    answer = sum(n)
    print(f"Sum(1 to {n}) = {answer}")`,
      javascript: `function sum(n) {
    if (n === 0) {
        return 0;
    }
    return n + sum(n - 1);
}

const n = 5;
const answer = sum(n);
console.log(\`Sum(1 to \${n}) = \${answer}\`);`,
    },
    generateSteps: (n: number): Step[] => {
      const steps: Step[] = [];
      frameIdCounter = 0;

      function sumRecursive(value: number, stack: CallStackFrame[]): number {
        const frameId = frameIdCounter++;
        const frame: CallStackFrame = {
          functionName: "sum",
          params: { n: value },
          id: frameId,
        };
        
        stack.push(frame);
        steps.push({
          callStack: [...stack],
          currentLine: 1,
          description: `Calling sum(${value})`,
          variables: {},
          highlightLines: [1],
        });

        steps.push({
          callStack: [...stack],
          currentLine: 2,
          description: `Checking if ${value} == 0`,
          variables: {},
          highlightLines: [2],
        });

        if (value === 0) {
          frame.returnValue = 0;
          steps.push({
            callStack: [...stack],
            currentLine: 3,
            description: `Base case reached! Returning 0`,
            variables: {},
            highlightLines: [3],
          });
          stack.pop();
          return 0;
        }

        steps.push({
          callStack: [...stack],
          currentLine: 5,
          description: `Computing ${value} + sum(${value - 1})`,
          variables: {},
          highlightLines: [5],
        });

        const recursiveResult = sumRecursive(value - 1, stack);
        const result = value + recursiveResult;
        
        frame.returnValue = result;
        steps.push({
          callStack: [...stack],
          currentLine: 5,
          description: `Received ${recursiveResult} from sum(${value - 1}). Returning ${value} + ${recursiveResult} = ${result}`,
          variables: {},
          highlightLines: [5],
        });

        stack.pop();
        return result;
      }

      const stack: CallStackFrame[] = [];
      const result = sumRecursive(n, stack);
      
      steps.push({
        callStack: [],
        currentLine: 10,
        description: `✓ Final result: sum(1 to ${n}) = ${result}`,
        variables: { answer: result },
        highlightLines: [10],
        output: `Sum(1 to ${n}) = ${result}`,
      });

      return steps;
    },
  },
  power: {
    name: "Power",
    code: {
      c: `int power(int base, int exp) {
    if (exp == 0) {
        return 1;
    }
    return base * power(base, exp - 1);
}

int main() {
    int base = 2, exp = 4;
    int answer = power(base, exp);
    printf("%d^%d = %d", base, exp, answer);
    return 0;
}`,
      cpp: `int power(int base, int exp) {
    if (exp == 0) {
        return 1;
    }
    return base * power(base, exp - 1);
}

int main() {
    int base = 2, exp = 4;
    int answer = power(base, exp);
    cout << base << "^" << exp << " = " << answer;
    return 0;
}`,
      java: `public int power(int base, int exp) {
    if (exp == 0) {
        return 1;
    }
    return base * power(base, exp - 1);
}

public static void main(String[] args) {
    int base = 2, exp = 4;
    int answer = power(base, exp);
    System.out.println(base + "^" + exp + " = " + answer);
}`,
      python: `def power(base, exp):
    if exp == 0:
        return 1
    return base * power(base, exp - 1)

if __name__ == "__main__":
    base, exp = 2, 4
    answer = power(base, exp)
    print(f"{base}^{exp} = {answer}")`,
      javascript: `function power(base, exp) {
    if (exp === 0) {
        return 1;
    }
    return base * power(base, exp - 1);
}

const base = 2, exp = 4;
const answer = power(base, exp);
console.log(\`\${base}^\${exp} = \${answer}\`);`,
    },
    generateSteps: (exp: number): Step[] => {
      const steps: Step[] = [];
      frameIdCounter = 0;
      const base = 2;

      function powerRecursive(b: number, e: number, stack: CallStackFrame[]): number {
        const frameId = frameIdCounter++;
        const frame: CallStackFrame = {
          functionName: "power",
          params: { base: b, exp: e },
          id: frameId,
        };
        
        stack.push(frame);
        steps.push({
          callStack: [...stack],
          currentLine: 1,
          description: `Calling power(${b}, ${e})`,
          variables: {},
          highlightLines: [1],
        });

        steps.push({
          callStack: [...stack],
          currentLine: 2,
          description: `Checking if exp ${e} == 0`,
          variables: {},
          highlightLines: [2],
        });

        if (e === 0) {
          frame.returnValue = 1;
          steps.push({
            callStack: [...stack],
            currentLine: 3,
            description: `Base case! Any number to power 0 is 1. Returning 1`,
            variables: {},
            highlightLines: [3],
          });
          stack.pop();
          return 1;
        }

        steps.push({
          callStack: [...stack],
          currentLine: 5,
          description: `Computing ${b} * power(${b}, ${e - 1})`,
          variables: {},
          highlightLines: [5],
        });

        const recursiveResult = powerRecursive(b, e - 1, stack);
        const result = b * recursiveResult;
        
        frame.returnValue = result;
        steps.push({
          callStack: [...stack],
          currentLine: 5,
          description: `Received ${recursiveResult} from power(${b}, ${e - 1}). Returning ${b} * ${recursiveResult} = ${result}`,
          variables: {},
          highlightLines: [5],
        });

        stack.pop();
        return result;
      }

      const stack: CallStackFrame[] = [];
      const result = powerRecursive(base, exp, stack);
      
      steps.push({
        callStack: [],
        currentLine: 10,
        description: `✓ Final result: ${base}^${exp} = ${result}`,
        variables: { answer: result },
        highlightLines: [10],
        output: `${base}^${exp} = ${result}`,
      });

      return steps;
    },
  },
};
