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
    complexity: {
      time: "O(n)",
      space: "O(n)",
      description: "Time complexity is O(n) as we make n recursive calls. Space complexity is O(n) due to the call stack depth."
    },
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
    complexity: {
      time: "O(2^n)",
      space: "O(n)",
      description: "Time complexity is O(2^n) due to exponential branching - each call makes two more calls. Space complexity is O(n) for the maximum call stack depth."
    },
    code: {
      c: `void printFibonacci(int n) {
    printf("Fibonacci sequence: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", fibonacci(i));
    }
}

int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    int n = 5;
    printFibonacci(n);
    return 0;
}`,
      cpp: `void printFibonacci(int n) {
    cout << "Fibonacci sequence: ";
    for (int i = 0; i < n; i++) {
        cout << fibonacci(i) << " ";
    }
}

int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    int n = 5;
    printFibonacci(n);
    return 0;
}`,
      java: `public void printFibonacci(int n) {
    System.out.print("Fibonacci sequence: ");
    for (int i = 0; i < n; i++) {
        System.out.print(fibonacci(i) + " ");
    }
}

public int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

public static void main(String[] args) {
    int n = 5;
    printFibonacci(n);
}`,
      python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def print_fibonacci(n):
    print("Fibonacci sequence:", end=" ")
    for i in range(n):
        print(fibonacci(i), end=" ")

if __name__ == "__main__":
    n = 5
    print_fibonacci(n)`,
      javascript: `function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

function printFibonacci(n) {
    let sequence = "Fibonacci sequence: ";
    for (let i = 0; i < n; i++) {
        sequence += fibonacci(i) + " ";
    }
    console.log(sequence);
}

const n = 5;
printFibonacci(n);`,
    },
    generateSteps: (n: number): Step[] => {
      const steps: Step[] = [];
      frameIdCounter = 0;
      const sequence: number[] = [];
      const memo: Map<number, number> = new Map();

      function fibRecursive(value: number, stack: CallStackFrame[], forPrint: boolean = false): number {
        // Use memoization to avoid too many calls
        if (memo.has(value)) {
          return memo.get(value)!;
        }
        
        const frameId = frameIdCounter++;
        const frame: CallStackFrame = {
          functionName: "fibonacci",
          params: { n: value },
          id: frameId,
        };
        
        stack.push(frame);
        
        if (!forPrint || frameIdCounter < 40) {
          steps.push({
            callStack: [...stack],
            currentLine: 9,
            description: `Calling fibonacci(${value})`,
            variables: {},
            highlightLines: [9],
          });

          steps.push({
            callStack: [...stack],
            currentLine: 10,
            description: `Checking if ${value} <= 1`,
            variables: {},
            highlightLines: [10],
          });
        }

        if (value <= 1) {
          frame.returnValue = value;
          
          if (!forPrint || frameIdCounter < 40) {
            steps.push({
              callStack: [...stack],
              currentLine: 11,
              description: `Base case! Returning ${value}`,
              variables: {},
              highlightLines: [11],
            });
          }
          
          stack.pop();
          memo.set(value, value);
          return value;
        }

        if (!forPrint || frameIdCounter < 40) {
          steps.push({
            callStack: [...stack],
            currentLine: 13,
            description: `Computing fibonacci(${value - 1}) + fibonacci(${value - 2})`,
            variables: {},
            highlightLines: [13],
          });
        }

        const fib1 = fibRecursive(value - 1, stack, forPrint);
        const fib2 = fibRecursive(value - 2, stack, forPrint);
        const result = fib1 + fib2;
        
        frame.localVars = { fib1, fib2 };
        frame.returnValue = result;
        
        if (!forPrint || frameIdCounter < 40) {
          steps.push({
            callStack: [...stack],
            currentLine: 13,
            description: `fibonacci(${value - 1}) = ${fib1}, fibonacci(${value - 2}) = ${fib2}. Returning ${result}`,
            variables: {},
            highlightLines: [13],
          });
        }

        stack.pop();
        memo.set(value, result);
        return result;
      }

      // Simulate the loop that generates the sequence
      steps.push({
        callStack: [],
        currentLine: 2,
        description: `Starting to generate Fibonacci sequence for n = ${n}`,
        variables: { n },
        highlightLines: [2],
      });

      for (let i = 0; i < n; i++) {
        steps.push({
          callStack: [],
          currentLine: 3,
          description: `Loop iteration ${i + 1}: Computing fibonacci(${i})`,
          variables: { n, i },
          highlightLines: [3],
        });

        const stack: CallStackFrame[] = [];
        const fibValue = fibRecursive(i, stack, i > 2); // Only show detailed steps for first few
        sequence.push(fibValue);

        steps.push({
          callStack: [],
          currentLine: 4,
          description: `fibonacci(${i}) = ${fibValue}. Sequence so far: ${sequence.join(", ")}`,
          variables: { n, i },
          highlightLines: [4],
          output: `Fibonacci sequence: ${sequence.join(" ")}`,
        });
      }
      
      steps.push({
        callStack: [],
        currentLine: 8,
        description: `✓ Complete Fibonacci sequence generated!`,
        variables: { n },
        highlightLines: [8],
        output: `Fibonacci sequence: ${sequence.join(" ")}`,
      });

      return steps;
    },
  },
  sum: {
    name: "Sum of N",
    complexity: {
      time: "O(n)",
      space: "O(n)",
      description: "Time complexity is O(n) for n recursive calls. Space complexity is O(n) for the recursion call stack."
    },
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
      const partialSums: string[] = [];

      function sumRecursive(value: number, stack: CallStackFrame[], accumulated: number = 0): number {
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

        const recursiveResult = sumRecursive(value - 1, stack, accumulated);
        const result = value + recursiveResult;
        
        // Build the addition string for display
        if (value === n) {
          // Don't add yet, we're at the top
        } else if (value > 1) {
          partialSums.push(`${value}`);
        }
        
        frame.returnValue = result;
        const sumStr = value === n ? `${n} + ${n-1} + ... + 1` : `Computing: ${value} + ...`;
        steps.push({
          callStack: [...stack],
          currentLine: 5,
          description: `Received ${recursiveResult} from sum(${value - 1}). Returning ${value} + ${recursiveResult} = ${result}`,
          variables: {},
          highlightLines: [5],
          output: result < n ? `Partial sum: ${result}` : undefined,
        });

        stack.pop();
        return result;
      }

      const stack: CallStackFrame[] = [];
      const result = sumRecursive(n, stack);
      
      // Build the sum sequence
      const sequence = Array.from({length: n}, (_, i) => i + 1).join(" + ");
      
      steps.push({
        callStack: [],
        currentLine: 10,
        description: `✓ Final result: ${sequence} = ${result}`,
        variables: { answer: result },
        highlightLines: [10],
        output: `Sum(1 to ${n}) = ${sequence} = ${result}`,
      });

      return steps;
    },
  },
  power: {
    name: "Power",
    complexity: {
      time: "O(n)",
      space: "O(n)",
      description: "Time complexity is O(n) where n is the exponent. Space complexity is O(n) for the call stack depth."
    },
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
        
        // Build power calculation string
        const powerStr = Array(e).fill(b).join(" × ");
        
        steps.push({
          callStack: [...stack],
          currentLine: 5,
          description: `Received ${recursiveResult} from power(${b}, ${e - 1}). Returning ${b} * ${recursiveResult} = ${result}`,
          variables: {},
          highlightLines: [5],
          output: result < Math.pow(b, exp) ? `Partial: ${b}^${e} = ${result}` : undefined,
        });

        stack.pop();
        return result;
      }

      const stack: CallStackFrame[] = [];
      const result = powerRecursive(base, exp, stack);
      
      // Build the multiplication sequence
      const sequence = Array(exp).fill(base).join(" × ");
      
      steps.push({
        callStack: [],
        currentLine: 10,
        description: `✓ Final result: ${base}^${exp} = ${sequence} = ${result}`,
        variables: { answer: result },
        highlightLines: [10],
        output: `${base}^${exp} = ${sequence} = ${result}`,
      });

      return steps;
    },
  },
};
