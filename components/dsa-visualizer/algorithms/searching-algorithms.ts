export type SearchingAlgorithm = "linear" | "binary" | "jump";

interface Step {
  array: number[];
  searching?: number[];
  found?: number;
  notFound?: number[];
  left?: number;
  right?: number;
  mid?: number;
  description: string;
  highlightLines: number[];
}

export const searchingAlgorithms = {
  linear: {
    name: "Linear Search",
    language: "java",
    code: `public int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) {
            return i;  // Found at index i
        }
    }
    return -1;  // Not found
}`,
    complexity: {
      time: { best: "O(1)", average: "O(n)", worst: "O(n)" },
      space: "O(1)",
      description:
        "Linear search sequentially checks each element until it finds the target value or reaches the end of the array. It works on both sorted and unsorted arrays.",
    },
    generate: (arr: number[], target: number): Step[] => {
      const steps: Step[] = [];

      steps.push({
        array: [...arr],
        description: `Starting Linear Search for target = ${target}`,
        highlightLines: [1],
      });

      for (let i = 0; i < arr.length; i++) {
        steps.push({
          array: [...arr],
          searching: [i],
          description: `Checking arr[${i}] = ${arr[i]} against target = ${target}`,
          highlightLines: [2, 3],
        });

        if (arr[i] === target) {
          steps.push({
            array: [...arr],
            found: i,
            description: `✓ Target ${target} found at index ${i}!`,
            highlightLines: [4],
          });
          return steps;
        }

        steps.push({
          array: [...arr],
          notFound: [i],
          description: `arr[${i}] = ${arr[i]} ≠ ${target}, moving to next element`,
          highlightLines: [2],
        });
      }

      steps.push({
        array: [...arr],
        notFound: Array.from({ length: arr.length }, (_, i) => i),
        description: `✗ Target ${target} not found in the array`,
        highlightLines: [7],
      });

      return steps;
    },
  },
  binary: {
    name: "Binary Search",
    language: "java",
    code: `public int binarySearch(int[] arr, int target) {
    int left = 0;
    int right = arr.length - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target) {
            return mid;  // Found
        }
        
        if (arr[mid] < target) {
            left = mid + 1;  // Search right half
        } else {
            right = mid - 1;  // Search left half
        }
    }
    
    return -1;  // Not found
}`,
    complexity: {
      time: { best: "O(1)", average: "O(log n)", worst: "O(log n)" },
      space: "O(1)",
      description:
        "Binary search efficiently finds a target value in a sorted array by repeatedly dividing the search interval in half. It compares the target with the middle element and eliminates half of the remaining elements.",
    },
    generate: (arr: number[], target: number): Step[] => {
      const steps: Step[] = [];
      let left = 0;
      let right = arr.length - 1;

      steps.push({
        array: [...arr],
        left,
        right,
        description: `Starting Binary Search for target = ${target}. Array must be sorted.`,
        highlightLines: [1, 2, 3],
      });

      while (left <= right) {
        const mid = Math.floor(left + (right - left) / 2);

        steps.push({
          array: [...arr],
          left,
          right,
          mid,
          description: `Search space: [${left}...${right}]. Calculating mid = ${mid}`,
          highlightLines: [5, 6],
        });

        steps.push({
          array: [...arr],
          left,
          right,
          searching: [mid],
          mid,
          description: `Comparing arr[${mid}] = ${arr[mid]} with target = ${target}`,
          highlightLines: [8, 9],
        });

        if (arr[mid] === target) {
          steps.push({
            array: [...arr],
            found: mid,
            description: `✓ Target ${target} found at index ${mid}!`,
            highlightLines: [9],
          });
          return steps;
        }

        if (arr[mid] < target) {
          steps.push({
            array: [...arr],
            left,
            right,
            mid,
            notFound: Array.from({ length: mid - left + 1 }, (_, i) => left + i),
            description: `arr[${mid}] = ${arr[mid]} < ${target}. Searching right half: [${mid + 1}...${right}]`,
            highlightLines: [12, 13],
          });
          left = mid + 1;
        } else {
          steps.push({
            array: [...arr],
            left,
            right,
            mid,
            notFound: Array.from({ length: right - mid + 1 }, (_, i) => mid + i),
            description: `arr[${mid}] = ${arr[mid]} > ${target}. Searching left half: [${left}...${mid - 1}]`,
            highlightLines: [14, 15],
          });
          right = mid - 1;
        }
      }

      steps.push({
        array: [...arr],
        notFound: Array.from({ length: arr.length }, (_, i) => i),
        description: `✗ Search space exhausted. Target ${target} not found`,
        highlightLines: [19],
      });

      return steps;
    },
  },
  jump: {
    name: "Jump Search",
    language: "java",
    code: `public int jumpSearch(int[] arr, int target) {
    int n = arr.length;
    int step = (int) Math.sqrt(n);
    int prev = 0;
    
    // Jump to find block
    while (arr[Math.min(step, n) - 1] < target) {
        prev = step;
        step += (int) Math.sqrt(n);
        if (prev >= n) {
            return -1;
        }
    }
    
    // Linear search in block
    while (arr[prev] < target) {
        prev++;
        if (prev == Math.min(step, n)) {
            return -1;
        }
    }
    
    if (arr[prev] == target) {
        return prev;
    }
    
    return -1;
}`,
    complexity: {
      time: { best: "O(1)", average: "O(√n)", worst: "O(√n)" },
      space: "O(1)",
      description:
        "Jump search works on sorted arrays by jumping ahead by fixed steps instead of searching every element. It finds a block where the element is present and performs linear search in that block.",
    },
    generate: (arr: number[], target: number): Step[] => {
      const steps: Step[] = [];
      const n = arr.length;
      const jumpSize = Math.floor(Math.sqrt(n));
      let step = jumpSize;
      let prev = 0;

      steps.push({
        array: [...arr],
        description: `Starting Jump Search for target = ${target}. Jump size = √${n} = ${jumpSize}`,
        highlightLines: [1, 2, 3, 4],
      });

      // Jump phase
      while (step < n && arr[step - 1] < target) {
        steps.push({
          array: [...arr],
          searching: [step - 1],
          description: `Jumping: Check arr[${step - 1}] = ${arr[step - 1]} < ${target}? Yes, jump forward`,
          highlightLines: [7, 8, 9],
        });

        prev = step;
        step += jumpSize;
      }

      const blockEnd = Math.min(step, n);
      steps.push({
        array: [...arr],
        searching: [Math.min(step - 1, n - 1)],
        description: `Found potential block: [${prev}...${blockEnd - 1}]. Starting linear search`,
        highlightLines: [13, 15],
      });

      // Linear search in block
      for (let i = prev; i < blockEnd; i++) {
        steps.push({
          array: [...arr],
          searching: [i],
          notFound: Array.from({ length: i - prev }, (_, idx) => prev + idx),
          description: `Linear search in block: Checking arr[${i}] = ${arr[i]} against target = ${target}`,
          highlightLines: [16, 17, 18, 19, 20, 21],
        });

        if (arr[i] === target) {
          steps.push({
            array: [...arr],
            found: i,
            description: `✓ Target ${target} found at index ${i}!`,
            highlightLines: [23, 24],
          });
          return steps;
        }
      }

      steps.push({
        array: [...arr],
        notFound: Array.from({ length: arr.length }, (_, i) => i),
        description: `✗ Target ${target} not found in the array`,
        highlightLines: [27],
      });

      return steps;
    },
  },
};
