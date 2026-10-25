export type Language = "c" | "cpp" | "java" | "python" | "javascript";

interface Step {
  currentLine: number;
  description: string;
  variables: Record<string, any>;
  highlightLines: number[];
  output?: string;
  condition?: string;
  conditionResult?: boolean;
  pathTaken?: string;
}

export const conditionalsExamples = {
  ifElse: {
    name: "If-Else Statement",
    complexity: {
      time: "O(1)",
      space: "O(1)",
      description: "Time and space complexity is O(1) as we perform constant-time comparisons."
    },
    code: {
      c: `int main() {
    int age = 18;
    
    if (age >= 18) {
        printf("You are an adult");
    } else {
        printf("You are a minor");
    }
    
    return 0;
}`,
      cpp: `int main() {
    int age = 18;
    
    if (age >= 18) {
        cout << "You are an adult";
    } else {
        cout << "You are a minor";
    }
    
    return 0;
}`,
      java: `public static void main(String[] args) {
    int age = 18;
    
    if (age >= 18) {
        System.out.println("You are an adult");
    } else {
        System.out.println("You are a minor");
    }
}`,
      python: `age = 18

if age >= 18:
    print("You are an adult")
else:
    print("You are a minor")`,
      javascript: `const age = 18;

if (age >= 18) {
    console.log("You are an adult");
} else {
    console.log("You are a minor");
}`,
    },
    generateSteps: (value: number): Step[] => {
      const steps: Step[] = [];
      const age = value;

      steps.push({
        currentLine: 2,
        description: `Initialize age = ${age}`,
        variables: { age },
        highlightLines: [2],
      });

      steps.push({
        currentLine: 4,
        description: `Evaluating condition: age (${age}) >= 18`,
        variables: { age },
        highlightLines: [4],
        condition: `${age} >= 18`,
        conditionResult: age >= 18,
      });

      if (age >= 18) {
        steps.push({
          currentLine: 4,
          description: `Condition is TRUE: ${age} >= 18 ✓`,
          variables: { age },
          highlightLines: [4],
          pathTaken: "if",
        });

        steps.push({
          currentLine: 5,
          description: `Executing IF block`,
          variables: { age },
          highlightLines: [5],
          output: "You are an adult",
        });
      } else {
        steps.push({
          currentLine: 4,
          description: `Condition is FALSE: ${age} >= 18 ✗`,
          variables: { age },
          highlightLines: [4],
          pathTaken: "else",
        });

        steps.push({
          currentLine: 7,
          description: `Executing ELSE block`,
          variables: { age },
          highlightLines: [7],
          output: "You are a minor",
        });
      }

      steps.push({
        currentLine: 10,
        description: `✓ Program complete`,
        variables: { age },
        highlightLines: [10],
        output: age >= 18 ? "You are an adult" : "You are a minor",
      });

      return steps;
    },
  },

  ifElseIf: {
    name: "If-Else-If Ladder",
    complexity: {
      time: "O(1)",
      space: "O(1)",
      description: "Time complexity is O(1) with at most n comparisons where n is the number of conditions."
    },
    code: {
      c: `int main() {
    int marks = 75;
    
    if (marks >= 90) {
        printf("Grade: A");
    } else if (marks >= 75) {
        printf("Grade: B");
    } else if (marks >= 60) {
        printf("Grade: C");
    } else {
        printf("Grade: F");
    }
    
    return 0;
}`,
      cpp: `int main() {
    int marks = 75;
    
    if (marks >= 90) {
        cout << "Grade: A";
    } else if (marks >= 75) {
        cout << "Grade: B";
    } else if (marks >= 60) {
        cout << "Grade: C";
    } else {
        cout << "Grade: F";
    }
    
    return 0;
}`,
      java: `public static void main(String[] args) {
    int marks = 75;
    
    if (marks >= 90) {
        System.out.println("Grade: A");
    } else if (marks >= 75) {
        System.out.println("Grade: B");
    } else if (marks >= 60) {
        System.out.println("Grade: C");
    } else {
        System.out.println("Grade: F");
    }
}`,
      python: `marks = 75

if marks >= 90:
    print("Grade: A")
elif marks >= 75:
    print("Grade: B")
elif marks >= 60:
    print("Grade: C")
else:
    print("Grade: F")`,
      javascript: `const marks = 75;

if (marks >= 90) {
    console.log("Grade: A");
} else if (marks >= 75) {
    console.log("Grade: B");
} else if (marks >= 60) {
    console.log("Grade: C");
} else {
    console.log("Grade: F");
}`,
    },
    generateSteps: (value: number): Step[] => {
      const steps: Step[] = [];
      const marks = value;

      steps.push({
        currentLine: 2,
        description: `Initialize marks = ${marks}`,
        variables: { marks },
        highlightLines: [2],
      });

      // First condition
      steps.push({
        currentLine: 4,
        description: `Checking first condition: marks (${marks}) >= 90`,
        variables: { marks },
        highlightLines: [4],
        condition: `${marks} >= 90`,
        conditionResult: marks >= 90,
      });

      if (marks >= 90) {
        steps.push({
          currentLine: 4,
          description: `Condition TRUE: ${marks} >= 90 ✓`,
          variables: { marks },
          highlightLines: [4],
          pathTaken: "if",
        });

        steps.push({
          currentLine: 5,
          description: `Executing: Grade A`,
          variables: { marks, grade: "A" },
          highlightLines: [5],
          output: "Grade: A",
        });
      } else {
        steps.push({
          currentLine: 4,
          description: `Condition FALSE: ${marks} >= 90 ✗. Checking next condition`,
          variables: { marks },
          highlightLines: [4],
        });

        // Second condition
        steps.push({
          currentLine: 6,
          description: `Checking second condition: marks (${marks}) >= 75`,
          variables: { marks },
          highlightLines: [6],
          condition: `${marks} >= 75`,
          conditionResult: marks >= 75,
        });

        if (marks >= 75) {
          steps.push({
            currentLine: 6,
            description: `Condition TRUE: ${marks} >= 75 ✓`,
            variables: { marks },
            highlightLines: [6],
            pathTaken: "else-if-1",
          });

          steps.push({
            currentLine: 7,
            description: `Executing: Grade B`,
            variables: { marks, grade: "B" },
            highlightLines: [7],
            output: "Grade: B",
          });
        } else {
          steps.push({
            currentLine: 6,
            description: `Condition FALSE: ${marks} >= 75 ✗. Checking next condition`,
            variables: { marks },
            highlightLines: [6],
          });

          // Third condition
          steps.push({
            currentLine: 8,
            description: `Checking third condition: marks (${marks}) >= 60`,
            variables: { marks },
            highlightLines: [8],
            condition: `${marks} >= 60`,
            conditionResult: marks >= 60,
          });

          if (marks >= 60) {
            steps.push({
              currentLine: 8,
              description: `Condition TRUE: ${marks} >= 60 ✓`,
              variables: { marks },
              highlightLines: [8],
              pathTaken: "else-if-2",
            });

            steps.push({
              currentLine: 9,
              description: `Executing: Grade C`,
              variables: { marks, grade: "C" },
              highlightLines: [9],
              output: "Grade: C",
            });
          } else {
            steps.push({
              currentLine: 8,
              description: `Condition FALSE: ${marks} >= 60 ✗. Going to else block`,
              variables: { marks },
              highlightLines: [8],
            });

            steps.push({
              currentLine: 11,
              description: `Executing ELSE block: Grade F`,
              variables: { marks, grade: "F" },
              highlightLines: [11],
              pathTaken: "else",
              output: "Grade: F",
            });
          }
        }
      }

      const grade = marks >= 90 ? "A" : marks >= 75 ? "B" : marks >= 60 ? "C" : "F";
      steps.push({
        currentLine: 14,
        description: `✓ Program complete. Final Grade: ${grade}`,
        variables: { marks, grade },
        highlightLines: [14],
        output: `Grade: ${grade}`,
      });

      return steps;
    },
  },

  nestedIf: {
    name: "Nested If Statement",
    complexity: {
      time: "O(1)",
      space: "O(1)",
      description: "Time complexity is O(1) as we evaluate nested conditions. Space complexity is O(1)."
    },
    code: {
      c: `int main() {
    int num = 12;
    
    if (num > 0) {
        printf("Number is positive\\n");
        if (num % 2 == 0) {
            printf("Number is even");
        } else {
            printf("Number is odd");
        }
    } else {
        printf("Number is non-positive");
    }
    
    return 0;
}`,
      cpp: `int main() {
    int num = 12;
    
    if (num > 0) {
        cout << "Number is positive" << endl;
        if (num % 2 == 0) {
            cout << "Number is even";
        } else {
            cout << "Number is odd";
        }
    } else {
        cout << "Number is non-positive";
    }
    
    return 0;
}`,
      java: `public static void main(String[] args) {
    int num = 12;
    
    if (num > 0) {
        System.out.println("Number is positive");
        if (num % 2 == 0) {
            System.out.println("Number is even");
        } else {
            System.out.println("Number is odd");
        }
    } else {
        System.out.println("Number is non-positive");
    }
}`,
      python: `num = 12

if num > 0:
    print("Number is positive")
    if num % 2 == 0:
        print("Number is even")
    else:
        print("Number is odd")
else:
    print("Number is non-positive")`,
      javascript: `const num = 12;

if (num > 0) {
    console.log("Number is positive");
    if (num % 2 === 0) {
        console.log("Number is even");
    } else {
        console.log("Number is odd");
    }
} else {
    console.log("Number is non-positive");
}`,
    },
    generateSteps: (value: number): Step[] => {
      const steps: Step[] = [];
      const num = value;
      const outputs: string[] = [];

      steps.push({
        currentLine: 2,
        description: `Initialize num = ${num}`,
        variables: { num },
        highlightLines: [2],
      });

      // Outer if
      steps.push({
        currentLine: 4,
        description: `Outer condition: Is num (${num}) > 0?`,
        variables: { num },
        highlightLines: [4],
        condition: `${num} > 0`,
        conditionResult: num > 0,
      });

      if (num > 0) {
        steps.push({
          currentLine: 4,
          description: `Outer condition TRUE: ${num} > 0 ✓`,
          variables: { num },
          highlightLines: [4],
          pathTaken: "outer-if",
        });

        outputs.push("Number is positive");
        steps.push({
          currentLine: 5,
          description: `Executing outer IF block: "Number is positive"`,
          variables: { num },
          highlightLines: [5],
          output: outputs.join("\n"),
        });

        // Inner if
        steps.push({
          currentLine: 6,
          description: `Inner condition: Is num (${num}) % 2 == 0?`,
          variables: { num },
          highlightLines: [6],
          condition: `${num} % 2 == 0`,
          conditionResult: num % 2 === 0,
        });

        if (num % 2 === 0) {
          steps.push({
            currentLine: 6,
            description: `Inner condition TRUE: ${num} is even ✓`,
            variables: { num },
            highlightLines: [6],
            pathTaken: "inner-if",
          });

          outputs.push("Number is even");
          steps.push({
            currentLine: 7,
            description: `Executing inner IF block: "Number is even"`,
            variables: { num },
            highlightLines: [7],
            output: outputs.join("\n"),
          });
        } else {
          steps.push({
            currentLine: 6,
            description: `Inner condition FALSE: ${num} is odd ✗`,
            variables: { num },
            highlightLines: [6],
            pathTaken: "inner-else",
          });

          outputs.push("Number is odd");
          steps.push({
            currentLine: 9,
            description: `Executing inner ELSE block: "Number is odd"`,
            variables: { num },
            highlightLines: [9],
            output: outputs.join("\n"),
          });
        }
      } else {
        steps.push({
          currentLine: 4,
          description: `Outer condition FALSE: ${num} > 0 ✗`,
          variables: { num },
          highlightLines: [4],
          pathTaken: "outer-else",
        });

        outputs.push("Number is non-positive");
        steps.push({
          currentLine: 12,
          description: `Executing outer ELSE block: "Number is non-positive"`,
          variables: { num },
          highlightLines: [12],
          output: outputs.join("\n"),
        });
      }

      steps.push({
        currentLine: 15,
        description: `✓ Program complete`,
        variables: { num },
        highlightLines: [15],
        output: outputs.join("\n"),
      });

      return steps;
    },
  },

  switchCase: {
    name: "Switch-Case Statement",
    complexity: {
      time: "O(1)",
      space: "O(1)",
      description: "Time complexity is O(1) with direct case matching. Space complexity is O(1)."
    },
    code: {
      c: `int main() {
    int day = 3;
    
    switch (day) {
        case 1:
            printf("Monday");
            break;
        case 2:
            printf("Tuesday");
            break;
        case 3:
            printf("Wednesday");
            break;
        case 4:
            printf("Thursday");
            break;
        case 5:
            printf("Friday");
            break;
        default:
            printf("Weekend");
    }
    
    return 0;
}`,
      cpp: `int main() {
    int day = 3;
    
    switch (day) {
        case 1:
            cout << "Monday";
            break;
        case 2:
            cout << "Tuesday";
            break;
        case 3:
            cout << "Wednesday";
            break;
        case 4:
            cout << "Thursday";
            break;
        case 5:
            cout << "Friday";
            break;
        default:
            cout << "Weekend";
    }
    
    return 0;
}`,
      java: `public static void main(String[] args) {
    int day = 3;
    
    switch (day) {
        case 1:
            System.out.println("Monday");
            break;
        case 2:
            System.out.println("Tuesday");
            break;
        case 3:
            System.out.println("Wednesday");
            break;
        case 4:
            System.out.println("Thursday");
            break;
        case 5:
            System.out.println("Friday");
            break;
        default:
            System.out.println("Weekend");
    }
}`,
      python: `day = 3

# Python uses match-case (3.10+) or dict
days = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday"
}

result = days.get(day, "Weekend")
print(result)`,
      javascript: `const day = 3;

switch (day) {
    case 1:
        console.log("Monday");
        break;
    case 2:
        console.log("Tuesday");
        break;
    case 3:
        console.log("Wednesday");
        break;
    case 4:
        console.log("Thursday");
        break;
    case 5:
        console.log("Friday");
        break;
    default:
        console.log("Weekend");
}`,
    },
    generateSteps: (value: number): Step[] => {
      const steps: Step[] = [];
      const day = value;
      const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

      steps.push({
        currentLine: 2,
        description: `Initialize day = ${day}`,
        variables: { day },
        highlightLines: [2],
      });

      steps.push({
        currentLine: 4,
        description: `Entering switch statement with day = ${day}`,
        variables: { day },
        highlightLines: [4],
      });

      const cases = [
        { value: 1, line: 5, name: "Monday" },
        { value: 2, line: 8, name: "Tuesday" },
        { value: 3, line: 11, name: "Wednesday" },
        { value: 4, line: 14, name: "Thursday" },
        { value: 5, line: 17, name: "Friday" },
      ];

      let matched = false;
      for (const c of cases) {
        if (c.value === day) {
          steps.push({
            currentLine: c.line,
            description: `Match found! case ${c.value}: day (${day}) == ${c.value} ✓`,
            variables: { day },
            highlightLines: [c.line],
            pathTaken: `case-${c.value}`,
          });

          steps.push({
            currentLine: c.line + 1,
            description: `Executing: Print "${c.name}"`,
            variables: { day },
            highlightLines: [c.line + 1],
            output: c.name,
          });

          steps.push({
            currentLine: c.line + 2,
            description: `Break statement: Exiting switch`,
            variables: { day },
            highlightLines: [c.line + 2],
          });

          matched = true;
          break;
        } else {
          steps.push({
            currentLine: c.line,
            description: `Checking case ${c.value}: day (${day}) == ${c.value}? No, continue`,
            variables: { day },
            highlightLines: [c.line],
          });
        }
      }

      if (!matched) {
        steps.push({
          currentLine: 20,
          description: `No case matched. Executing default case`,
          variables: { day },
          highlightLines: [20],
          pathTaken: "default",
        });

        steps.push({
          currentLine: 21,
          description: `Executing: Print "Weekend"`,
          variables: { day },
          highlightLines: [21],
          output: "Weekend",
        });
      }

      const output = matched ? dayNames[day] : "Weekend";
      steps.push({
        currentLine: 24,
        description: `✓ Program complete`,
        variables: { day },
        highlightLines: [24],
        output,
      });

      return steps;
    },
  },

  ternary: {
    name: "Ternary Operator",
    complexity: {
      time: "O(1)",
      space: "O(1)",
      description: "Time complexity is O(1) as it's a single conditional evaluation. Space complexity is O(1)."
    },
    code: {
      c: `int main() {
    int a = 10, b = 20;
    int max;
    
    max = (a > b) ? a : b;
    
    printf("Maximum: %d", max);
    return 0;
}`,
      cpp: `int main() {
    int a = 10, b = 20;
    int max;
    
    max = (a > b) ? a : b;
    
    cout << "Maximum: " << max;
    return 0;
}`,
      java: `public static void main(String[] args) {
    int a = 10, b = 20;
    int max;
    
    max = (a > b) ? a : b;
    
    System.out.println("Maximum: " + max);
}`,
      python: `a, b = 10, 20

max_val = a if a > b else b

print(f"Maximum: {max_val}")`,
      javascript: `const a = 10, b = 20;

const max = (a > b) ? a : b;

console.log(\`Maximum: \${max}\`);`,
    },
    generateSteps: (value: number): Step[] => {
      const steps: Step[] = [];
      const a = value;
      const b = value + 10;

      steps.push({
        currentLine: 2,
        description: `Initialize a = ${a}, b = ${b}`,
        variables: { a, b },
        highlightLines: [2],
      });

      steps.push({
        currentLine: 5,
        description: `Ternary operator: (a > b) ? a : b`,
        variables: { a, b },
        highlightLines: [5],
      });

      steps.push({
        currentLine: 5,
        description: `Evaluating condition: (${a} > ${b})?`,
        variables: { a, b },
        highlightLines: [5],
        condition: `${a} > ${b}`,
        conditionResult: a > b,
      });

      const max = a > b ? a : b;

      if (a > b) {
        steps.push({
          currentLine: 5,
          description: `Condition TRUE: ${a} > ${b} ✓. Returning first value: ${a}`,
          variables: { a, b },
          highlightLines: [5],
          pathTaken: "true",
        });
      } else {
        steps.push({
          currentLine: 5,
          description: `Condition FALSE: ${a} > ${b} ✗. Returning second value: ${b}`,
          variables: { a, b },
          highlightLines: [5],
          pathTaken: "false",
        });
      }

      steps.push({
        currentLine: 5,
        description: `Assignment: max = ${max}`,
        variables: { a, b, max },
        highlightLines: [5],
      });

      steps.push({
        currentLine: 7,
        description: `✓ Maximum value is ${max}`,
        variables: { a, b, max },
        highlightLines: [7],
        output: `Maximum: ${max}`,
      });

      return steps;
    },
  },
};
