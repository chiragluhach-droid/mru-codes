export type SortingAlgorithm = "bubble" | "selection" | "insertion" | "merge" | "quick";

interface Step {
  array: number[];
  comparing?: number[];
  swapping?: number[];
  sorted?: number[];
  pivot?: number;
  description: string;
  highlightLines: number[];
}

export const sortingAlgorithms = {
  bubble: {
    name: "Bubble Sort",
    language: "java",
    code: `public void bubbleSort(int[] arr) {
    int n = arr.length;
    
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap elements
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;
            }
        }
        
        // Early exit if no swaps
        if (!swapped) {
            break;
        }
    }
}`,
    complexity: {
      time: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
      space: "O(1)",
      description:
        "Bubble sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in wrong order. The pass through the list is repeated until the list is sorted.",
    },
    generate: (arr: number[]): Step[] => {
      const steps: Step[] = [];
      const array = [...arr];
      const n = array.length;
      const sorted: number[] = [];

      steps.push({
        array: [...array],
        description: "Initial array - Starting Bubble Sort",
        highlightLines: [1, 2],
      });

      for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        steps.push({
          array: [...array],
          sorted: [...sorted],
          description: `Pass ${i + 1}: Starting outer loop iteration`,
          highlightLines: [3, 4],
        });

        for (let j = 0; j < n - i - 1; j++) {
          steps.push({
            array: [...array],
            comparing: [j, j + 1],
            sorted: [...sorted],
            description: `Comparing arr[${j}]=${array[j]} and arr[${j + 1}]=${array[j + 1]}`,
            highlightLines: [6, 7],
          });

          if (array[j] > array[j + 1]) {
            steps.push({
              array: [...array],
              swapping: [j, j + 1],
              sorted: [...sorted],
              description: `Swapping ${array[j]} and ${array[j + 1]} (arr[${j}] > arr[${j + 1}])`,
              highlightLines: [8, 9, 10, 11],
            });

            const temp = array[j];
            array[j] = array[j + 1];
            array[j + 1] = temp;
            swapped = true;

            steps.push({
              array: [...array],
              sorted: [...sorted],
              description: `After swap: arr[${j}]=${array[j]}, arr[${j + 1}]=${array[j + 1]}`,
              highlightLines: [8, 9, 10, 11, 12],
            });
          }
        }

        sorted.push(n - i - 1);
        steps.push({
          array: [...array],
          sorted: [...sorted],
          description: `Pass ${i + 1} complete. Element at index ${n - i - 1} is now sorted`,
          highlightLines: [16, 17, 18, 19],
        });

        if (!swapped) {
          for (let k = 0; k < n; k++) sorted.push(k);
          steps.push({
            array: [...array],
            sorted: [...sorted],
            description: "No swaps made - array is sorted! Early exit optimization",
            highlightLines: [16, 17, 18, 19],
          });
          break;
        }
      }

      steps.push({
        array: [...array],
        sorted: Array.from({ length: n }, (_, i) => i),
        description: "✓ Sorting complete! All elements are in order",
        highlightLines: [21],
      });

      return steps;
    },
  },
  selection: {
    name: "Selection Sort",
    language: "java",
    code: `public void selectionSort(int[] arr) {
    int n = arr.length;
    
    for (int i = 0; i < n - 1; i++) {
        int minIndex = i;
        
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }
        
        // Swap minimum element with first element
        if (minIndex != i) {
            int temp = arr[i];
            arr[i] = arr[minIndex];
            arr[minIndex] = temp;
        }
    }
}`,
    complexity: {
      time: { best: "O(n²)", average: "O(n²)", worst: "O(n²)" },
      space: "O(1)",
      description:
        "Selection sort divides the input into a sorted and an unsorted region. It repeatedly selects the smallest element from the unsorted region and moves it to the end of the sorted region.",
    },
    generate: (arr: number[]): Step[] => {
      const steps: Step[] = [];
      const array = [...arr];
      const n = array.length;
      const sorted: number[] = [];

      steps.push({
        array: [...array],
        description: "Initial array - Starting Selection Sort",
        highlightLines: [1, 2],
      });

      for (let i = 0; i < n - 1; i++) {
        let minIndex = i;

        steps.push({
          array: [...array],
          comparing: [i],
          sorted: [...sorted],
          description: `Pass ${i + 1}: Finding minimum element from index ${i} onwards. Current minimum: arr[${i}]=${array[i]}`,
          highlightLines: [4, 5],
        });

        for (let j = i + 1; j < n; j++) {
          steps.push({
            array: [...array],
            comparing: [minIndex, j],
            sorted: [...sorted],
            description: `Comparing arr[${j}]=${array[j]} with current minimum arr[${minIndex}]=${array[minIndex]}`,
            highlightLines: [7, 8],
          });

          if (array[j] < array[minIndex]) {
            minIndex = j;
            steps.push({
              array: [...array],
              comparing: [minIndex],
              sorted: [...sorted],
              description: `New minimum found! arr[${minIndex}]=${array[minIndex]} is now the minimum`,
              highlightLines: [8, 9],
            });
          }
        }

        if (minIndex !== i) {
          steps.push({
            array: [...array],
            swapping: [i, minIndex],
            sorted: [...sorted],
            description: `Swapping arr[${i}]=${array[i]} with minimum arr[${minIndex}]=${array[minIndex]}`,
            highlightLines: [14, 15, 16, 17],
          });

          const temp = array[i];
          array[i] = array[minIndex];
          array[minIndex] = temp;
        }

        sorted.push(i);
        steps.push({
          array: [...array],
          sorted: [...sorted],
          description: `Element ${array[i]} is now in its sorted position at index ${i}`,
          highlightLines: [18],
        });
      }

      sorted.push(n - 1);
      steps.push({
        array: [...array],
        sorted: [...sorted],
        description: "✓ Sorting complete! All elements are in order",
        highlightLines: [19],
      });

      return steps;
    },
  },
  insertion: {
    name: "Insertion Sort",
    language: "java",
    code: `public void insertionSort(int[] arr) {
    int n = arr.length;
    
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        
        arr[j + 1] = key;
    }
}`,
    complexity: {
      time: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
      space: "O(1)",
      description:
        "Insertion sort builds the final sorted array one item at a time. It iterates through an input array and removes one element per iteration, finds the place it belongs within the sorted list, and inserts it there.",
    },
    generate: (arr: number[]): Step[] => {
      const steps: Step[] = [];
      const array = [...arr];
      const n = array.length;
      const sorted: number[] = [0];

      steps.push({
        array: [...array],
        sorted: [0],
        description: "Initial array - First element is considered sorted",
        highlightLines: [1, 2],
      });

      for (let i = 1; i < n; i++) {
        const key = array[i];

        steps.push({
          array: [...array],
          comparing: [i],
          sorted: [...sorted],
          description: `Picking key = arr[${i}] = ${key} to insert into sorted portion`,
          highlightLines: [4, 5],
        });

        let j = i - 1;

        steps.push({
          array: [...array],
          comparing: [i, j],
          sorted: [...sorted],
          description: `Starting from j=${j}, comparing with key=${key}`,
          highlightLines: [6, 8],
        });

        while (j >= 0 && array[j] > key) {
          steps.push({
            array: [...array],
            swapping: [j, j + 1],
            sorted: [...sorted],
            description: `arr[${j}]=${array[j]} > key=${key}, shifting arr[${j}] to position ${j + 1}`,
            highlightLines: [8, 9],
          });

          array[j + 1] = array[j];
          j--;

          if (j >= 0) {
            steps.push({
              array: [...array],
              comparing: [j, j + 1],
              sorted: [...sorted],
              description: `Moved to j=${j}, continuing comparison`,
              highlightLines: [10, 8],
            });
          }
        }

        array[j + 1] = key;
        sorted.push(i);

        steps.push({
          array: [...array],
          sorted: [...sorted],
          description: `Inserted key=${key} at position ${j + 1}. Elements 0 to ${i} are now sorted`,
          highlightLines: [13],
        });
      }

      steps.push({
        array: [...array],
        sorted: [...sorted],
        description: "✓ Sorting complete! All elements are in order",
        highlightLines: [14],
      });

      return steps;
    },
  },
  merge: {
    name: "Merge Sort",
    language: "java",
    code: `public void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        
        merge(arr, left, mid, right);
    }
}

void merge(int[] arr, int l, int m, int r) {
    int[] temp = new int[r - l + 1];
    int i = l, j = m + 1, k = 0;
    
    while (i <= m && j <= r) {
        if (arr[i] <= arr[j]) {
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
        }
    }
    
    while (i <= m) temp[k++] = arr[i++];
    while (j <= r) temp[k++] = arr[j++];
    
    for (i = l; i <= r; i++) {
        arr[i] = temp[i - l];
    }
}`,
    complexity: {
      time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
      space: "O(n)",
      description:
        "Merge sort is a divide and conquer algorithm that divides the input array into two halves, recursively sorts them, and then merges the two sorted halves.",
    },
    generate: (arr: number[]): Step[] => {
      const steps: Step[] = [];
      const array = [...arr];

      steps.push({
        array: [...array],
        description: "Initial array - Starting Merge Sort (divide and conquer)",
        highlightLines: [1, 2],
      });

      function mergeSortHelper(left: number, right: number, depth: number = 0) {
        if (left >= right) return;

        const mid = Math.floor(left + (right - left) / 2);

        steps.push({
          array: [...array],
          comparing: Array.from({ length: right - left + 1 }, (_, i) => left + i),
          description: `Dividing array: indices [${left}...${mid}] and [${mid + 1}...${right}]`,
          highlightLines: [3, 5, 6],
        });

        mergeSortHelper(left, mid, depth + 1);
        mergeSortHelper(mid + 1, right, depth + 1);

        merge(left, mid, right);
      }

      function merge(left: number, mid: number, right: number) {
        const temp: number[] = [];
        let i = left,
          j = mid + 1;

        steps.push({
          array: [...array],
          comparing: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
          description: `Merging subarrays [${left}...${mid}] and [${mid + 1}...${right}]`,
          highlightLines: [8, 12, 13, 14],
        });

        while (i <= mid && j <= right) {
          steps.push({
            array: [...array],
            comparing: [i, j],
            description: `Comparing arr[${i}]=${array[i]} with arr[${j}]=${array[j]}`,
            highlightLines: [16, 17, 18, 19, 20, 21],
          });

          if (array[i] <= array[j]) {
            temp.push(array[i]);
            i++;
          } else {
            temp.push(array[j]);
            j++;
          }
        }

        while (i <= mid) {
          temp.push(array[i]);
          i++;
        }
        while (j <= right) {
          temp.push(array[j]);
          j++;
        }

        for (let k = 0; k < temp.length; k++) {
          array[left + k] = temp[k];
        }

        steps.push({
          array: [...array],
          sorted: Array.from({ length: temp.length }, (_, k) => left + k),
          description: `Merged result for indices [${left}...${right}]: [${temp.join(", ")}]`,
          highlightLines: [27, 28, 29],
        });
      }

      mergeSortHelper(0, array.length - 1);

      steps.push({
        array: [...array],
        sorted: Array.from({ length: array.length }, (_, i) => i),
        description: "✓ Sorting complete! All elements are in order",
        highlightLines: [10],
      });

      return steps;
    },
  },
  quick: {
    name: "Quick Sort",
    language: "java",
    code: `public void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pivotIndex = partition(arr, low, high);
        
        quickSort(arr, low, pivotIndex - 1);
        quickSort(arr, pivotIndex + 1, high);
    }
}

int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    
    return i + 1;
}`,
    complexity: {
      time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)" },
      space: "O(log n)",
      description:
        "Quick sort picks an element as pivot and partitions the array around the pivot. Elements smaller than pivot are placed before it and elements greater are placed after it.",
    },
    generate: (arr: number[]): Step[] => {
      const steps: Step[] = [];
      const array = [...arr];

      steps.push({
        array: [...array],
        description: "Initial array - Starting Quick Sort",
        highlightLines: [1, 2],
      });

      function quickSortHelper(low: number, high: number) {
        if (low >= high) return;

        const pivotIndex = partition(low, high);

        steps.push({
          array: [...array],
          sorted: [pivotIndex],
          description: `Pivot ${array[pivotIndex]} is now in its final sorted position at index ${pivotIndex}`,
          highlightLines: [3, 5, 6],
        });

        quickSortHelper(low, pivotIndex - 1);
        quickSortHelper(pivotIndex + 1, high);
      }

      function partition(low: number, high: number): number {
        const pivot = array[high];
        let i = low - 1;

        steps.push({
          array: [...array],
          pivot: high,
          description: `Partitioning: chosen pivot = arr[${high}] = ${pivot}`,
          highlightLines: [10, 11, 12],
        });

        for (let j = low; j < high; j++) {
          steps.push({
            array: [...array],
            comparing: [j, high],
            pivot: high,
            description: `Comparing arr[${j}]=${array[j]} with pivot=${pivot}`,
            highlightLines: [14, 15],
          });

          if (array[j] < pivot) {
            i++;

            steps.push({
              array: [...array],
              swapping: [i, j],
              pivot: high,
              description: `arr[${j}]=${array[j]} < pivot, swapping arr[${i}] with arr[${j}]`,
              highlightLines: [16, 17, 18, 19],
            });

            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
          }
        }

        steps.push({
          array: [...array],
          swapping: [i + 1, high],
          pivot: high,
          description: `Placing pivot ${pivot} at its correct position: swapping arr[${i + 1}] with arr[${high}]`,
          highlightLines: [23, 24, 25],
        });

        const temp = array[i + 1];
        array[i + 1] = array[high];
        array[high] = temp;

        steps.push({
          array: [...array],
          pivot: i + 1,
          description: `Partition complete. Pivot ${array[i + 1]} at index ${i + 1}`,
          highlightLines: [27],
        });

        return i + 1;
      }

      quickSortHelper(0, array.length - 1);

      steps.push({
        array: [...array],
        sorted: Array.from({ length: array.length }, (_, i) => i),
        description: "✓ Sorting complete! All elements are in order",
        highlightLines: [7],
      });

      return steps;
    },
  },
};
