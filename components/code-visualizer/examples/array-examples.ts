export type Language = "c" | "cpp" | "java" | "python" | "javascript";

interface Step {
  array: number[];
  currentIndex?: number;
  highlightIndices: number[];
  currentLine: number;
  description: string;
  variables: Record<string, any>;
  output?: string;
}

export const arrayExamples = {
  traversal: {
    name: "Array Traversal",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      description: "Time complexity is O(n) where n is the array length. Space complexity is O(1) as we use constant extra space."
    },
    code: {
      c: `int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int n = 5;
    
    printf("Array elements: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    return 0;
}`,
      cpp: `int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int n = 5;
    
    cout << "Array elements: ";
    for (int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    return 0;
}`,
      java: `public static void main(String[] args) {
    int[] arr = {10, 20, 30, 40, 50};
    int n = arr.length;
    
    System.out.print("Array elements: ");
    for (int i = 0; i < n; i++) {
        System.out.print(arr[i] + " ");
    }
}`,
      python: `arr = [10, 20, 30, 40, 50]
n = len(arr)

print("Array elements:", end=" ")
for i in range(n):
    print(arr[i], end=" ")`,
      javascript: `const arr = [10, 20, 30, 40, 50];
const n = arr.length;

let output = "Array elements: ";
for (let i = 0; i < n; i++) {
    output += arr[i] + " ";
}
console.log(output);`,
    },
    generateSteps: (size: number): Step[] => {
      const steps: Step[] = [];
      const arr = Array.from({ length: size }, (_, i) => (i + 1) * 10);
      const output: string[] = [];

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 2,
        description: `Initialize array with ${size} elements`,
        variables: { n: size },
      });

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 5,
        description: `Starting to traverse the array`,
        variables: { n: size, i: 0 },
      });

      for (let i = 0; i < size; i++) {
        steps.push({
          array: [...arr],
          currentIndex: i,
          highlightIndices: [i],
          currentLine: 6,
          description: `Accessing arr[${i}] = ${arr[i]}`,
          variables: { n: size, i },
        });

        output.push(String(arr[i]));

        steps.push({
          array: [...arr],
          currentIndex: i,
          highlightIndices: [i],
          currentLine: 7,
          description: `Printed arr[${i}] = ${arr[i]}`,
          variables: { n: size, i },
          output: `Array elements: ${output.join(" ")}`,
        });
      }

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 9,
        description: `✓ Traversal complete! All ${size} elements accessed`,
        variables: { n: size },
        output: `Array elements: ${output.join(" ")}`,
      });

      return steps;
    },
  },
  
  search: {
    name: "Linear Search",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      description: "Time complexity is O(n) in worst case when element is not found or at the end. Space complexity is O(1)."
    },
    code: {
      c: `int linearSearch(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;
}

int main() {
    int arr[] = {15, 8, 23, 42, 31};
    int n = 5, target = 23;
    int result = linearSearch(arr, n, target);
    printf("Found at index: %d", result);
    return 0;
}`,
      cpp: `int linearSearch(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;
}

int main() {
    int arr[] = {15, 8, 23, 42, 31};
    int n = 5, target = 23;
    int result = linearSearch(arr, n, target);
    cout << "Found at index: " << result;
    return 0;
}`,
      java: `public static int linearSearch(int[] arr, int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;
}

public static void main(String[] args) {
    int[] arr = {15, 8, 23, 42, 31};
    int n = arr.length, target = 23;
    int result = linearSearch(arr, n, target);
    System.out.println("Found at index: " + result);
}`,
      python: `def linear_search(arr, n, target):
    for i in range(n):
        if arr[i] == target:
            return i
    return -1

if __name__ == "__main__":
    arr = [15, 8, 23, 42, 31]
    n = len(arr)
    target = 23
    result = linear_search(arr, n, target)
    print(f"Found at index: {result}")`,
      javascript: `function linearSearch(arr, n, target) {
    for (let i = 0; i < n; i++) {
        if (arr[i] === target) {
            return i;
        }
    }
    return -1;
}

const arr = [15, 8, 23, 42, 31];
const n = arr.length;
const target = 23;
const result = linearSearch(arr, n, target);
console.log(\`Found at index: \${result}\`);`,
    },
    generateSteps: (size: number): Step[] => {
      const steps: Step[] = [];
      const arr = [15, 8, 23, 42, 31].slice(0, size);
      const target = arr.length >= 3 ? arr[2] : arr[arr.length - 1];

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 10,
        description: `Searching for ${target} in the array`,
        variables: { n: size, target },
      });

      for (let i = 0; i < arr.length; i++) {
        steps.push({
          array: [...arr],
          currentIndex: i,
          highlightIndices: [i],
          currentLine: 2,
          description: `Checking arr[${i}] = ${arr[i]}`,
          variables: { n: size, target, i },
        });

        steps.push({
          array: [...arr],
          currentIndex: i,
          highlightIndices: [i],
          currentLine: 3,
          description: `Is ${arr[i]} == ${target}? ${arr[i] === target ? "Yes!" : "No"}`,
          variables: { n: size, target, i },
        });

        if (arr[i] === target) {
          steps.push({
            array: [...arr],
            currentIndex: i,
            highlightIndices: [i],
            currentLine: 4,
            description: `✓ Found ${target} at index ${i}!`,
            variables: { n: size, target, i, result: i },
            output: `Found at index: ${i}`,
          });
          return steps;
        }
      }

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 7,
        description: `Element ${target} not found in array`,
        variables: { n: size, target, result: -1 },
        output: `Found at index: -1`,
      });

      return steps;
    },
  },

  insertion: {
    name: "Array Insertion",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      description: "Time complexity is O(n) when inserting at the beginning. Space complexity is O(1) as we modify in-place."
    },
    code: {
      c: `void insert(int arr[], int *n, int pos, int value) {
    for (int i = *n; i > pos; i--) {
        arr[i] = arr[i - 1];
    }
    arr[pos] = value;
    (*n)++;
}

int main() {
    int arr[10] = {10, 20, 30, 40, 50};
    int n = 5;
    insert(arr, &n, 2, 25);
    printf("After insertion: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    return 0;
}`,
      cpp: `void insert(int arr[], int &n, int pos, int value) {
    for (int i = n; i > pos; i--) {
        arr[i] = arr[i - 1];
    }
    arr[pos] = value;
    n++;
}

int main() {
    int arr[10] = {10, 20, 30, 40, 50};
    int n = 5;
    insert(arr, n, 2, 25);
    cout << "After insertion: ";
    for (int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    return 0;
}`,
      java: `public static int insert(int[] arr, int n, int pos, int value) {
    for (int i = n; i > pos; i--) {
        arr[i] = arr[i - 1];
    }
    arr[pos] = value;
    return n + 1;
}

public static void main(String[] args) {
    int[] arr = new int[10];
    arr[0] = 10; arr[1] = 20; arr[2] = 30; arr[3] = 40; arr[4] = 50;
    int n = 5;
    n = insert(arr, n, 2, 25);
    System.out.print("After insertion: ");
    for (int i = 0; i < n; i++) {
        System.out.print(arr[i] + " ");
    }
}`,
      python: `def insert(arr, pos, value):
    arr.insert(pos, value)
    return arr

if __name__ == "__main__":
    arr = [10, 20, 30, 40, 50]
    arr = insert(arr, 2, 25)
    print("After insertion:", " ".join(map(str, arr)))`,
      javascript: `function insert(arr, pos, value) {
    for (let i = arr.length; i > pos; i--) {
        arr[i] = arr[i - 1];
    }
    arr[pos] = value;
    return arr;
}

const arr = [10, 20, 30, 40, 50];
insert(arr, 2, 25);
console.log("After insertion:", arr.join(" "));`,
    },
    generateSteps: (pos: number): Step[] => {
      const steps: Step[] = [];
      const arr = [10, 20, 30, 40, 50];
      const value = 25;
      const position = Math.min(pos, arr.length);

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 9,
        description: `Initial array with ${arr.length} elements`,
        variables: { n: arr.length, pos: position, value },
      });

      steps.push({
        array: [...arr],
        highlightIndices: [position],
        currentLine: 10,
        description: `Inserting ${value} at position ${position}`,
        variables: { n: arr.length, pos: position, value },
      });

      // Shift elements to the right
      for (let i = arr.length - 1; i >= position; i--) {
        steps.push({
          array: [...arr],
          highlightIndices: [i, i + 1],
          currentLine: 2,
          description: `Shifting arr[${i}] = ${arr[i]} to position ${i + 1}`,
          variables: { n: arr.length, pos: position, value, i },
        });

        arr[i + 1] = arr[i];

        steps.push({
          array: [...arr],
          highlightIndices: [i, i + 1],
          currentLine: 3,
          description: `arr[${i + 1}] now contains ${arr[i + 1]}`,
          variables: { n: arr.length, pos: position, value, i },
        });
      }

      // Insert the new value
      arr[position] = value;
      steps.push({
        array: [...arr],
        highlightIndices: [position],
        currentLine: 4,
        description: `Placed ${value} at position ${position}`,
        variables: { n: arr.length + 1, pos: position, value },
      });

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 12,
        description: `✓ Insertion complete! Array now has ${arr.length} elements`,
        variables: { n: arr.length },
        output: `After insertion: ${arr.join(" ")}`,
      });

      return steps;
    },
  },

  deletion: {
    name: "Array Deletion",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      description: "Time complexity is O(n) when deleting from the beginning. Space complexity is O(1) as we modify in-place."
    },
    code: {
      c: `void deleteAt(int arr[], int *n, int pos) {
    for (int i = pos; i < *n - 1; i++) {
        arr[i] = arr[i + 1];
    }
    (*n)--;
}

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int n = 5;
    deleteAt(arr, &n, 2);
    printf("After deletion: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    return 0;
}`,
      cpp: `void deleteAt(int arr[], int &n, int pos) {
    for (int i = pos; i < n - 1; i++) {
        arr[i] = arr[i + 1];
    }
    n--;
}

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int n = 5;
    deleteAt(arr, n, 2);
    cout << "After deletion: ";
    for (int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    return 0;
}`,
      java: `public static int deleteAt(int[] arr, int n, int pos) {
    for (int i = pos; i < n - 1; i++) {
        arr[i] = arr[i + 1];
    }
    return n - 1;
}

public static void main(String[] args) {
    int[] arr = {10, 20, 30, 40, 50};
    int n = 5;
    n = deleteAt(arr, n, 2);
    System.out.print("After deletion: ");
    for (int i = 0; i < n; i++) {
        System.out.print(arr[i] + " ");
    }
}`,
      python: `def delete_at(arr, pos):
    arr.pop(pos)
    return arr

if __name__ == "__main__":
    arr = [10, 20, 30, 40, 50]
    arr = delete_at(arr, 2)
    print("After deletion:", " ".join(map(str, arr)))`,
      javascript: `function deleteAt(arr, pos) {
    for (let i = pos; i < arr.length - 1; i++) {
        arr[i] = arr[i + 1];
    }
    arr.pop();
    return arr;
}

const arr = [10, 20, 30, 40, 50];
deleteAt(arr, 2);
console.log("After deletion:", arr.join(" "));`,
    },
    generateSteps: (pos: number): Step[] => {
      const steps: Step[] = [];
      const arr = [10, 20, 30, 40, 50];
      const position = Math.min(pos, arr.length - 1);
      const deletedValue = arr[position];

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 8,
        description: `Initial array with ${arr.length} elements`,
        variables: { n: arr.length, pos: position },
      });

      steps.push({
        array: [...arr],
        highlightIndices: [position],
        currentLine: 10,
        description: `Deleting element at position ${position} (value = ${deletedValue})`,
        variables: { n: arr.length, pos: position },
      });

      // Shift elements to the left
      for (let i = position; i < arr.length - 1; i++) {
        steps.push({
          array: [...arr],
          highlightIndices: [i, i + 1],
          currentLine: 2,
          description: `Shifting arr[${i + 1}] = ${arr[i + 1]} to position ${i}`,
          variables: { n: arr.length, pos: position, i },
        });

        arr[i] = arr[i + 1];

        steps.push({
          array: [...arr],
          highlightIndices: [i],
          currentLine: 3,
          description: `arr[${i}] now contains ${arr[i]}`,
          variables: { n: arr.length, pos: position, i },
        });
      }

      // Remove last element
      arr.pop();

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 4,
        description: `Removed duplicate at the end`,
        variables: { n: arr.length },
      });

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 12,
        description: `✓ Deletion complete! Array now has ${arr.length} elements`,
        variables: { n: arr.length },
        output: `After deletion: ${arr.join(" ")}`,
      });

      return steps;
    },
  },

  reversal: {
    name: "Array Reversal",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      description: "Time complexity is O(n/2) = O(n). Space complexity is O(1) as we swap in-place."
    },
    code: {
      c: `void reverse(int arr[], int n) {
    int left = 0, right = n - 1;
    while (left < right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int n = 5;
    reverse(arr, n);
    printf("After reversal: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    return 0;
}`,
      cpp: `void reverse(int arr[], int n) {
    int left = 0, right = n - 1;
    while (left < right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int n = 5;
    reverse(arr, n);
    cout << "After reversal: ";
    for (int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    return 0;
}`,
      java: `public static void reverse(int[] arr, int n) {
    int left = 0, right = n - 1;
    while (left < right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}

public static void main(String[] args) {
    int[] arr = {10, 20, 30, 40, 50};
    int n = arr.length;
    reverse(arr, n);
    System.out.print("After reversal: ");
    for (int i = 0; i < n; i++) {
        System.out.print(arr[i] + " ");
    }
}`,
      python: `def reverse(arr, n):
    left, right = 0, n - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1

if __name__ == "__main__":
    arr = [10, 20, 30, 40, 50]
    n = len(arr)
    reverse(arr, n)
    print("After reversal:", " ".join(map(str, arr)))`,
      javascript: `function reverse(arr, n) {
    let left = 0, right = n - 1;
    while (left < right) {
        const temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}

const arr = [10, 20, 30, 40, 50];
const n = arr.length;
reverse(arr, n);
console.log("After reversal:", arr.join(" "));`,
    },
    generateSteps: (size: number): Step[] => {
      const steps: Step[] = [];
      const arr = Array.from({ length: size }, (_, i) => (i + 1) * 10);
      let left = 0;
      let right = arr.length - 1;

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 13,
        description: `Initial array with ${arr.length} elements`,
        variables: { n: arr.length },
      });

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 2,
        description: `Initialize left = 0, right = ${right}`,
        variables: { n: arr.length, left: 0, right },
      });

      while (left < right) {
        steps.push({
          array: [...arr],
          highlightIndices: [left, right],
          currentLine: 3,
          description: `Check: left (${left}) < right (${right})? Yes`,
          variables: { n: arr.length, left, right },
        });

        const temp = arr[left];

        steps.push({
          array: [...arr],
          highlightIndices: [left, right],
          currentLine: 4,
          description: `Swapping arr[${left}] = ${arr[left]} with arr[${right}] = ${arr[right]}`,
          variables: { n: arr.length, left, right, temp },
        });

        // Perform swap
        [arr[left], arr[right]] = [arr[right], arr[left]];

        steps.push({
          array: [...arr],
          highlightIndices: [left, right],
          currentLine: 7,
          description: `Swapped! arr[${left}] = ${arr[left]}, arr[${right}] = ${arr[right]}`,
          variables: { n: arr.length, left, right },
        });

        left++;
        right--;

        steps.push({
          array: [...arr],
          highlightIndices: [left, right],
          currentLine: 8,
          description: `Move pointers: left = ${left}, right = ${right}`,
          variables: { n: arr.length, left, right },
        });
      }

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 3,
        description: `Check: left (${left}) < right (${right})? No - Stop`,
        variables: { n: arr.length, left, right },
      });

      steps.push({
        array: [...arr],
        highlightIndices: [],
        currentLine: 15,
        description: `✓ Array reversed successfully!`,
        variables: { n: arr.length },
        output: `After reversal: ${arr.join(" ")}`,
      });

      return steps;
    },
  },
};
